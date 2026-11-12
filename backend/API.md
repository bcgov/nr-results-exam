# Backend API Documentation

## Overview

This document describes the authentication requirements and available endpoints for the nr-results-exam backend API.

## Authentication

All API endpoints (except `/health`) require authentication using JWT tokens from BC Gov SSO (Keycloak).

### Authentication Header

Include the JWT token in the `Authorization` header of all API requests:

```
Authorization: Bearer <jwt-token>
```

The JWT token is obtained from BC Gov SSO (Keycloak) via the frontend OIDC Authorization Code + PKCE flow (IDIR/BCeID).

### Token Verification

The backend verifies JWT tokens by:
1. Extracting the token from the Authorization header
2. Fetching the public signing keys from the Keycloak JWKS endpoint (`/protocol/openid-connect/certs`)
3. Verifying the token signature, issuer, and `azp` (authorized party) against the configured client ID
4. Extracting and normalizing user information from the verified token

### Configuration

The following environment variables must be set for authentication to work:

- `KEYCLOAK_ISSUER_URI`: Keycloak realm issuer URI (e.g., `https://dev.loginproxy.gov.bc.ca/auth/realms/standard`)
- `KEYCLOAK_CLIENT_ID`: Keycloak client ID; required `azp` (authorized party) claim

## Endpoints

### Health Check (Unauthenticated)

**GET** `/health`

Returns the API uptime along with dependency status for CHES, S3 object storage, and Keycloak (BC Gov SSO).  
Use `GET /health?deep=true` to force a live dependency check instead of the cached snapshot.

**Response:**
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": 1234567890123,
  "lastCheckedAt": 1234567889000,
  "refreshInProgress": false,
  "dependencies": {
    "ches": {
      "status": "ok",
      "latencyMs": 150
    },
    "objectStorage": {
      "status": "ok",
      "latencyMs": 120,
      "bucket": "nr-results-bucket"
    },
    "federatedAuth": {
      "status": "skipped",
      "message": "VITE_USER_POOLS_ID is not configured"
    }
  }
}
```

The HTTP status is `200` when all dependencies are healthy and `503` if any critical dependency reports `status: "error"`.

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
5. The `/health` endpoint and the `/api/` status endpoint remain unauthenticated for monitoring and public status checks

## Rate Limiting

The backend enforces rate limits on protected endpoints to ensure fair usage and system stability:

- **Questions endpoint** (`/api/questions/:fileName`): 100 requests per 15-minute window per client IP
- **Mail endpoint** (`/api/mail`): 20 requests per 15-minute window per client IP

When a client exceeds a limit, the API responds with `429 Too Many Requests` and includes headers that describe the active window:

- `RateLimit-Limit`: Maximum number of requests allowed in the current window
- `RateLimit-Remaining`: Remaining requests before the limit is reached
- `RateLimit-Reset`: Epoch time (seconds) when the current window resets

Example error response:

```json
{
  "error": "Too many requests, please try again later."
}
```

Client applications should implement retry/backoff logic to handle rate-limit responses gracefully.
