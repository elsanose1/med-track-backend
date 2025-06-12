import { UserType } from "../models/User";

// =================== Auth Types ===================

/** Request for: POST /api/auth/register (patient registration) */
export interface RegisterPatientRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // ISO date string
  phoneNumber?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string[];
}

/** Request for: POST /api/auth/register (pharmacy registration) */
export interface RegisterPharmacyRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  userType: "pharmacy";
  licenseNumber: string;
  pharmacyName: string;
  phoneNumber?: string;
  address?: string;
}

/** Response from: POST /api/auth/register */
export interface RegisterResponse {
  message: string;
}

/** Request for: POST /api/auth/login */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Response from: POST /api/auth/login */
export interface LoginResponse {
  token: string;
  isVerified?: boolean; // Only for pharmacy users
  message?: string;
}

/** Request for: POST /api/auth/change-password */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Response from: POST /api/auth/change-password */
export interface ChangePasswordResponse {
  message: string;
}

// =================== User Types ===================

/** Response from: GET /api/users/profile */
export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  dateOfBirth?: string; // ISO date string
  phoneNumber?: string;
  address?: string;
  // Patient specific fields
  medicalHistory?: string;
  allergies?: string[];
  // Pharmacy specific fields
  licenseNumber?: string;
  pharmacyName?: string;
  isVerified?: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Request for: PUT /api/users/profile */
export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // ISO date string
  phoneNumber?: string;
  address?: string;
  // Patient specific fields
  medicalHistory?: string;
  allergies?: string[];
  // Pharmacy specific fields
  licenseNumber?: string;
  pharmacyName?: string;
}

/** Response from: PUT /api/users/profile */
export type UpdateUserProfileResponse = UserProfile;

// =================== Medication Types ===================

