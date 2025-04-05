# Med-Track Backend

A backend service that provides drug information by integrating with the FDA's drug label API. This service allows users to search for drugs by brand name, retrieve specific drug details by ID, and list all available drugs with pagination.

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

### Drug Endpoints

#### Get All Drugs

```http
GET /api/drugs?limit=10&skip=0
```

Query Parameters:

- `limit` (optional): Number of results per page (default: 10)
- `skip` (optional): Number of results to skip (default: 0)

#### Search Drugs by Brand Name

```http
GET /api/drugs/search?brandName=BRAND_NAME
```

Query Parameters:

- `brandName` (required): Brand name of the drug to search for

#### Get Drug by ID

```http
GET /api/drugs/:id
```

Path Parameters:

- `id` (required): Unique identifier of the drug

### Response Examples

#### Successful Response (200 OK)

```json
{
  "meta": {
    "disclaimer": "...",
    "terms": "...",
    "license": "...",
    "last_updated": "...",
    "results": {
      "skip": 0,
      "limit": 10,
      "total": 100
    }
  },
  "results": [
    {
      "id": "...",
      "set_id": "...",
      "active_ingredient": ["..."],
      "purpose": ["..."],
      "warnings": ["..."]
      // ... other drug information
    }
  ]
}
```

#### Error Responses

##### Bad Request (400)

```json
{
  "error": "Brand name is required"
}
```

##### Not Found (404)

```json
{
  "error": "Drug not found"
}
```

##### Server Error (500)

```json
{
  "error": "Error fetching drug information"
}
```

## 🔒 Authentication

The API uses JWT (JSON Web Token) for authentication. Protected routes require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

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
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── types/         # TypeScript type definitions
│   └── index.ts       # Application entry point
├── .env               # Environment variables
├── package.json       # Project dependencies
└── tsconfig.json     # TypeScript configuration
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
