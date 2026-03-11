# Test Data for Sandbox Environment

This document contains test data for testing the NIN verification feature in sandbox/development mode.

## Important Notes

⚠️ **These test NINs only work with YouVerify sandbox API keys**
- Use these NINs when `YOUVERIFY_API_KEY` is set to a sandbox/test key
- Production API keys will reject these test NINs
- Bold NINs below simulate "Not Found" scenarios

## Nigeria Test NINs

### Valid Test NINs (Will Return Success)
```
11111111111
```

### Invalid Test NINs (Will Return "Not Found")
```
00000000000
```

## Other Nigeria Test Data

For reference, here are other test identifiers supported by YouVerify:

### Virtual NIN (vNIN)
- Valid: `YV111111111111FY`
- Not Found: `YV000000000000FY`

### Bank Verification Number (BVN)
- Valid: `11111111111`
- Not Found: `00000000000`

### Passport
- Valid: `A11111111`
- Not Found: `A00000000`

### National Driver's License (NDL)
- Valid: `AAA11111AA11`
- Not Found: `AAA00000AA00`

### Permanent Voter's Card (PVC)
- Valid: `11A1A1A111111111111`
- Not Found: `00A0A0A000000000000`

### Phone Number
- Valid: `08000000000`
- Valid: `08000000001`

### Bank Account
- Valid: `1000000000`
- Valid: `1111111111`

### Company Registration (RC Number)
- Valid: `RC11111111`
- Not Found: `RC00000000`
- Country Code: `NG`

### Tax Identification Number (TIN)
- Not Found: `00000000-0000`

## Testing Workflow

1. **Setup Sandbox Environment**
   ```bash
   # In your .env file
   YOUVERIFY_API_KEY=your_sandbox_api_key_here
   ```

2. **Fund Your Wallet**
   - Use Paystack test cards to fund your wallet
   - Minimum: ₦500 (allows 1 verification)

3. **Test NIN Verification**
   - Use `11111111111` for successful verification
   - Use `00000000000` to test "NIN not found" scenario
   - Check that wallet is debited and refunded appropriately

4. **Verify Receipt Generation**
   - After successful verification, check the receipt page
   - Ensure all data is displayed correctly
   - Test the print functionality

## Expected Test Results

### Using NIN: `11111111111`
- ✅ Status: Success
- ✅ Wallet debited: ₦500
- ✅ Receipt generated with test data
- ✅ Can view verification details

### Using NIN: `00000000000`
- ❌ Status: Not Found
- ✅ Wallet debited: ₦500
- ✅ Wallet refunded: ₦500
- ❌ No receipt generated
- ✅ Error message displayed

## Paystack Test Cards

For funding your wallet in sandbox mode:

### Successful Payment
```
Card Number: 4084084084084081
CVV: 408
Expiry: Any future date
PIN: 0000
OTP: 123456
```

### Failed Payment
```
Card Number: 5060666666666666666
CVV: 123
Expiry: Any future date
```

## Troubleshooting

### "Verification provider rejected this request"
- You're using a sandbox API key but trying to verify a real NIN
- Solution: Use test NINs listed above

### "Insufficient funds" from provider
- Your YouVerify sandbox account has no credits
- Solution: Contact YouVerify support to add test credits

### "Rate limit exceeded"
- You've made too many requests in a short time
- Solution: Wait 10 minutes before trying again

## Production Testing

⚠️ **Never use test NINs in production!**

When testing in production:
1. Use real, valid NINs
2. Ensure you have sufficient YouVerify credits
3. Test with small amounts first
4. Monitor audit logs for any issues

## Resources

- [YouVerify API Documentation](https://doc.youverify.co/)
- [YouVerify Test Data](https://doc.youverify.co/test-data)
- [Paystack Test Cards](https://paystack.com/docs/payments/test-payments/)

---

**Last Updated:** March 2026