/** Part of Medication response objects */
export interface Reminder {
  _id: string;
  medicationId: string;
  time: string; // ISO date string
  status: "pending" | "taken" | "missed" | "snoozed";
  snoozedUntil?: string; // ISO date string
  completedAt?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Used in GET /api/medications/:id and GET /api/medications responses */
export interface Medication {
  _id: string;
  patient: string;
  drugId: string;
  name: string;
  brandName: string;
  genericName: string;
  dosage: string;
  frequency: {
    times: number;
    period: "day" | "week" | "month";
    specificDays?: number[]; // 0-6 for Sunday-Saturday
    specificDates?: number[]; // 1-31 for dates
  };
  instructions?: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  reminders: Reminder[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Request for: POST /api/medications */
export interface AddMedicationRequest {
  drugId: string;
  dosage: string;
  frequency: {
    times: number;
    period: "day" | "week" | "month";
    specificDays?: number[]; // 0-6 for Sunday-Saturday
    specificDates?: number[]; // 1-31 for dates
  };
  instructions?: string;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
}

/** Response from: POST /api/medications */
export type AddMedicationResponse = Medication;

/** Request for: PUT /api/medications/:id */
export interface UpdateMedicationRequest {
  dosage?: string;
  frequency?: {
    times: number;
    period: "day" | "week" | "month";
    specificDays?: number[]; // 0-6 for Sunday-Saturday
    specificDates?: number[]; // 1-31 for dates
  };
  instructions?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

/** Response from: PUT /api/medications/:id */
export type UpdateMedicationResponse = Medication;

/** Response from: DELETE /api/medications/:id */
export interface DeleteMedicationResponse {
  message: string;
}

/** Response from: GET /api/medications */
export interface GetMedicationsResponse {
  medications: Medication[];
}

/** Response from: GET /api/medications/:id */
export interface GetMedicationResponse {
  medication: Medication;
}

/** Request for: PATCH /api/medications/:medicationId/reminders/:reminderId */
export interface UpdateReminderStatusRequest {
  status: "taken" | "missed" | "snoozed";
  snoozeMinutes?: number; // Only for "snoozed" status
}

/** Response from: PATCH /api/medications/:medicationId/reminders/:reminderId */
export interface UpdateReminderStatusResponse {
  message: string;
  reminder: Reminder;
}

/** Used in GET /api/medications/upcoming response */
export interface UpcomingReminder {
  _id: string;
  medicationId: string;
  medicationName: string;
  genericName: string;
  dosage: string;
  time: string; // ISO date string
  instructions?: string;
  status: "pending" | "taken" | "missed" | "snoozed";
}

/** Response from: GET /api/medications/upcoming */
export interface UpcomingRemindersResponse {
  reminders: UpcomingReminder[];
}

// =================== Drug Types ===================

/** Used in drug-related responses */
export interface DrugInfo {
  id: string;
  brandName: string;
  genericName: string;
  purpose: string[];
  activeIngredients: string[];
  warnings: string[];
  usage: string[];
  dosage: string[];
  sideEffects?: string[];
  whenToStop?: string[];
  manufacturer: string;
  substanceNames: string[];
  route: string[];
}

/** Response from: GET /api/drugs and GET /api/drugs/search */
export interface GetDrugsResponse {
  meta: {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: {
      skip: number;
      limit: number;
      total: number;
    };
  };
  results: DrugInfo[];
}

/** Response from: GET /api/drugs/:id */
export interface GetDrugResponse {
  drug: DrugInfo;
}

// =================== Chat Types ===================

/** Used in chat-related responses */
export interface ChatUser {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  pharmacyName?: string;
}

/** Used in chat message responses */
export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  receiver: ChatUser;
  message: string;
  read: boolean;
  createdAt: string; // ISO date string
}

/** Used in conversation responses */
export interface ChatConversation {
  _id: string;
  patient: ChatUser;
  pharmacy: ChatUser;
  lastMessage: string;
  lastMessageDate: string; // ISO date string
  unreadPatient: number;
  unreadPharmacy: number;
  messages: string[]; // Message IDs
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Response from: GET /api/chat/conversations */
export interface GetConversationsResponse {
  conversations: ChatConversation[];
}

/** Response from: GET /api/chat/conversation/:conversationId/messages */
export interface GetMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/** Request for: POST /api/chat/conversation/:conversationId/message */
export interface SendMessageRequest {
  message: string;
}

/** Response from: POST /api/chat/conversation/:conversationId/message */
export interface SendMessageResponse extends ChatMessage {
  receiverOnline: boolean;
}

/** Response from: PUT /api/chat/conversation/:conversationId/read */
export interface MarkAsReadResponse {
  message: string;
}

/** Used in pharmacy listing response */
export interface ChatPharmacy {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  pharmacyName: string;
  licenseNumber: string;
}

/** Response from: GET /api/chat/pharmacies */
export interface ListPharmaciesResponse {
  pharmacies: ChatPharmacy[];
}

/** Response from: GET /api/chat/status/:userId */
export interface GetOnlineStatusResponse {
  onlineStatus: Record<string, boolean>;
}

/** Response from: GET /api/chat/conversation/pharmacy/:pharmacyId */
export interface GetOrCreateConversationResponse {
  conversation: ChatConversation;
}

// =================== Admin Types ===================

/** Request for: POST /api/admin/pharmacies */
export interface CreatePharmacyAccountRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  pharmacyName: string;
  phoneNumber?: string;
  address?: string;
}

/** Response from: POST /api/admin/pharmacies */
export interface CreatePharmacyAccountResponse {
  message: string;
  pharmacy: Omit<UserProfile, "password">;
}

/** Request for: POST /api/admin/admins */
export interface CreateAdminAccountRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
}

/** Response from: POST /api/admin/admins */
export interface CreateAdminAccountResponse {
  message: string;
  admin: Omit<UserProfile, "password">;
}

/** Used in pending pharmacy response */
export interface PendingPharmacy {
  _id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  pharmacyName: string;
  licenseNumber: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string; // ISO date string
}

/** Response from: GET /api/admin/pharmacies/pending */
export interface GetPendingPharmaciesResponse {
  pharmacies: PendingPharmacy[];
}

/** Request for: PUT /api/admin/pharmacies/:pharmacyId/verify */
export interface VerifyPharmacyRequest {
  approve: boolean;
}

/** Response from: PUT /api/admin/pharmacies/:pharmacyId/verify */
export interface VerifyPharmacyResponse {
  message: string;
  pharmacy?: {
    id: string;
    username: string;
    email: string;
    pharmacyName: string;
    isVerified: boolean;
  };
}

// =================== Test Reminder Types ===================

/**
 * Response from:
 * - POST /api/medications/:medicationId/test-reminder
 * - POST /api/medications/:medicationId/reminders/:reminderId/test
 */
export interface TestReminderResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    medicationId: string;
    medicationName: string;
    genericName: string;
    dosage: string;
    time: string; // ISO date string
    instructions?: string;
    isTestReminder: boolean;
  };
}

// =================== Error Types ===================

/** Standard error response format from any API endpoint */
export interface ApiError {
  message: string;
  error?: any;
  code?: string;
  status?: number;
}
