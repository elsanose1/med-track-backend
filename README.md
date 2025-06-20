# Med-Track Backend

A comprehensive medication tracking and reminder system that helps patients manage their medications with real-time reminders and tracking.

## Features

- **Medication Management**: Add, update, and delete medications from FDA database
- **Smart Reminders**: Set up reminder schedules with flexible frequency options
- **Real-time Notifications**: Receive medication reminders in real-time via Socket.IO
- **Medication Adherence**: Track medication adherence with status updates (taken, missed, snoozed)
- **User Authentication**: Secure JWT-based authentication system
- **Role-based Access**: Different features for patients, pharmacies, and admins
- **Chat System**: Built-in communication between patients and pharmacies
- **Pharmacy Verification**: Admin approval system for pharmacy registration
- **Caching System**: Efficient caching for drug data to reduce API calls
- **TypeScript Types**: Comprehensive TypeScript definitions for API requests and responses

## Tech Stack

- **Node.js** with **Express** for RESTful API
- **MongoDB** with **Mongoose** for data storage
- **Socket.IO** for real-time notifications
- **JWT** for authentication
- **TypeScript** for type safety
- **Node-Cache** for in-memory caching

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/med-track.git
cd med-track/backend
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the project root

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/med-track
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3001
```

4. Start the development server

```bash
npm run dev
```

## API Types for Frontend Development

We provide comprehensive TypeScript type definitions for all API requests and responses in `src/types/api.types.ts`. Each interface is annotated with JSDoc comments indicating which API endpoint it corresponds to, making it clear what data structure to expect from each endpoint.

### Using the Types in a Frontend Project

1. **Copy the types to your frontend project**:

   You can copy the `src/types/api.types.ts` file to your frontend project, or set up a shared types package.

2. **Import and use the types with endpoint clarity**:

   ```typescript
   // Example usage in a frontend API service
   import { LoginRequest, LoginResponse, ApiError } from "./types/api.types";

   // The LoginResponse type is documented as: Response from: POST /api/auth/login
   async function login(credentials: LoginRequest): Promise<LoginResponse> {
     try {
       const response = await fetch("/api/auth/login", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(credentials),
       });

       if (!response.ok) {
         const errorData: ApiError = await response.json();
         throw new Error(errorData.message);
       }

       return (await response.json()) as LoginResponse;
     } catch (error) {
       console.error("Login failed:", error);
       throw error;
     }
   }
   ```

3. **Benefits**:

   - Type checking for request payloads
   - Autocompletion for response properties
   - Clear documentation of which endpoint returns what data
   - Easy to understand API response structure expectations
   - Safer refactoring when API changes

### Key Type Categories

All types in the API types file are clearly documented with JSDoc comments showing which endpoint returns them:

- **Auth Types**: `/** Response from: POST /api/auth/login */`
- **User Types**: `/** Response from: GET /api/users/profile */`
- **Medication Types**: `/** Response from: GET /api/medications */`
- **Drug Types**: `/** Response from: GET /api/drugs/search */`
- **Chat Types**: `/** Response from: GET /api/chat/conversations */`
- **Admin Types**: `/** Response from: GET /api/admin/pharmacies/pending */`

### Where to Find the Types

The types are located in `src/types/api.types.ts` and exported via `src/types/index.ts`. You can copy these files to your frontend project or set up a shared library.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new patient

  - Request: `{ username, email, password, firstName, lastName, dateOfBirth, phoneNumber, address, medicalHistory, allergies }`
  - Response: `{ message: "User registered successfully" }`

- `POST /api/auth/login` - Login for patients and pharmacies

  - Request: `{ email, password }`
  - Response: `{ token, isVerified?, message? }`

- `POST /api/auth/change-password` - Change user password (requires authentication)
  - Request: `{ currentPassword, newPassword }`
  - Response: `{ message: "Password changed successfully" }`

### Pharmacy Registration and Verification

- `POST /api/auth/register` - Register a new pharmacy (with userType=pharmacy)
- `GET /api/admin/pharmacies/pending` - Admin only: Get all pending pharmacy accounts
- `PUT /api/admin/pharmacies/:pharmacyId/verify` - Admin only: Approve or reject a pharmacy

### Medications

- `GET /api/medications` - Get patient's medications
- `POST /api/medications` - Add a new medication
- `GET /api/medications/:id` - Get a specific medication
- `PUT /api/medications/:id` - Update a medication
- `DELETE /api/medications/:id` - Delete a medication
- `PATCH /api/medications/:medicationId/reminders/:reminderId` - Update reminder status
- `GET /api/medications/upcoming` - Get upcoming reminders

### Testing Endpoints

- `POST /api/medications/:medicationId/test-reminder` - Trigger a test reminder for a medication
- `POST /api/medications/:medicationId/reminders/:reminderId/test` - Trigger a test for a specific reminder

### Drugs

- `GET /api/drugs` - Get available drugs (paginated)
- `GET /api/drugs/search` - Search drugs by brand name
- `GET /api/drugs/:id` - Get drug details by ID

### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Chat

- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/conversations` - Create a new conversation
- `GET /api/chat/conversations/:id/messages` - Get messages for a conversation
- `POST /api/chat/conversations/:id/messages` - Send a message
- `GET /api/chat/pharmacies` - Patient only: List all verified pharmacies
- `GET /api/chat/status/:userId` - Check if a user is online

### Admin

