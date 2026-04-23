# Session-Based NIN Verification Workflow

This document describes the new session-based verification system that replaces the traditional user account model.

## Overview

The session-based system eliminates the need for user registration and login. Instead, users verify their identity via OTP, select what data they need, pay per transaction, and receive results immediately.

## Workflow Stages

### 1. Identity Verification (OTP)

- **Route**: `POST /api/v2/otp/send`
- **Purpose**: Verify user's phone number as identity anchor
- **Process**:
  - User enters phone number
  - System sends OTP via Termii/Twilio
  - Creates `otp_sessions` record
  - Returns `sessionId` for verification

**API Example**:

```json
POST /api/v2/otp/send
{
  "phoneNumber": "+2348031234567"
}

Response:
{
  "success": true,
  "sessionId": "otp_abc123",
  "message": "OTP sent successfully"
}
```

### 2. OTP Verification

- **Route**: `POST /api/v2/otp/verify`
- **Purpose**: Confirm phone ownership and create verification session
- **Process**:
  - User enters 6-digit OTP
  - System validates against hashed code
  - Creates `verification_sessions` record
  - Returns JWT session token

**API Example**:

```json
POST /api/v2/otp/verify
{
  "sessionId": "otp_abc123",
  "otpCode": "123456"
}

Response:
{
  "success": true,
  "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
  "phoneNumber": "+2348031234567"
}
```

### 3. NIN Entry & Data Layer Selection

- **Route**: `POST /api/v2/verification/submit`
- **Purpose**: Capture NIN and user's data requirements
- **Process**:
  - User enters 11-digit NIN
  - Selects data layer (demographic/biometric/full)
  - System masks NIN for audit trail
  - Updates session with selections

**Data Layers**:

- **Demographic** (₦500): Name, DOB, Phone, Gender
- **Biometric** (₦750): Demographic + Photo + Signature
- **Full** (₦1000): Biometric + Full Address + LGA + State

**API Example**:

```json
POST /api/v2/verification/submit
Authorization: Bearer <sessionToken>
{
  "nin": "12345678901",
  "dataLayer": "biometric"
}

Response:
{
  "success": true,
  "maskedNin": "123456***01",
  "dataLayer": "biometric",
  "amount": 75000
}
```

### 4. Payment Processing

- **Route**: `POST /api/v2/payment/initialize`
- **Purpose**: Secure payment via Paystack
- **Process**:
  - System calculates amount based on data layer
  - Creates Paystack payment session
  - Returns authorization URL
  - User completes payment in popup/redirect

**API Example**:

```json
POST /api/v2/payment/initialize
Authorization: Bearer <sessionToken>
{
  "amount": 75000,
  "dataLayer": "biometric"
}

Response:
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "pay_abc123"
}
```

### 5. Payment Webhook & NIMC API Call

- **Route**: `POST /api/v2/payment/webhook` (Paystack webhook)
- **Purpose**: Confirm payment and trigger NIMC verification
- **Process**:
  - Paystack sends webhook on successful payment
  - System verifies webhook signature
  - Calls YouVerify NIMC API with actual NIN
  - Filters response based on selected data layer
  - Stores results in `verification_results`

### 6. Results Retrieval

- **Route**: `GET /api/v2/verification/result`
- **Purpose**: Deliver filtered verification results
- **Process**:
  - Frontend polls this endpoint
  - Returns filtered data based on layer selection
  - Provides printable document data
  - Maintains audit trail

**API Example**:

```json
GET /api/v2/verification/result
Authorization: Bearer <sessionToken>

Response:
{
  "success": true,
  "status": "completed",
  "data": {
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "phoneFromNimc": "+2348031234567",
    "gender": "Male",
    "photoUrl": "https://...", // if biometric/full
    "signatureUrl": "https://..." // if biometric/full
  },
  "sessionInfo": {
    "sessionId": "sess_xyz789",
    "dataLayer": "biometric",
    "verificationDate": "2024-04-21T10:30:00Z"
  }
}
```

## Database Schema

### Core Tables

1. **otp_sessions**: OTP verification tracking
2. **verification_sessions**: Main workflow state
3. **verification_results**: Filtered NIMC data
4. **admin_users**: Admin access control
5. **admin_audit_logs**: Compliance audit trail
6. **system_config**: Runtime configuration

### Key Features

- **Session Expiry**: 30-minute session timeout
- **OTP Security**: Hashed codes, attempt limits, expiry
- **Payment Security**: Webhook signature verification
- **Data Filtering**: Layer-based result filtering
- **Audit Trail**: Complete verification history
- **Rate Limiting**: Per-phone daily limits

## Security Considerations

### Data Protection

- NIN is masked in audit logs (`123456***01`)
- OTP codes are bcrypt hashed
- Session tokens are JWT with expiry
- Payment webhooks are signature-verified

### Rate Limiting

- Max 5 verifications per phone per day
- Max 10 OTP requests per phone per hour
- Max 3 OTP attempts per session

### Compliance (NDPR)

- Data retention: 365 days configurable
- Audit trail for all access
- Phone number as identity anchor
- No permanent user profiles

## Admin Dashboard

### Session Monitoring

- Real-time session status
- Payment tracking
- Success/failure rates
- Revenue analytics

### Audit Features

- Phone number verification history
- Data layer access logs
- Payment transaction records
- API call tracking

## Environment Configuration

Key environment variables for session-based system:

```bash
# Session Management
JWT_SECRET="your-jwt-secret"
SESSION_DURATION_MINUTES="30"
OTP_EXPIRY_MINUTES="10"

# OTP Providers
TERMII_API_KEY="your-termii-key"
TWILIO_ACCOUNT_SID="your-twilio-sid"
OTP_PROVIDER="termii"

# Payment
PAYSTACK_SECRET_KEY="sk_live_..."
PAYSTACK_PUBLIC_KEY="pk_live_..."

# NIMC API
YOUVERIFY_TOKEN="your-youverify-token"
```

## Migration from Account-Based System

1. **Database Migration**: Run `scripts/migrate-to-session-based.sql`
2. **Environment Setup**: Update `.env` with new variables
3. **Frontend Updates**: Replace login/register with verification flow
4. **Admin Dashboard**: Update to show sessions instead of users
5. **Testing**: Verify complete end-to-end flow

## API Testing

Use the verification flow component at `/` (home page) to test the complete workflow, or test individual endpoints:

```bash
# 1. Send OTP
curl -X POST /api/v2/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348031234567"}'

# 2. Verify OTP
curl -X POST /api/v2/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "otp_abc123", "otpCode": "123456"}'

# 3. Submit NIN
curl -X POST /api/v2/verification/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nin": "12345678901", "dataLayer": "demographic"}'
```

## Benefits of Session-Based Approach

1. **Simplified UX**: No registration friction
2. **NIMC Compliance**: Kiosk-style verification
3. **Better Privacy**: No permanent user profiles
4. **Audit Ready**: Complete verification trail
5. **Scalable**: Stateless session management
6. **Flexible Pricing**: Pay per verification, not subscription

This system transforms the platform from a user account service to a verification utility, aligning with NIMC's requirements for official verification services.
