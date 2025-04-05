import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth";
import { ChatMessage, ChatConversation } from "../models/Chat";
import User from "../models/User";
import { UserType } from "../models/User";
import mongoose from "mongoose";
import {
  emitNewMessage,
  emitMessagesRead,
  isUserOnline,
  getOnlineUsers,
} from "../services/socketService";

/**
 * Start a new conversation or get existing one between a patient and a pharmacy
 */
export async function getOrCreateConversation(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { pharmacyId } = req.params;
    const patientId = req.user.id;

    // Verify the pharmacy exists and is a pharmacy type
    const pharmacy = await User.findOne({
      _id: pharmacyId,
      userType: UserType.PHARMACY,
    });
    if (!pharmacy) {
      return res.status(404).json({ message: "Pharmacy not found" });
    }

    // If the user is not a patient, they cannot initiate a conversation
    if (req.user.userType !== UserType.PATIENT) {
      return res.status(403).json({
        message: "Only patients can initiate conversations with pharmacies",
      });
    }

    // Find existing conversation or create a new one
    let conversation = await ChatConversation.findOne({
      patient: patientId,
      pharmacy: pharmacyId,
    });

    if (!conversation) {
      conversation = new ChatConversation({
        patient: patientId,
        pharmacy: pharmacyId,
      });
      await conversation.save();
    }

    // Return the conversation with populated user details
    const populatedConversation = await ChatConversation.findById(
      conversation._id
    )
      .populate("patient", "username firstName lastName")
      .populate("pharmacy", "username firstName lastName pharmacyName");

    res.json(populatedConversation);
  } catch (err) {
    res.status(500).json({
      message: "Error getting or creating conversation",
      error: err,
    });
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const senderId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find the conversation
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify the user is part of the conversation
    const isPatient = conversation.patient.toString() === senderId;
    const isPharmacy = conversation.pharmacy.toString() === senderId;

    if (!isPatient && !isPharmacy) {
      return res.status(403).json({
        message: "You are not a participant in this conversation",
      });
    }

    // Determine receiver
    const receiverId = isPatient ? conversation.pharmacy : conversation.patient;

    // Create new message
    const newMessage = new ChatMessage({
      sender: senderId,
      receiver: receiverId,
      message,
    });
    await newMessage.save();

    // Update conversation with new message
    conversation.messages.push(
      newMessage._id as unknown as mongoose.Types.ObjectId
    );
    conversation.lastMessage = message;
    conversation.lastMessageDate = new Date();

    // Update unread count for the recipient
    if (isPatient) {
      conversation.unreadPharmacy += 1;
    } else {
      conversation.unreadPatient += 1;
    }

    await conversation.save();

    // Return the new message
    const populatedMessage = await ChatMessage.findById(newMessage._id)
      .populate("sender", "username firstName lastName userType")
      .populate("receiver", "username firstName lastName userType");

    if (!populatedMessage) {
      return res.status(500).json({
        message: "Error retrieving the saved message",
      });
    }

    // Emit the message via Socket.IO for real-time updates
    await emitNewMessage(populatedMessage, conversationId);

    // Check if receiver is online
    const isReceiverOnline = isUserOnline(receiverId.toString());

    res.status(201).json({
      ...populatedMessage.toObject(),
      receiverOnline: isReceiverOnline,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error sending message",
      error: err,
    });
  }
}

/**
 * Get messages in a conversation
 */
export async function getMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    // Convert to numbers
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Find the conversation
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify the user is part of the conversation
    const isPatient = conversation.patient.toString() === userId;
    const isPharmacy = conversation.pharmacy.toString() === userId;

    if (!isPatient && !isPharmacy) {
      return res.status(403).json({
        message: "You are not a participant in this conversation",
      });
    }

    // Get messages with pagination (newest first, then apply limit/skip)
    const messages = await ChatMessage.find({
      _id: { $in: conversation.messages },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("sender", "username firstName lastName userType")
      .populate("receiver", "username firstName lastName userType");

    // Get total count for pagination
    const totalMessages = conversation.messages.length;

    res.json({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        total: totalMessages,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(totalMessages / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error getting messages",
      error: err,
    });
  }
}

/**
 * Mark messages as read in a conversation
 */
export async function markAsRead(req: AuthenticatedRequest, res: Response) {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Find the conversation
    const conversation = await ChatConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify the user is part of the conversation
    const isPatient = conversation.patient.toString() === userId;
    const isPharmacy = conversation.pharmacy.toString() === userId;

    if (!isPatient && !isPharmacy) {
      return res.status(403).json({
        message: "You are not a participant in this conversation",
      });
    }

    // Mark messages as read
    if (isPatient && conversation.unreadPatient > 0) {
      conversation.unreadPatient = 0;
      await ChatMessage.updateMany(
        {
          _id: { $in: conversation.messages },
          receiver: userId,
          read: false,
        },
        { read: true }
      );
    } else if (isPharmacy && conversation.unreadPharmacy > 0) {
      conversation.unreadPharmacy = 0;
      await ChatMessage.updateMany(
        {
          _id: { $in: conversation.messages },
          receiver: userId,
          read: false,
        },
        { read: true }
      );
    }

    await conversation.save();

    // Emit the read status via Socket.IO
    emitMessagesRead(conversationId, userId);

    res.json({ message: "Messages marked as read" });
  } catch (err) {
    res.status(500).json({
      message: "Error marking messages as read",
      error: err,
    });
  }
}

/**
 * Get all conversations for the current user
 */
export async function getConversations(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user.id;
    const userType = req.user.userType;

    let query = {};
    if (userType === UserType.PATIENT) {
      query = { patient: userId };
    } else if (userType === UserType.PHARMACY) {
      query = { pharmacy: userId };
    } else {
      return res.status(403).json({
        message: "Only patients and pharmacies can access conversations",
      });
    }

    // Get all conversations for the user
    const conversations = await ChatConversation.find(query)
      .sort({ lastMessageDate: -1 })
      .populate("patient", "username firstName lastName")
      .populate("pharmacy", "username firstName lastName pharmacyName");

    res.json(conversations);
  } catch (err) {
    res.status(500).json({
      message: "Error getting conversations",
      error: err,
    });
  }
}

/**
 * List all pharmacies for a patient to start a conversation with
 */
export async function listPharmacies(req: AuthenticatedRequest, res: Response) {
  try {
    // Only patients can see the list of pharmacies
    if (req.user.userType !== UserType.PATIENT) {
      return res.status(403).json({
        message: "Only patients can view the list of pharmacies",
      });
    }

    // Get all pharmacy users
    const pharmacies = await User.find({ userType: UserType.PHARMACY })
      .select("username firstName lastName pharmacyName licenseNumber")
      .sort({ pharmacyName: 1 });

    res.json(pharmacies);
  } catch (err) {
    res.status(500).json({
      message: "Error getting pharmacy list",
      error: err,
    });
  }
}

/**
 * Get online status for users
 */
export async function getOnlineStatus(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    const onlineStatus: Record<string, boolean> = {};

    // Check online status for each user
    for (const userId of userIds) {
      onlineStatus[userId] = isUserOnline(userId);
    }

    res.json({ onlineStatus });
  } catch (err) {
    res.status(500).json({
      message: "Error getting online status",
      error: err,
    });
  }
}
