# Twilio OTP Setup Guide

## 🎯 **Overview**

This guide helps you switch from Termii to Twilio for OTP delivery. Twilio is a reliable international SMS provider that works well for Nigerian numbers and globally.

## 🚀 **Quick Switch to Twilio**

### **Step 1: Update Environment Variables**
```env
# Switch OTP provider to Twilio
OTP_PROVIDER="twilio"

# Twilio Configuration
TWILIO_ACCOUNT_SID="your_account_sid_here"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_FROM_NUMBER="+1234567890"
```

### **Step 2: Test Configuration**
```bash
# Test Twilio OTP functionality
npm run test:twilio-otp
```

## 📋 **Twilio Account Setup**

### **1. Create Twilio Account**
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account
3. Verify your email and phone number
4. Complete account setup

### **2. Get Account Credentials**
1. Go to [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Click "Show" to reveal the Auth Token
4. Copy both values to your `.env` file

### **3. Get a Phone Number**

#### **For Trial Account (Free)**
1. Go to Console → Phone Numbers → Manage → Verified Caller IDs
2. Add and verify the phone numbers you want to send OTP to
3. Use the free Twilio trial number provided

#### **For Production Account (Paid)**
1. Go to Console → Phone Numbers → Manage → Buy a number
2. **Recommended**: Buy a Nigerian number (+234) for better delivery rates to Nigerian phones
3. **Alternative**: Any Twilio number works but may have higher costs for international delivery

### **4. Account Upgrade (For Production)**
1. Go to Console → Settings → General
2. Upgrade your account to remove trial limitations
3. Add payment method for SMS charges

## 💰 **Pricing Comparison**

### **Twilio Pricing (USD)**
- **Nigerian Numbers**: ~$0.0075 per SMS (₦12-15 per SMS)
- **US Numbers to Nigeria**: ~$0.045 per SMS (₦70-80 per SMS)
- **Phone Number Rental**: ~$1/month for Nigerian number

### **Termii Pricing (NGN)**
- **DND Route**: ₦4-6 per SMS
- **Generic Route**: ₦2-4 per SMS

**💡 Recommendation**: Use Nigerian Twilio number for cost-effective delivery to Nigerian phones.

## 🔧 **Configuration Examples**

### **Trial Account Setup**
```env
# Trial account - can only send to verified numbers
OTP_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_FROM_NUMBER="+15551234567"  # Free trial number
TEST_PHONE_NUMBER="+2348012345678"  # Must be verified in Twilio console
```

### **Production Account Setup**
```env
# Production account - can send to any valid number
OTP_PROVIDER="twilio"
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_FROM_NUMBER="+2348012345678"  # Nigerian number (recommended)
```

## 🧪 **Testing Guide**

### **1. Test Script**
```bash
# Set test phone number (optional)
export TEST_PHONE_NUMBER="+2348012345678"

# Run test
npm run test:twilio-otp
```

### **2. Manual Testing via API**
```bash
# Test OTP send endpoint
curl -X POST http://localhost:3000/api/v2/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+2348012345678"}'
```

### **3. Full Flow Testing**
1. Go to your app's phone verification page
2. Enter a phone number
3. Check that OTP is delivered via Twilio
4. Verify the OTP code works

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. "Authentication Failed" (Error 20003)**
```
❌ Problem: Invalid Account SID or Auth Token
✅ Solution: 
   - Double-check credentials in Twilio Console
   - Ensure no extra spaces in .env file
   - Regenerate Auth Token if needed
```

#### **2. "Invalid Phone Number" (Error 21211)**
```
❌ Problem: Invalid 'From' phone number
✅ Solution:
   - Verify your Twilio phone number is correct
   - Ensure number includes country code (+1, +234, etc.)
   - Check number is active in Twilio Console
```

#### **3. "Unverified Number" (Error 21608)**
```
❌ Problem: Trial account sending to unverified number
✅ Solution:
   - Add recipient number to Verified Caller IDs
   - Or upgrade to paid account
```

#### **4. "Insufficient Balance"**
```
❌ Problem: Account has no credit
✅ Solution:
   - Add funds to your Twilio account
   - Check billing settings
```

### **Debug Logging**
Our enhanced Twilio provider includes detailed logging:

```typescript
// Check logs for detailed error information
logger.info("Twilio API response", {
  status: response.status,
  success: response.ok,
  sid: result.sid,
  status_twilio: result.status,
  errorCode: result.error_code,
  errorMessage: result.error_message,
});
```

## 📊 **Monitoring & Analytics**

### **Twilio Console Monitoring**
1. Go to Console → Monitor → Logs → Messages
2. View delivery status for each SMS
3. Check error codes and delivery rates

### **Application Monitoring**
- Check application logs for Twilio responses
- Monitor OTP success/failure rates
- Track delivery times

## 🔄 **Switching Back to Termii**

If you need to switch back to Termii:

```env
# Switch back to Termii
OTP_PROVIDER="termii"
```

The system will automatically use Termii configuration.

## 🌍 **International Considerations**

### **For Nigerian Users**
- **Best**: Nigerian Twilio number (+234)
- **Good**: US Twilio number (+1)
- **Cost**: Nigerian number is more cost-effective

### **For International Users**
- Twilio works globally
- Local numbers provide better delivery rates
- Consider time zones for OTP delivery

## 📈 **Performance Comparison**

| Provider | Delivery Speed | Success Rate | Cost (Nigeria) | Setup Complexity |
|----------|---------------|--------------|----------------|------------------|
| **Termii** | Fast (2-5s) | 85-95% | ₦4-6/SMS | Medium (DND route) |
| **Twilio** | Fast (3-8s) | 95-99% | ₦12-80/SMS | Easy |

## 🎯 **Recommendations**

### **For Development/Testing**
- Use Twilio trial account
- Verify test phone numbers
- Use free trial credits

### **For Production**
- Upgrade to paid Twilio account
- Buy Nigerian phone number
- Monitor delivery rates and costs
- Set up billing alerts

### **For High Volume**
- Consider Twilio's bulk SMS features
- Implement delivery status webhooks
- Monitor and optimize costs

## 🔐 **Security Best Practices**

1. **Secure Credentials**
   ```env
   # Never commit real credentials
   TWILIO_AUTH_TOKEN="your_token_here"  # Keep this secret
   ```

2. **Rate Limiting**
   - Twilio has built-in rate limits
   - Implement application-level limits
   - Monitor for abuse

3. **Webhook Security**
   - Verify Twilio webhook signatures
   - Use HTTPS for webhook endpoints
   - Validate incoming requests

## 📞 **Support**

### **Twilio Support**
- **Documentation**: [https://www.twilio.com/docs](https://www.twilio.com/docs)
- **Support**: Available through Twilio Console
- **Community**: Twilio Developer Community

### **Quick Help**
- Check Twilio Console logs first
- Use our test script for debugging
- Review error codes in documentation