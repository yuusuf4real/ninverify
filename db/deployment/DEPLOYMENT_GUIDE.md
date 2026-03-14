# Database Deployment Guide

## Overview
This guide helps you deploy the NIN Verification Platform database to a fresh Neon database instance.

## Prerequisites
- New Neon database instance
- Database connection string
- Admin credentials ready

## Step 1: Prepare Environment
1. Update your `.env` file with the new database URL:
   ```
   DATABASE_URL="your-new-neon-database-url"
   ```

2. Ensure admin credentials are set:
   ```
   FIRST_SUPER_ADMIN_EMAIL="admin@verifynin.ng"
   FIRST_SUPER_ADMIN_PASSWORD="YourSecurePassword123!"
   ```

## Step 2: Run Database Setup Script
Execute the complete database setup script on your Neon database:

```bash
# Connect to your Neon database and run:
psql "your-neon-database-url" -f db/deployment/complete-database-setup.sql
```

Or use Neon's SQL Editor in their dashboard to run the script.

## Step 3: Create Super Admin User
After running the SQL script, create the super admin user with proper password hash:

```bash
npm run create-super-admin
```

Or manually run:
```bash
npx tsx scripts/create-super-admin.ts
```

## Step 4: Verify Deployment
1. Check that all tables exist:
   - users
   - wallets  
   - wallet_transactions
   - nin_verifications
   - support_tickets
   - ticket_messages
   - admin_actions
   - audit_logs

2. Verify super admin user exists:
   ```sql
   SELECT id, email, role FROM users WHERE role = 'super_admin';
   ```

3. Test admin login at: `https://your-domain.com/admin-login`

## Step 5: Post-Deployment Tasks
1. **Change default password**: Login and change the super admin password
2. **Test verification flow**: Ensure ₦500 verification cost is working
3. **Check metrics**: Verify admin dashboard loads real data
4. **Test payments**: Confirm Paystack integration works

## Important Notes

### Currency Handling
- All amounts are stored in kobo (smallest unit)
- ₦500 = 50,000 kobo
- ₦1,000 = 100,000 kobo
- Frontend displays in Naira, backend stores in kobo

### Verification Cost
- NIN verification costs exactly ₦500
- This is defined in `lib/constants.ts` as `NIN_VERIFICATION_COST_KOBO = 50000`

### Security
- Change default super admin password immediately
- Use strong passwords for production
- Enable 2FA if available
- Monitor admin actions through audit logs

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql "your-database-url" -c "SELECT version();"
```

### Missing Tables
Re-run the complete setup script - it's designed to be idempotent.

### Admin Login Issues
1. Verify user exists in database
2. Check password hash is correct
3. Ensure role is 'super_admin'
4. Clear browser cache/cookies

### Metrics API Errors
1. Check database connection
2. Verify all tables have data
3. Check server logs for specific errors

## Production Checklist
- [ ] Database deployed successfully
- [ ] Super admin user created
- [ ] Admin login working
- [ ] Dashboard metrics loading
- [ ] Payment integration tested
- [ ] Verification flow tested
- [ ] All environment variables set
- [ ] SSL/TLS configured
- [ ] Monitoring enabled
- [ ] Backups configured

## Support
If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test database connectivity
4. Review audit logs for errors