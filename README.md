# Med-Track Backend

A backend service that provides drug information by integrating with the FDA's drug label API. This service allows users to search for drugs by brand name, retrieve specific drug details by ID, and list all available drugs with pagination. The system supports three types of users: patients, pharmacies, and admins.

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (for user authentication)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd med-track/backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the server:

```bash
npm start
```

## 📚 API Documentation

### Authentication Endpoints

#### Register a New User (Patient only)

The registration endpoint only allows creation of patient accounts. Admin and pharmacy accounts must be created by an admin.

```http
POST /api/auth/register
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "1234567890",
    "address": "123 Main St, Anytown, US",
    "medicalHistory": "Hypertension, Diabetes",
    "allergies": ["Penicillin", "Peanuts"]
  }'
```

Request Body:

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "phoneNumber": "1234567890",
  "address": "123 Main St, Anytown, US",
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": ["Penicillin", "Peanuts"]
}
```

Response (201 Created):

```json
{
  "message": "User registered successfully"
}
```

#### User Login

```http
POST /api/auth/login
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword"
  }'
```

Request Body:

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

Response (200 OK):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Change Password

```http
POST /api/auth/change-password
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "oldpassword",
    "newPassword": "newpassword"
  }'
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Request Body:

```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

Response (200 OK):

```json
{
  "message": "Password updated successfully"
}
```

### User Profile Endpoints

#### Get User Profile

```http
GET /api/users/profile
```

Example cURL:

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Response (200 OK):

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01T00:00:00.000Z",
  "userType": "patient",
  "phoneNumber": "1234567890",
  "address": "123 Main St, Anytown, US",
  "medicalHistory": "Hypertension, Diabetes",
  "allergies": ["Penicillin", "Peanuts"],
  "createdAt": "2023-01-01T12:00:00.000Z",
  "updatedAt": "2023-01-01T12:00:00.000Z"
}
```

#### Update User Profile

```http
PUT /api/users/profile
```

Example cURL:

```bash
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "Johnny",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "address": "456 Oak St, Newtown, US"
  }'
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Request Body (include only fields to update):

```json
{
  "firstName": "Johnny",
  "lastName": "Doe",
  "phoneNumber": "9876543210",
  "address": "456 Oak St, Newtown, US",
  "medicalHistory": "Hypertension, Diabetes, Asthma",
  "allergies": ["Penicillin", "Peanuts", "Shellfish"]
}
```

Response (200 OK):

```json
{
  // Updated user profile object (similar to GET profile response)
}
```

### Chat Endpoints (Real-Time Chat Between Patients and Pharmacies)

The chat system utilizes both RESTful API endpoints and WebSocket connections via Socket.IO for real-time communication.

#### REST API Endpoints

##### List All Pharmacies (Patient Only)

```http
GET /api/chat/pharmacies
```

Example cURL:

```bash
curl -X GET http://localhost:3000/api/chat/pharmacies \
  -H "Authorization: Bearer PATIENT_JWT_TOKEN"
```

Headers:

```
Authorization: Bearer <patient_jwt_token>
```

Response (200 OK):

```json
[
  {
    "_id": "60d21b4667d0d8992e610c86",
    "username": "citypharmacy",
    "firstName": "City",
    "lastName": "Pharmacy",
    "pharmacyName": "City Pharmacy Inc.",
    "licenseNumber": "PHR789012"
  },
  {
    "_id": "60d21b4667d0d8992e610c87",
    "username": "healthpharmacy",
    "firstName": "Health",
    "lastName": "Pharmacy",
    "pharmacyName": "Health First Pharmacy",
    "licenseNumber": "PHR789013"
  }
]
```

##### Start or Get a Conversation with a Pharmacy (Patient Only)

```http
GET /api/chat/conversation/pharmacy/:pharmacyId
```

Example cURL:

```bash
curl -X GET http://localhost:3000/api/chat/conversation/pharmacy/60d21b4667d0d8992e610c86 \
  -H "Authorization: Bearer PATIENT_JWT_TOKEN"
```

Headers:

```
Authorization: Bearer <patient_jwt_token>
```

Response (200 OK):

```json
{
  "_id": "60d21b4667d0d8992e610c88",
  "patient": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "pharmacy": {
    "_id": "60d21b4667d0d8992e610c86",
    "username": "citypharmacy",
    "firstName": "City",
    "lastName": "Pharmacy",
    "pharmacyName": "City Pharmacy Inc."
  },
  "lastMessage": "",
  "lastMessageDate": "2023-01-01T12:00:00.000Z",
  "unreadPatient": 0,
  "unreadPharmacy": 0,
  "messages": [],
  "createdAt": "2023-01-01T12:00:00.000Z",
  "updatedAt": "2023-01-01T12:00:00.000Z"
}
```

##### Get All Conversations

```http
GET /api/chat/conversations
```

Example cURL:

```bash
curl -X GET http://localhost:3000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Response (200 OK):

