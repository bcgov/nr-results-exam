# Backend API Documentation

## Authentication

All API endpoints (except `/health`) require authentication using JWT tokens from AWS Cognito.

### Authentication Header

Include the JWT token in the `Authorization` header of all API requests:

```
Authorization: Bearer <jwt-token>
```

The JWT token is obtained from AWS Cognito via the frontend authentication flow (IDIR/BCeID).

### Token Verification

The backend verifies JWT tokens by:
1. Extracting the token from the Authorization header
2. Fetching the public signing keys from AWS Cognito JWKS endpoint
3. Verifying the token signature using the public key
4. Extracting user information from the verified token

### Configuration

The following environment variables must be set for authentication to work:

- `VITE_USER_POOLS_ID`: AWS Cognito User Pool ID
- `VITE_COGNITO_REGION`: AWS region (default: ca-central-1)

## Endpoints

### Health Check (Unauthenticated)

**GET** `/health`

Returns the health status of the API.

**Response:**
```json
{
  "uptime": 12345.67,
  "message": "OK",
  "timestamp": 1234567890123
}
```

### Get Questions (Authenticated)

**GET** `/api/questions/:fileName`

Retrieves questions from S3 storage.

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)

**Parameters:**
- `fileName`: Name of the questions file to retrieve

**Response:**
```json
{
  "questions": [...]
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Server error

### Send Email (Authenticated)

**POST** `/api/mail`

Sends an email using CHES (Common Hosted Email Service).

**Headers:**
- `Authorization: Bearer <jwt-token>` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "fromEmail": "sender@example.com",
  "toEmails": ["recipient@example.com"],
  "subject": "Email Subject",
  "mailBody": "<html>Email body content</html>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "status": 200,
  "emailSent": {
    "messageId": "..."
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing or invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Email send failure or server error

## Authentication Error Codes

- `401 Unauthorized`:
  - `Authentication required`: No Authorization header provided
  - `No token provided`: Authorization header present but empty
  - `Invalid token`: Token signature verification failed
  - `Token expired`: Token has expired
  - `Authentication failed`: Generic authentication error

- `500 Internal Server Error`:
  - `User pool not configured`: VITE_USER_POOLS_ID environment variable not set

## Security Notes

1. All protected endpoints verify JWT tokens against AWS Cognito public keys
2. Tokens are verified using RS256 algorithm
3. User information is extracted from verified tokens and made available to route handlers
4. CORS protection is enforced based on whitelisted origins
5. The `/health` endpoint remains unauthenticated for monitoring purposes
