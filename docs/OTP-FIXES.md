# OTP Production Issues - Quick Fixes

## 🚨 **Main Issues & Solutions**

### **1. Wrong Channel Route**

```typescript
// ❌ Wrong - Generic route fails for OTP
{ "channel": "generic" }

// ✅ Correct - DND route for OTP messages
{ "channel": "dnd" }
```

### **2. Unregistered Sender ID**

```env
# ❌ Custom sender ID (needs registration)
TERMII_SENDER_ID="VerifyNIN"

# ✅ Pre-approved sender ID (works immediately)
TERMII_SENDER_ID="N-Alert"
```

### **3. DND Route Not Activated**

- Contact Termii support: support@termii.com
- Request DND route activation for OTP messages
- Required for transactional SMS delivery

### **4. Enhanced Error Logging**

Our updated OTP service now includes detailed logging to identify issues:

```typescript
logger.info("Termii API response", {
  status: response.status,
  messageId: result.message_id,
  code: result.code,
  message: result.message,
});
```

## 🎯 **Quick Checklist**

- [ ] Using `dnd` channel (not `generic`)
- [ ] Using `N-Alert` sender ID
- [ ] DND route activated on Termii account
- [ ] Valid API key configured
- [ ] Sufficient account balance

## 📞 **Support**

- Termii Support: support@termii.com
- Request: "Please activate DND route for OTP messages"
