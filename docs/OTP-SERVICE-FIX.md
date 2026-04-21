# OTP Service Fix - Session-Based Verification System

## Problem Summary

The session-based verification system was failing with "Failed to send OTP" errors due to:

1. **Termii API Configuration Issues**
   - Sender ID "VerifyNIN" was not registered with the Termii account
   - API returned 404 error: "ApplicationSenderId not found"
   - Network connectivity issues with Termii API (timeout errors)

2. **Database Connection Issues**
   - Intermittent "Error connecting to database: fetch failed" errors
   - Network connectivity problems with Neon database

## Solution Implemented

### 1. Development Mode for OTP Testing

Added a development mode that bypasses SMS sending and displays OTP codes directly in the terminal:

```typescript
// In development mode, display OTP in terminal for testing
if (this.isDevelopment) {
  process.stdout.write(
    `\n${"=".repeat(60)}\n` +
      `🔐 DEVELOPMENT MODE - OTP CODE\n` +
      `${"=".repeat(60)}\n` +
      `Phone: ${normalizedPhone}\n` +
      `OTP Code: ${otpCode}\n` +
      `Session ID: ${sessionId}\n` +
      `Expires: ${expiresAt.toISOString()}\n` +
      `${"=".repeat(60)}\n\n`,
  );

  return { success: true, sessionId };
}
```

**Benefits:**

- No SMS costs during development
- Instant OTP delivery for testing
- No dependency on external SMS providers
- Works offline

### 2. Updated Termii Configuration

Updated sender ID configuration to use "N-Alert" as default:

```typescript
constructor() {
  this.apiKey = process.env.TERMII_API_KEY || "";
  // Use "N-Alert" as default - it's a pre-approved generic sender ID in Termii
  this.senderId = process.env.TERMII_SENDER_ID || "N-Alert";
}
```

**Configuration Notes:**

- "N-Alert" is a pre-approved generic sender ID in Termii
- Works immediately without registration
- To use custom sender ID like "VerifyNIN", register it at https://accounts.termii.com

### 3. Improved Error Logging

Replaced console.log statements with proper logger calls:

```typescript
if (!response.ok) {
  logger.error("Termii API error", {
    status: response.status,
    body: result,
  });
}
```

### 4. Environment Configuration

Updated `.env` and `.env.example` with proper documentation:

```bash
# OTP Service Configuration
# Primary: Termii (Nigerian SMS provider)
TERMII_API_KEY="your-termii-api-key"
# N-Alert is a pre-approved generic sender ID that works immediately
# To use custom sender ID like "VerifyNIN", register it at https://accounts.termii.com
TERMII_SENDER_ID="N-Alert"
```

## Testing the Fix

### 1. Start Development Server

```bash
npm run dev
```

### 2. Send OTP Request

```bash
curl -X POST http://localhost:3000/api/v2/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348077665544"}'
```

### 3. Check Terminal Output

You should see:

```
============================================================
🔐 DEVELOPMENT MODE - OTP CODE
============================================================
Phone: +2348077665544
OTP Code: 754489
Session ID: fzq_a7v35z6OGZT96a1rF
Expires: 2026-04-21T19:00:43.953Z
============================================================
```

### 4. Verify OTP

```bash
curl -X POST http://localhost:3000/api/v2/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "fzq_a7v35z6OGZT96a1rF",
    "otpCode": "754489"
  }'
```

## Production Deployment

### Before Deploying to Production:

1. **Register Custom Sender ID** (Optional)
   - Go to https://accounts.termii.com
   - Register "VerifyNIN" as sender ID
   - Wait for approval (usually 24-48 hours)
   - Update `TERMII_SENDER_ID` in production `.env`

2. **Verify Termii Account**
   - Ensure Termii account has sufficient credits
   - Test SMS sending with a real phone number
   - Monitor API response codes

3. **Database Connection**
   - Verify Neon database connection string is correct
   - Test database connectivity from production environment
   - Ensure SSL mode is properly configured

4. **Environment Variables**
   - Set `NODE_ENV=production` to disable development mode
   - Verify all required environment variables are set
   - Test OTP sending with real SMS provider

## Database Migration Status

The session-based tables have been successfully created:

- ✅ `otp_sessions` - OTP verification tracking
- ✅ `verification_sessions` - Main workflow state
- ✅ `verification_results` - Filtered NIMC data
- ✅ `admin_users` - Admin access control
- ✅ `admin_audit_logs` - Compliance audit trail
- ✅ `system_config` - Runtime configuration

## Current System Status

- ✅ Database migration completed
- ✅ OTP service working in development mode
- ✅ Session management implemented
- ✅ Rate limiting active
- ✅ Development mode OTP display working
- ⚠️ Production SMS sending requires Termii sender ID registration
- ⚠️ Network connectivity issues may affect production deployment

## Next Steps

1. **Test Complete Verification Flow**
   - Send OTP → Verify OTP → Submit NIN → Process Payment → Get Results

2. **Register Termii Sender ID**
   - Register "VerifyNIN" at https://accounts.termii.com
   - Update production environment variables

3. **Monitor Production Deployment**
   - Watch for SMS delivery issues
   - Monitor database connection stability
   - Track OTP success rates

4. **Implement Fallback Provider**
   - Configure Twilio as backup SMS provider
   - Test automatic failover

## Troubleshooting

### OTP Not Sending in Production

1. Check Termii account credits
2. Verify sender ID is registered and approved
3. Check API key is correct
4. Monitor Termii API response codes

### Database Connection Errors

1. Verify `DATABASE_URL` is correct
2. Check network connectivity to Neon database
3. Ensure SSL mode is properly configured
4. Monitor database connection pool

### Rate Limiting Issues

1. Check rate limit configuration in `.env`
2. Monitor rate limit logs
3. Adjust limits if needed for production load

## Files Modified

- `lib/otp-service.ts` - Added development mode and improved error handling
- `.env` - Updated Termii configuration
- `.env.example` - Added configuration documentation
- `docs/OTP-SERVICE-FIX.md` - This documentation

## Commit Information

- **Commit**: b3beb1b
- **Message**: "Fix OTP service with development mode and update Termii configuration"
- **Date**: April 21, 2026
- **Status**: ✅ Pushed to main branch

## Support

For issues or questions:

1. Check server logs for detailed error messages
2. Review Termii API documentation
3. Verify environment configuration
4. Test with development mode first
