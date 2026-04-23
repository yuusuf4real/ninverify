# Admin Access Guide

## Admin Login Details

### Access URL

- **Admin Login Page**: `http://localhost:3000/sys-4a7404d6f114b5b0`
- **Admin Dashboard**: `http://localhost:3000/admin` (redirects to login if not authenticated)

### Default Admin Credentials

- **Email**: `admin@verifynin.ng`
- **Password**: `ChangeMe123!`
- **Role**: `super_admin`

### Admin User Status

✅ **Admin user exists in database**

- User ID: `admin_1773506408996`
- Email: `admin@verifynin.ng`
- Role: `super_admin`
- Full Name: `System Administrator`
- Password: ✅ **Updated and verified**

## How to Access Admin Panel

### Step 1: Navigate to Admin Login

1. Open your browser
2. Go to: `http://localhost:3000/sys-4a7404d6f114b5b0`
3. You should see the admin login form

### Step 2: Login with Admin Credentials

1. Enter email: `admin@verifynin.ng`
2. Enter password: `ChangeMe123!`
3. Click "Sign In to Admin"
4. You will be redirected to the admin dashboard at `/admin`

### Step 3: Access Admin Features

Once logged in, you can access:

- **Dashboard**: Overview and metrics
- **Users Management**: View and manage user accounts
- **Transactions**: Monitor payment transactions
- **Verifications**: View verification requests and results
- **Support**: Manage support tickets
- **Analytics**: System analytics and reports
- **System Settings**: Configure system parameters

## Security Features

### Portal Separation

- **Strict portal enforcement**: Admin users can only access admin portal
- **Regular users cannot access admin portal** (403 Forbidden)
- **Admin users cannot access user portal** (security policy)

### Security Monitoring

- All admin login attempts are logged
- Failed login attempts are tracked
- IP addresses and user agents are recorded
- Audit trail for all admin actions

### Rate Limiting

- Login attempts are rate-limited per IP address
- Protection against brute force attacks

## Troubleshooting

### If Login Fails

1. **Check credentials**: Ensure you're using the exact email and password
2. **Check URL**: Make sure you're on `/sys-4a7404d6f114b5b0` not `/admin`
3. **Clear browser cache**: Sometimes cached data can interfere
4. **Check server logs**: Look for error messages in the terminal

### If Admin User Doesn't Exist

Run the admin creation script:

```bash
npx tsx scripts/create-super-admin.ts
```

### Password Reset

If you need to reset the admin password:

```bash
node -e "
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();
const sql = neon(process.env.DATABASE_URL);

async function resetPassword() {
  const newPassword = 'ChangeMe123!';
  const newHash = await bcrypt.hash(newPassword, 10);

  await sql\`
    UPDATE users
    SET password_hash = \${newHash}
    WHERE email = 'admin@verifynin.ng'
  \`;

  console.log('Admin password reset successfully');
}

resetPassword();
"
```

## Environment Variables

The admin system uses these environment variables:

- `FIRST_SUPER_ADMIN_EMAIL`: Default admin email
- `FIRST_SUPER_ADMIN_PASSWORD`: Default admin password
- `ADMIN_IP_WHITELIST`: IP addresses allowed for admin access
- `JWT_SECRET`: Used for session management

## Next Steps

1. **Change Default Password**: After first login, change the default password
2. **Configure IP Whitelist**: Restrict admin access to specific IP addresses
3. **Set up Monitoring**: Configure proper logging and monitoring
4. **Backup Admin Access**: Create additional admin users if needed

---

**Important Security Note**: Always change the default password after first login and restrict admin access to trusted IP addresses in production environments.
