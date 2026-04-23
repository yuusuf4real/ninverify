# YouVerify Environment Configuration Fix

## Problem Identified

The verification was failing with the error:

```
Unauthorized: You cannot make a request to PRODUCTION environment from STAGING environment
```

This occurred because:

1. **Environment Mismatch**: Using a STAGING token but trying to access PRODUCTION environment
2. **Hardcoded Configuration**: No environment-based configuration for different deployment stages
3. **Token Confusion**: Same token being used for both local development and production

## Root Cause Analysis

### YouVerify API Environment System

YouVerify has two separate environments:

- **STAGING/TEST**: For development and testing (limited functionality, no real charges)
- **PRODUCTION/LIVE**: For production use (real API calls, wallet charges)

### The Issue

- **Local Development**: Should use STAGING environment with STAGING token
- **Production Deployment**: Should use PRODUCTION environment with PRODUCTION token
- **Previous Setup**: Hardcoded to PRODUCTION environment regardless of deployment stage

## Solution Implemented

### 1. Environment-Based Configuration

**File**: `lib/youverify.ts`

```typescript
// Environment-based configuration
const YOUVERIFY_CONFIG = {
  production: {
    baseUrl: "https://api.youverify.co",
    environment: "PRODUCTION",
  },
  staging: {
    baseUrl: "https://api.youverify.co",
    environment: "STAGING",
  },
  development: {
    baseUrl: "https://api.youverify.co",
    environment: "STAGING", // Use staging for development
  },
};

function getYouVerifyConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const youverifyEnv = process.env.YOUVERIFY_ENVIRONMENT || nodeEnv;

  // Map environment to config
  if (youverifyEnv === "production") {
    return YOUVERIFY_CONFIG.production;
  } else if (youverifyEnv === "staging") {
    return YOUVERIFY_CONFIG.staging;
  } else {
    return YOUVERIFY_CONFIG.development;
  }
}
```

### 2. Enhanced API Calls

**Features Added**:

- Environment-specific logging
- Proper environment headers
- Clear configuration display in logs

```typescript
logger.info("[YOUVERIFY] Calling API with configuration:", {
  nin: nin.substring(0, 3) + "********",
  baseUrl: config.baseUrl,
  environment: config.environment,
});

// Add environment header if needed
const headers = {
  token: token,
  "Content-Type": "application/json",
  ...(config.environment === "STAGING" && { "X-Environment": "staging" }),
};
```

### 3. Environment Variables Update

#### Local Development (.env)

```env
# YouVerify Configuration for Local Development
YOUVERIFY_ENVIRONMENT="staging"
YOUVERIFY_TOKEN="your_staging_token_here"
YOUVERIFY_BASE_URL="https://api.youverify.co"
```

#### Production Deployment

```env
# YouVerify Configuration for Production
YOUVERIFY_ENVIRONMENT="production"
YOUVERIFY_TOKEN="your_production_token_here"
YOUVERIFY_BASE_URL="https://api.youverify.co"
```

## Configuration Options

### Environment Variable: `YOUVERIFY_ENVIRONMENT`

- **`"staging"`**: Uses STAGING environment (for development/testing)
- **`"production"`**: Uses PRODUCTION environment (for live deployment)
- **Auto-detection**: Falls back to `NODE_ENV` if not specified

### Environment Variable: `YOUVERIFY_TOKEN`

- **Staging Token**: Get from YouVerify dashboard → TEST environment
- **Production Token**: Get from YouVerify dashboard → LIVE environment

### Environment Variable: `YOUVERIFY_BASE_URL` (Optional)

- **Default**: `"https://api.youverify.co"`
- **Override**: Custom base URL if needed

## Token Setup Instructions

### For Local Development (Staging)

1. **Login to YouVerify Dashboard**: https://os.youverify.co
2. **Navigate to API Settings**: Account Settings → API/Webhooks
3. **Create TEST Environment Key**:
   - Select "TEST" environment
   - Enable "NIN Verification" permission
   - Copy the generated token
4. **Update .env**:
   ```env
   YOUVERIFY_ENVIRONMENT="staging"
   YOUVERIFY_TOKEN="your_test_token_here"
   ```

### For Production Deployment

1. **Create LIVE Environment Key**:
   - Select "LIVE" environment
   - Enable "NIN Verification" permission
   - Copy the generated token
2. **Fund Your Wallet**: Add funds for live API calls
3. **Update Production .env**:
   ```env
   YOUVERIFY_ENVIRONMENT="production"
   YOUVERIFY_TOKEN="your_live_token_here"
   ```

## Deployment Configuration

### Local Development

```bash
# .env (local)
NODE_ENV="development"
YOUVERIFY_ENVIRONMENT="staging"
YOUVERIFY_TOKEN="test_token_here"
```