```json
[
  {
    "_id": "60d21b4667d0d8992e610c88",
    "patient": {
      "_id": "60d21b4667d0d8992e610c85",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "pharmacy": {
      "_id": "60d21b4667d0d8992e610c86",
      "username": "citypharmacy",
      "firstName": "City",
      "lastName": "Pharmacy",
      "pharmacyName": "City Pharmacy Inc."
    },
    "lastMessage": "Hello, I have a question about my prescription.",
    "lastMessageDate": "2023-01-01T12:30:00.000Z",
    "unreadPatient": 1,
    "unreadPharmacy": 0,
    "messages": ["60d21b4667d0d8992e610c89"],
    "createdAt": "2023-01-01T12:00:00.000Z",
    "updatedAt": "2023-01-01T12:30:00.000Z"
  }
]
```

##### Get Messages in a Conversation

```http
GET /api/chat/conversation/:conversationId/messages?page=1&limit=20
```

Example cURL:

```bash
curl -X GET "http://localhost:3000/api/chat/conversation/60d21b4667d0d8992e610c88/messages?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Query Parameters:

- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of messages per page (default: 20)

Response (200 OK):

```json
{
  "messages": [
    {
      "_id": "60d21b4667d0d8992e610c89",
      "sender": {
        "_id": "60d21b4667d0d8992e610c85",
        "username": "johndoe",
        "firstName": "John",
        "lastName": "Doe",
        "userType": "patient"
      },
      "receiver": {
        "_id": "60d21b4667d0d8992e610c86",
        "username": "citypharmacy",
        "firstName": "City",
        "lastName": "Pharmacy",
        "userType": "pharmacy"
      },
      "message": "Hello, I have a question about my prescription.",
      "read": false,
      "createdAt": "2023-01-01T12:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

##### Send a Message in a Conversation

```http
POST /api/chat/conversation/:conversationId/message
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/chat/conversation/60d21b4667d0d8992e610c88/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Hello, I have a question about my prescription."
  }'
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Request Body:

```json
{
  "message": "Hello, I have a question about my prescription."
}
```

Response (201 Created):

```json
{
  "_id": "60d21b4667d0d8992e610c89",
  "sender": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "patient"
  },
  "receiver": {
    "_id": "60d21b4667d0d8992e610c86",
    "username": "citypharmacy",
    "firstName": "City",
    "lastName": "Pharmacy",
    "userType": "pharmacy"
  },
  "message": "Hello, I have a question about my prescription.",
  "read": false,
  "createdAt": "2023-01-01T12:30:00.000Z",
  "receiverOnline": true
}
```

##### Mark Messages as Read in a Conversation

```http
PUT /api/chat/conversation/:conversationId/read
```

Example cURL:

```bash
curl -X PUT http://localhost:3000/api/chat/conversation/60d21b4667d0d8992e610c88/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Response (200 OK):

```json
{
  "message": "Messages marked as read"
}
```

##### Get Online Status for Users

```http
POST /api/chat/online-status
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/chat/online-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userIds": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"]
  }'
```

Headers:

```
Authorization: Bearer <jwt_token>
```

Request Body:

```json
{
  "userIds": ["60d21b4667d0d8992e610c85", "60d21b4667d0d8992e610c86"]
}
```

Response (200 OK):

```json
{
  "onlineStatus": {
    "60d21b4667d0d8992e610c85": true,
    "60d21b4667d0d8992e610c86": false
  }
}
```

#### WebSocket Integration (Socket.IO)

In addition to the REST API, Med-Track provides real-time messaging via WebSockets using Socket.IO. This enables:

- Instant message delivery without polling
- Online status indicators
- Typing indicators
- Read receipts in real-time

##### Connection to Socket.IO

To connect to the WebSocket server, use a Socket.IO client and include your JWT token for authentication:

```javascript
// Example using the Socket.IO JavaScript client
const socket = io("http://localhost:3000", {
  auth: {
    token: "YOUR_JWT_TOKEN",
  },
});

// Handle connection errors
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);
});
```

##### Joining a Conversation

To receive real-time updates for a specific conversation, join the conversation room:

```javascript
socket.emit("join_conversation", "CONVERSATION_ID");
```

##### Listening for New Messages

To receive new messages in real-time:

```javascript
socket.on("new_message", (message) => {
  console.log("New message received:", message);
  // Update your UI with the new message
});
```

##### Listening for Message Notifications

To receive notifications of new messages when not in the specific conversation:

```javascript
socket.on("new_message_notification", (data) => {
  console.log(
    `New message in conversation ${data.conversationId}:`,
    data.message
  );
  // Update your UI to show a notification
});
```

##### Listening for Read Receipts

To be notified when your messages are read:

```javascript
socket.on("messages_read", (data) => {
  console.log(
    `Messages read in conversation ${data.conversationId} by user ${data.userId}`
  );
  // Update your UI to show read receipts
});
```

##### Leaving a Conversation

When leaving a conversation view:

```javascript
socket.emit("leave_conversation", "CONVERSATION_ID");
```

### Admin Endpoints

#### Create Pharmacy Account (Admin only)

```http
POST /api/admin/pharmacies
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/admin/pharmacies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "username": "citypharmacy",
    "email": "contact@citypharmacy.com",
    "password": "securepassword",
    "firstName": "City",
    "lastName": "Pharmacy",
    "phoneNumber": "5551234567",
    "address": "789 Market St, Metropolis, US",
    "licenseNumber": "PHR789012",
    "pharmacyName": "City Pharmacy Inc."
  }'
```

Headers:

```
Authorization: Bearer <admin_jwt_token>
```

Request Body:

```json
{
  "username": "citypharmacy",
  "email": "contact@citypharmacy.com",
  "password": "securepassword",
  "firstName": "City",
  "lastName": "Pharmacy",
  "phoneNumber": "5551234567",
  "address": "789 Market St, Metropolis, US",
  "licenseNumber": "PHR789012",
  "pharmacyName": "City Pharmacy Inc."
}
```

Response (201 Created):

```json
{
  "message": "Pharmacy account created successfully",
  "pharmacy": {
    // Pharmacy user object without password
  }
}
```

#### Create Admin Account (Admin only)

```http
POST /api/admin/admins
```

Example cURL:

```bash
curl -X POST http://localhost:3000/api/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "username": "newadmin",
    "email": "newadmin@example.com",
    "password": "admin_password",
    "firstName": "New",
    "lastName": "Admin",
    "phoneNumber": "5559876543",
    "address": "456 Admin St, Admin City, US"
  }'
```

Headers:

```
Authorization: Bearer <admin_jwt_token>
```

Request Body:

```json
{
  "username": "newadmin",
  "email": "newadmin@example.com",
  "password": "admin_password",
  "firstName": "New",
  "lastName": "Admin",
  "phoneNumber": "5559876543",
  "address": "456 Admin St, Admin City, US"
}
```

Response (201 Created):

```json
{
  "message": "Admin account created successfully",
  "admin": {
    // Admin user object without password
  }
}
```

### Drug Endpoints

#### Get All Drugs

```http
GET /api/drugs?limit=10&skip=0
```

Example cURL:

```bash
curl -X GET "http://localhost:3000/api/drugs?limit=10&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Query Parameters:

- `limit` (optional): Number of results per page (default: 10)
- `skip` (optional): Number of results to skip (default: 0)

Headers (for protected routes):

```
Authorization: Bearer <jwt_token>
```

#### Search Drugs by Brand Name

```http
GET /api/drugs/search?brandName=BRAND_NAME
```

Example cURL:

```bash
curl -X GET "http://localhost:3000/api/drugs/search?brandName=Aspirin" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Query Parameters:

- `brandName` (required): Brand name of the drug to search for

Headers (for protected routes):

```
Authorization: Bearer <jwt_token>
```

#### Get Drug by ID

```http
GET /api/drugs/:id
```

Example cURL:

```bash
curl -X GET http://localhost:3000/api/drugs/12345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Path Parameters:

- `id` (required): Unique identifier of the drug

Headers (for protected routes):

```
Authorization: Bearer <jwt_token>
```

## 🔒 Authentication and Authorization

The API uses JWT (JSON Web Token) for authentication. Protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### User Types and Access Control

The system supports three types of users with different permissions:

1. **Patient**

   - Can view and update their own profile
   - Can access drug information
   - Can only be created through public registration
   - Can initiate and participate in chat conversations with pharmacies
   - Can view a list of pharmacy users to contact

2. **Pharmacy**

   - Can view and update their own profile
   - Can access drug information
   - Can only be created by an admin
   - Can participate in chat conversations with patients
   - Can respond to any patient messages

3. **Admin**
   - Has full access to the system
   - Can create pharmacy accounts and other admin accounts
   - Can access all endpoints
   - Can only be created by another admin

### Creating the First Admin User

For the initial system setup, you'll need to create the first admin user manually. You can temporarily modify the registerHandler in src/controller/auth.ts to allow creating an admin for the first time, or insert directly into the MongoDB database.

## 🛠️ Tech Stack

- Node.js
- Express.js
- TypeScript
- MongoDB (for user data)
- Axios (for FDA API integration)
- JWT for authentication

## 📝 Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controller/     # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── types/          # TypeScript type definitions
│   └── index.ts        # Application entry point
├── .env                # Environment variables
├── package.json        # Project dependencies
└── tsconfig.json       # TypeScript configuration
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- FDA OpenFDA API for providing drug information
- Express.js community for the excellent web framework
- TypeScript team for the type safety
