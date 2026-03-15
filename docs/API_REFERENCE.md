# API Reference

## Authentication

All API endpoints require authentication unless otherwise specified. Authentication is handled via JWT tokens stored in httpOnly cookies.

### Session Cookie

- **Name**: `verifynin_session`
- **Type**: httpOnly, secure (in production)
- **TTL**: 7 days
- **SameSite**: lax

## Public Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "password": "SecurePassword123!"
}
```

**Validation Rules:**

- `fullName`: Required, minimum 2 characters
- `email`: Required, valid email format, unique
- `phone`: Required, Nigerian phone format
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number

**Response (201):**

```json
{
  "success": true,
  "message": "Account created successfully"
}
```

**Error Response (400):**

```json
{
  "error": "Validation failed",
  "details": {
    "email": "Email already exists",
    "password": "Password must contain at least 8 characters"
  }
}
```

### POST /api/auth/login

Authenticate user and create session.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

**Error Response (401):**

```json
{
  "error": "Invalid email or password"
}
```

### POST /api/auth/logout

Clear user session.

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## User Endpoints (Protected)

### POST /api/nin/verify

Verify a National Identification Number.

**Authentication**: Required (user, admin, super_admin)

**Request Body:**

```json
{
  "nin": "12345678901",
  "consent": true,
  "purpose": "education_jamb"
}
```

**Validation Rules:**

- `nin`: Required, exactly 11 digits
- `consent`: Required, must be true
- `purpose`: Required, valid purpose enum

**Purpose Options:**

- `banking`
- `education_jamb`
- `education_waec`
- `education_neco`
- `education_nysc`
- `passport`
- `drivers_license`
- `employment`
- `telecommunications`
- `government_service`
- `other`

**Response (200) - Success:**

```json
{
  "success": true,
  "verification": {
    "id": "ver_123",
    "status": "success",
    "ninMasked": "123****4567",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "phone": "08012345678",
    "purpose": "education_jamb",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "receiptUrl": "/dashboard/receipts/ver_123",
  "walletBalance": 450000
}
```

**Response (200) - Failure with Refund:**

```json
{
  "success": false,
  "error": "NIN not found in NIMC database",
  "verification": {
    "id": "ver_123",
    "status": "failed",
    "ninMasked": "123****4567",
    "errorMessage": "NIN not found in NIMC database"
  },
  "refunded": true,
  "refundAmount": 50000,
  "walletBalance": 500000
}
```

**Error Response (400) - Insufficient Balance:**

```json
{
  "error": "Insufficient wallet balance",
  "required": 50000,
  "available": 25000
}
```

**Error Response (429) - Rate Limited:**

```json
{
  "error": "Daily verification limit exceeded",
  "limit": 10,
  "resetTime": "2024-01-02T00:00:00Z"
}
```

### GET /api/wallet/balance

Get current wallet balance.

**Authentication**: Required

**Response (200):**

```json
{
  "balance": 150000,
  "currency": "NGN",
  "balanceFormatted": "₦1,500.00"
}
```

### POST /api/wallet/check-pending-payments

Check and recover missed payments using Paystack reference.

**Authentication**: Required

**Request Body:**

```json
{
  "reference": "paystack_ref_123456789"
}
```

**Response (200) - Payment Found and Credited:**

```json
{
  "success": true,
  "message": "Payment recovered successfully",
  "amount": 100000,
  "newBalance": 250000,
  "transaction": {
    "id": "tx_123",
    "reference": "paystack_ref_123456789",
    "amount": 100000,
    "status": "completed"
  }
}
```

**Response (404) - Payment Not Found:**

```json
{
  "error": "Payment not found or already processed",
  "reference": "paystack_ref_123456789"
}
```

## Payment Endpoints

### POST /api/paystack/initialize

Initialize a Paystack payment for wallet funding.

**Authentication**: Required

**Request Body:**

```json
{
  "amount": 100000,
  "email": "john@example.com"
}
```

**Validation Rules:**

- `amount`: Required, minimum 5000 kobo (₦50), maximum 100000000 kobo (₦1,000,000)
- `email`: Required, valid email format

**Response (200):**

```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/abc123",
    "access_code": "access_code_123",
    "reference": "paystack_ref_123456789"
  }
}
```

**Error Response (400):**

```json
{
  "error": "Amount must be between ₦50 and ₦1,000,000"
}
```

### GET /api/paystack/verify/:reference

Verify a Paystack payment (called automatically after payment).

**Authentication**: Required

**Parameters:**

- `reference`: Paystack transaction reference

**Response (200) - Success:**

```json
{
  "success": true,
  "data": {
    "status": "success",
    "amount": 100000,
    "reference": "paystack_ref_123456789",
    "customer": {
      "email": "john@example.com"
    }
  },
  "walletBalance": 250000
}
```

**Response (400) - Failed Payment:**

```json
{
  "success": false,
  "data": {
    "status": "failed",
    "reference": "paystack_ref_123456789"
  },
  "error": "Payment was not successful"
}
```

### POST /api/paystack/webhook

Paystack webhook endpoint for payment notifications.

**Authentication**: Webhook signature verification

**Headers:**

- `x-paystack-signature`: HMAC SHA-512 signature

**Request Body:**

```json
{
  "event": "charge.success",
  "data": {
    "reference": "paystack_ref_123456789",
    "amount": 100000,
    "status": "success",
    "customer": {
      "email": "john@example.com"
    }
  }
}
```

**Response (200):**

```json
{
  "success": true
}
```

**Error Response (401):**

```json
{
  "error": "Invalid signature"
}
```

## Admin Endpoints (Protected)

All admin endpoints require authentication with `admin` or `super_admin` role.

### GET /api/admin/dashboard/metrics

Get dashboard metrics for admin overview.

**Authentication**: Required (admin, super_admin)

**Response (200):**

```json
{
  "users": {
    "total": 1234,
    "active_30d": 856,
    "new_today": 12,
    "growth_rate": 15.5
  },
  "transactions": {
    "total_volume": 50000000,
    "total_count": 1000,
    "success_rate": 98.5,
    "avg_amount": 50000
  },
  "verifications": {
    "total": 800,
    "success_rate": 95.2,
    "avg_processing_time": 2.5,
    "daily_count": 45
  },
  "revenue": {
    "today": 2250000,
    "this_month": 45000000,
    "last_month": 38000000,
    "growth_rate": 18.4
  },
  "system": {
    "uptime": 99.9,
    "api_response_time": 150,
    "error_rate": 0.1,
    "active_sessions": 234
  }
}
```

### GET /api/admin/users

List and search users with pagination and filtering.

**Authentication**: Required (admin, super_admin)

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `search`: Search by email, name, or phone
- `status`: Filter by status (`all`, `active`, `suspended`)
- `sort`: Sort field (`created_at`, `email`, `balance`)
- `order`: Sort order (`asc`, `desc`)
- `dateFrom`: Filter by registration date (ISO string)
- `dateTo`: Filter by registration date (ISO string)

**Example Request:**

```
GET /api/admin/users?page=1&limit=25&search=john&status=active&sort=created_at&order=desc
```

**Response (200):**

```json
{
  "users": [
    {
      "id": "user_123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "08012345678",
      "isSuspended": false,
      "balance": 150000,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastActive": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  },
  "summary": {
    "totalUsers": 1234,
    "activeUsers": 856,
    "suspendedUsers": 12,
    "totalBalance": 125000000
  }
}
```

### GET /api/admin/users/:id

Get detailed information about a specific user.

**Authentication**: Required (admin, super_admin)

**Parameters:**

- `id`: User ID

**Response (200):**

```json
{
  "user": {
    "id": "user_123",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "isSuspended": false,
    "suspendedReason": null,
    "balance": 150000,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "transactions": [
    {
      "id": "tx_123",
      "type": "credit",
      "amount": 100000,
      "status": "completed",
      "description": "Wallet funding via Paystack",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "verifications": [
    {
      "id": "ver_123",
      "ninMasked": "123****4567",
      "status": "success",
      "purpose": "education_jamb",
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ],
  "stats": {
    "totalSpent": 500000,
    "successfulVerifications": 5,
    "accountAge": 30
  }
}
```

### POST /api/admin/users/:id?action=suspend

Suspend a user account.

**Authentication**: Required (admin, super_admin)

**Parameters:**

- `id`: User ID

**Query Parameters:**

- `action`: Must be `suspend`

**Request Body:**

```json
{
  "reason": "Suspicious activity detected",
  "duration": 30
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "User suspended successfully"
}
```

### POST /api/admin/users/:id?action=activate

Reactivate a suspended user account.

**Authentication**: Required (admin, super_admin)

**Parameters:**

- `id`: User ID

**Query Parameters:**

- `action`: Must be `activate`

**Response (200):**

```json
{
  "success": true,
  "message": "User activated successfully"
}
```

### GET /api/admin/transactions

List transactions with advanced filtering.

**Authentication**: Required (admin, super_admin)

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `search`: Search by user email/name or transaction reference
- `status`: Filter by status (`all`, `pending`, `completed`, `failed`, `refunded`)
- `type`: Filter by type (`all`, `credit`, `debit`)
- `sort`: Sort field (`created_at`, `amount`, `status`)
- `order`: Sort order (`asc`, `desc`)
- `amountMin`: Minimum amount filter (in kobo)
- `amountMax`: Maximum amount filter (in kobo)
- `dateFrom`: Date range filter (ISO string)
- `dateTo`: Date range filter (ISO string)
- `userId`: Filter by specific user ID

**Response (200):**

```json
{
  "transactions": [
    {
      "id": "tx_123",
      "type": "credit",
      "amount": 100000,
      "status": "completed",
      "description": "Wallet funding via Paystack",
      "reference": "paystack_ref_123",
      "createdAt": "2024-01-15T10:00:00Z",
      "userId": "user_123",
      "userEmail": "john@example.com",
      "userFullName": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 500,
    "totalPages": 10
  },
  "summary": {
    "totalVolume": 50000000,
    "completedVolume": 48500000,
    "pendingCount": 5,
    "failedCount": 2,
    "completedCount": 493,
    "successRate": 98.6,
    "avgAmount": 100000
  }
}
```

### POST /api/admin/transactions/reconcile

Manually reconcile a payment that failed to process automatically.

**Authentication**: Required (admin, super_admin)

**Request Body:**

```json
{
  "reference": "paystack_ref_123456789",
  "userId": "user_123",
  "amount": 100000
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Payment reconciled successfully",
  "transaction": {
    "id": "tx_456",
    "reference": "paystack_ref_123456789",
    "amount": 100000,
    "status": "completed"
  }
}
```

### GET /api/admin/verifications

List NIN verifications with analytics.

**Authentication**: Required (admin, super_admin)

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `search`: Search by user email/name, NIN (masked), or provider reference
- `status`: Filter by status (`all`, `pending`, `success`, `failed`)
- `purpose`: Filter by purpose (`all`, `banking`, `education_jamb`, etc.)
- `sort`: Sort field (`created_at`, `status`, `purpose`)
- `order`: Sort order (`asc`, `desc`)
- `dateFrom`: Date range filter (ISO string)
- `dateTo`: Date range filter (ISO string)
- `userId`: Filter by specific user ID

**Response (200):**

```json
{
  "verifications": [
    {
      "id": "ver_123",
      "userId": "user_123",
      "ninMasked": "123****4567",
      "status": "success",
      "purpose": "education_jamb",
      "fullName": "John Doe",
      "dateOfBirth": "1990-01-01",
      "phone": "08012345678",
      "providerReference": "youverify_ref_123",
      "createdAt": "2024-01-15T11:00:00Z",
      "userEmail": "john@example.com",
      "userFullName": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 800,
    "totalPages": 16
  },
  "summary": {
    "totalVerifications": 800,
    "successfulVerifications": 761,
    "failedVerifications": 32,
    "pendingVerifications": 7,
    "successRate": 95.1,
    "todayCount": 45
  }
}
```

### GET /api/admin/support/tickets

List support tickets with filtering.

**Authentication**: Required (admin, super_admin)

**Query Parameters:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50, max: 100)
- `status`: Filter by status (`all`, `open`, `assigned`, `in_progress`, `resolved`, `closed`)
- `priority`: Filter by priority (`all`, `low`, `medium`, `high`, `urgent`)
- `category`: Filter by category (`all`, `payment_issue`, `verification_problem`, etc.)
- `assignedTo`: Filter by assigned admin ID
- `sort`: Sort field (`created_at`, `priority`, `status`)
- `order`: Sort order (`asc`, `desc`)

**Response (200):**

```json
{
  "tickets": [
    {
      "id": "ticket_123",
      "userId": "user_123",
      "category": "payment_issue",
      "status": "open",
      "priority": "high",
      "subject": "Payment deducted but not reflected in wallet",
      "description": "I made a payment of ₦1000 but it's not showing in my wallet",
      "paymentReference": "paystack_ref_123",
      "assignedTo": null,
      "createdAt": "2024-01-15T12:00:00Z",
      "userEmail": "john@example.com",
      "userFullName": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1
  },
  "summary": {
    "totalTickets": 25,
    "openTickets": 8,
    "assignedTickets": 12,
    "resolvedTickets": 5,
    "avgResolutionTime": 24.5
  }
}
```

## Error Responses

All endpoints return consistent error responses with appropriate HTTP status codes.

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": {
    "field": "Field-specific error message"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

### User Endpoints

- **General API**: 60 requests per minute per user
- **NIN Verification**: 10 verifications per day per user
- **Payment Initialization**: 5 requests per minute per user

### Admin Endpoints

- **Admin API**: 100 requests per minute per admin user

### Webhook Endpoints

- **Paystack Webhook**: No rate limiting (signature verified)

## Pagination

All list endpoints support pagination with consistent parameters:

- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (default: 50, max: 100)

Response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000,
    "totalPages": 20
  }
}
```

## Sorting

List endpoints support sorting with:

- `sort`: Field name to sort by
- `order`: Sort direction (`asc` or `desc`)

Common sortable fields:

- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `amount`: Transaction amount
- `status`: Status value
- `email`: User email
- `balance`: Wallet balance