- `POST /api/admin/pharmacies` - Create a pharmacy account (automatically verified)
- `POST /api/admin/admins` - Create an admin account
- `GET /api/admin/pharmacies/pending` - Get pending pharmacy verifications
- `PUT /api/admin/pharmacies/:pharmacyId/verify` - Approve or reject a pharmacy

## Pharmacy Registration and Verification System

The Med-Track platform includes a pharmacy verification system that ensures only legitimate pharmacies can interact with patients:

### Registration Flow

1. **Pharmacy Self-Registration**:

   - Pharmacies can register through the standard registration endpoint
   - Must include `userType: "pharmacy"`, `licenseNumber`, and `pharmacyName`
   - New pharmacy accounts are created with `isVerified: false`

2. **Admin Verification**:

   - Administrators can view pending pharmacies via `GET /api/admin/pharmacies/pending`
   - Approve or reject pharmacies with `PUT /api/admin/pharmacies/:pharmacyId/verify`
   - Set `approve: true` to verify, or `approve: false` to reject

3. **Pharmacy Login**:
   - Pharmacy users receive verification status with their login token
   - Unverified pharmacies receive a notification that their account is pending approval

### Access Control

- **Unverified Pharmacies**:

  - Can log in to their account and view their profile
  - Cannot message patients or appear in pharmacy listings
  - Receive clear messages about their verification status

- **Verified Pharmacies**:

  - Listed in the patient's pharmacy search
  - Can participate in conversations with patients
  - Have full access to pharmacy features

- **Admin Tools**:
  - Admins can create pre-verified pharmacy accounts
  - View and manage pending verification requests
  - Approve or reject pharmacy registrations

## Reminder System

The system uses a combination of MongoDB and Socket.IO to handle medication reminders:

1. When a medication is added, reminder times are generated based on the frequency
2. A cron job runs every minute to check for upcoming reminders
3. When it's time for a medication, online users receive a real-time notification
4. Users can mark reminders as taken, snooze them, or mark as missed

### Testing Reminders

For development and testing purposes, you can manually trigger reminders without waiting for scheduled times:

- To test a medication reminder with current time: `POST /api/medications/:medicationId/test-reminder`
- To test a specific reminder: `POST /api/medications/:medicationId/reminders/:reminderId/test`

Note: Test reminders will only be sent if the patient is currently online (connected via Socket.IO).

### Step-by-Step Testing Guide

1. **Prerequisites**:

   - Make sure you have a patient user account
   - Add at least one medication with reminders to your account
   - Ensure your frontend is connected to Socket.IO

2. **Test Setup**:

   - Log in as a patient user to get a JWT token
   - Connect to Socket.IO with the token (on the frontend)
   - Get your medication IDs by calling `GET /api/medications`

3. **Testing Generic Reminder**:

   ```bash
   curl -X POST http://localhost:3000/api/medications/YOUR_MEDICATION_ID/test-reminder \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

4. **Testing Specific Reminder**:

   - Get reminder IDs by calling `GET /api/medications/YOUR_MEDICATION_ID`
   - Then send:

   ```bash
   curl -X POST http://localhost:3000/api/medications/YOUR_MEDICATION_ID/reminders/YOUR_REMINDER_ID/test \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

5. **Expected Response**:

   ```json
   {
     "success": true,
     "message": "Test reminder sent to patient 60d21b4667d0d8992e610c85 for medication Aspirin",
     "data": {
       "id": "60e32c8f9b7543001c123456",
       "medicationId": "60e32c8f9b7543001c789012",
       "medicationName": "Aspirin",
       "genericName": "Acetylsalicylic acid",
       "dosage": "81mg",
       "time": "2023-06-15T10:30:00.000Z",
       "instructions": "Take with food",
       "isTestReminder": true
     }
   }
   ```

6. **Listening on the Frontend**:

   ```javascript
   // Connect to Socket.IO
   const socket = io("http://localhost:3000", {
     auth: { token: "YOUR_JWT_TOKEN" },
   });

   // Listen for medication reminders
   socket.on("medication_reminder", (reminder) => {
     console.log("Received medication reminder:", reminder);
     // Show notification to the user
     if (reminder.isTestReminder) {
       console.log("This is a test reminder");
     }

     // Handle the reminder (show notification, etc.)
     showMedicationReminder(reminder);
   });

   // Function to respond to the reminder
   function respondToReminder(medicationId, reminderId, action) {
     socket.emit("reminder_response", {
       medicationId,
       reminderId,
       action, // "taken", "snooze", or "missed"
       snoozeMinutes: action === "snooze" ? 15 : undefined, // Only for snooze
     });
   }
   ```

7. **Troubleshooting**:
   - If you get a 403 error, make sure you're using a patient user's token
   - If you get "Patient is not online" message, ensure Socket.IO connection is established
   - Check the server console for any error messages

## Caching System

The application implements an efficient caching system for drug-related API calls to reduce load on the FDA API and improve response times:

- **In-memory Cache**: Using node-cache for fast, temporary storage
- **Tiered TTL Strategy**: Different TTLs for different types of data:
  - All drugs list: 1 hour cache
  - Drug search results: 2 hours cache
  - Individual drug details: 6 hours cache
- **Automatic Cache Invalidation**: TTL-based expiration

## Real-time Features

The Socket.IO integration provides:

- Real-time medication reminders
- Instant reminder status updates
- Live chat between patients and pharmacies

## License

This project is licensed under the MIT License - see the LICENSE file for details.