### Staging Server

```bash
# .env (staging)
NODE_ENV="staging"
YOUVERIFY_ENVIRONMENT="staging"
YOUVERIFY_TOKEN="test_token_here"
```

### Production Server

```bash
# .env (production)
NODE_ENV="production"
YOUVERIFY_ENVIRONMENT="production"
YOUVERIFY_TOKEN="live_token_here"
```

## Error Resolution

### Common Errors and Solutions

#### 1. Environment Mismatch (401 Unauthorized)

**Error**: `"You cannot make a request to PRODUCTION environment from STAGING environment"`
**Solution**:

- Check `YOUVERIFY_ENVIRONMENT` matches your token type
- Staging token → `YOUVERIFY_ENVIRONMENT="staging"`
- Production token → `YOUVERIFY_ENVIRONMENT="production"`

#### 2. Insufficient Funds (402)

**Error**: `"Insufficient funds"`
**Solution**:

- Only affects PRODUCTION environment
- Add funds to your YouVerify wallet
- STAGING environment doesn't require wallet funding

#### 3. Missing Permissions (403)

**Error**: `"Forbidden"` or `"Missing NIN permission"`
**Solution**:

- Regenerate API key with NIN verification permission enabled
- Ensure business account KYB is complete

#### 4. Invalid Token (401)

**Error**: `"Invalid token"` or `"Unauthorized"`
**Solution**:

- Verify token is correctly copied from dashboard
- Check token hasn't expired
- Ensure token is for the correct environment

## Testing the Fix

### 1. Local Development Test

```bash
# Set staging environment
export YOUVERIFY_ENVIRONMENT="staging"
export YOUVERIFY_TOKEN="your_staging_token"

# Run the application
npm run dev

# Test verification flow
# Should now work without environment mismatch errors
```

### 2. Production Deployment Test

```bash
# Set production environment
export YOUVERIFY_ENVIRONMENT="production"
export YOUVERIFY_TOKEN="your_production_token"

# Deploy and test
# Should work with live NIMC data
```

## Monitoring and Logging

### Enhanced Logging

The system now logs:

- Environment being used (STAGING/PRODUCTION)
- Base URL configuration
- Token validation (without exposing actual token)
- API response status with environment context

### Log Examples

```
[YOUVERIFY] Calling API with configuration: {
  nin: "123********",
  baseUrl: "https://api.youverify.co",
  environment: "STAGING"
}

[YOUVERIFY] Attempt 1/3 (STAGING environment)
[YOUVERIFY] Success response received (attempt 1)
```

## Security Considerations

### Token Management

- **Staging Tokens**: Safe to use in development, limited functionality
- **Production Tokens**: Treat as highly sensitive, never commit to version control
- **Environment Separation**: Prevents accidental production API calls during development

### Best Practices

1. **Never commit production tokens** to version control
2. **Use environment variables** for all sensitive configuration
3. **Separate staging and production** deployments completely
4. **Monitor API usage** to detect unauthorized calls
5. **Rotate tokens regularly** for security

## Migration Guide

### For Existing Deployments

#### Step 1: Update Environment Variables

```bash
# Add new environment variable
YOUVERIFY_ENVIRONMENT="staging"  # or "production" for live

# Keep existing token (ensure it matches environment)
YOUVERIFY_TOKEN="existing_token"
```

#### Step 2: Verify Configuration

- Check logs for environment confirmation
- Test verification flow
- Monitor for environment mismatch errors

#### Step 3: Production Deployment

- Use production token with `YOUVERIFY_ENVIRONMENT="production"`
- Ensure wallet is funded for live API calls
- Test with real NIN data

## Troubleshooting

### Configuration Check

```typescript
// Add to any API route for debugging
console.log("YouVerify Config:", {
  environment: process.env.YOUVERIFY_ENVIRONMENT,
  nodeEnv: process.env.NODE_ENV,
  hasToken: !!process.env.YOUVERIFY_TOKEN,
});
```

### Environment Validation

```bash
# Check current configuration
echo "Environment: $YOUVERIFY_ENVIRONMENT"
echo "Node ENV: $NODE_ENV"
echo "Token Set: $([ -n "$YOUVERIFY_TOKEN" ] && echo "Yes" || echo "No")"
```

## Conclusion

The environment configuration fix ensures:

1. **✅ Local Development**: Uses STAGING environment safely
2. **✅ Production Deployment**: Uses PRODUCTION environment with live data
3. **✅ Error Prevention**: No more environment mismatch errors
4. **✅ Flexibility**: Easy switching between environments
5. **✅ Security**: Proper token separation and management

The verification system now works correctly in both development and production environments without the unauthorized access errors.
