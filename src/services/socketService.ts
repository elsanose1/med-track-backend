import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { UserType } from "../models/User";
import { ChatMessage, ChatConversation } from "../models/Chat";
import User from "../models/User";
import {
  markReminderAsCompleted,
  markReminderAsMissed,
  snoozeReminder,
} from "./reminderService";

// Interface for socket user data
interface SocketUser {
  id: string;
  userType: UserType;
  socketId: string;
}

// Map to store online users
const onlineUsers: Map<string, SocketUser> = new Map();

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // In production, restrict this to your frontend domain
      methods: ["GET", "POST"],
    },
  });

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      // Verify JWT token
      const jwtSecret = String(process.env.JWT_SECRET);
      const decoded = jwt.verify(token, jwtSecret) as any;

      // Add user data to socket
      socket.data.user = {
        id: decoded.id,
        userType: decoded.userType,
        username: decoded.username,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      };

      next();
    } catch (error) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  // Handle connections
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    const userId = socket.data.user.id;

    // Add user to online users map
    onlineUsers.set(userId, {
      id: userId,
      userType: socket.data.user.userType,
      socketId: socket.id,
    });

    // Join user to their personal room for direct messages
    socket.join(`user:${userId}`);

    // Handle joining a specific conversation room
    socket.on("join_conversation", async (conversationId) => {
      try {
        // Verify the user is part of the conversation
        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant =
          conversation.patient.toString() === userId ||
          conversation.pharmacy.toString() === userId;

        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error("Error joining conversation:", error);
      }
    });

    // --- POPUP NOTIFICATION EVENTS ---
    // Patient triggers a popup to all pharmacists
    socket.on("patient_popup_request", (popupData) => {
      const pharmacistSocketIds = getPharmacistSocketIds();
      pharmacistSocketIds.forEach((socketId) => {
        io.to(socketId).emit("show_popup", {
          patientId: socket.data.user.id,
          ...popupData,
        });
      });
    });

    // Patient cancels popup request
    socket.on("patient_popup_cancel", () => {
      const pharmacistSocketIds = getPharmacistSocketIds();
      pharmacistSocketIds.forEach((socketId) => {
        io.to(socketId).emit("close_popup", {
          patientId: socket.data.user.id,
        });
      });
    });

    // Pharmacist responds to popup
    socket.on("pharmacist_popup_response", (responseData) => {
      const patientId = responseData.patientId;
      const patientUser = onlineUsers.get(patientId);

      // Notify the patient
      if (patientUser) {
        io.to(patientUser.socketId).emit("popup_response", responseData);
      }

      // Close the popup for all pharmacists for this patient
      const pharmacistSocketIds = getPharmacistSocketIds();
      pharmacistSocketIds.forEach((socketId) => {
        io.to(socketId).emit("close_popup", {
          patientId,
          closedBy: socket.data.user.id, // Optionally, include which pharmacist closed it
        });
      });
    });
    // --- END POPUP EVENTS ---

    // Handle leaving a conversation room
    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    // Handle medication reminder responses
    socket.on("reminder_response", async (data) => {
      const { medicationId, reminderId, action, snoozeMinutes } = data;

      try {
        switch (action) {
          case "taken":
            await markReminderAsCompleted(medicationId, reminderId);
            socket.emit("reminder_update", {
              medicationId,
              reminderId,
              status: "completed",
            });
            break;

          case "snooze":
            await snoozeReminder(medicationId, reminderId, snoozeMinutes || 15);
            socket.emit("reminder_update", {
              medicationId,
              reminderId,
              status: "snoozed",
            });
            break;

          case "missed":
            await markReminderAsMissed(medicationId, reminderId);
            socket.emit("reminder_update", {
              medicationId,
              reminderId,
              status: "missed",
            });
            break;

          default:
            console.error(`Unknown reminder action: ${action}`);
        }
      } catch (error) {
        console.error("Error handling reminder response:", error);
        socket.emit("reminder_error", {
          medicationId,
          reminderId,
          error: "Failed to process reminder response",
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Function to emit a new message event
export async function emitNewMessage(message: any, conversationId: string) {
  const io = getSocketIOInstance();
  if (!io) return;

  // Emit to the conversation room
  io.to(`conversation:${conversationId}`).emit("new_message", message);

  // Also emit to the recipient's personal room if they aren't in the conversation room
  io.to(`user:${message.receiver._id}`).emit("new_message_notification", {
    conversationId,
    message,
  });
}

// Function to emit a message read event
export function emitMessagesRead(conversationId: string, userId: string) {
  const io = getSocketIOInstance();
  if (!io) return;

  io.to(`conversation:${conversationId}`).emit("messages_read", {
    conversationId,
    userId,
  });
}

// Singleton instance of Socket.IO server
let socketIOInstance: SocketIOServer | null = null;

// Get the Socket.IO instance
export function getSocketIOInstance(): SocketIOServer | null {
  return socketIOInstance;
}

// Set the Socket.IO instance
export function setSocketIOInstance(io: SocketIOServer): void {
  socketIOInstance = io;
}

// Check if a user is online
export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}

// Get online users
export function getOnlineUsers(): SocketUser[] {
  return Array.from(onlineUsers.values());
}

// Get all connected pharmacist socket IDs
function getPharmacistSocketIds(): string[] {
  return Array.from(onlineUsers.values())
    .filter((user) => user.userType === UserType.PHARMACY)
    .map((user) => user.socketId);
}
