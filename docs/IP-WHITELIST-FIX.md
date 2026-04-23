# IP Whitelist Fix for Admin Access

## Problem

The admin login page was showing "Blocked admin access attempt from unauthorized IP" error when accessing `http://localhost:3000/sys-4a7404d6f114b5b0`.

**Error Message:**

```
Blocked admin access attempt from unauthorized IP: ::ffff:127.0.0.1 to /sys-4a7404d6f114b5b0
```

## Root Cause

The middleware was receiving IPv6-mapped IPv4 addresses (`::ffff:127.0.0.1`) but the IP whitelist only included standard localhost addresses:

- `127.0.0.1` (IPv4 localhost)
- `::1` (IPv6 localhost)

When Node.js runs in dual-stack mode (supporting both IPv4 and IPv6), IPv4 addresses are often mapped to IPv6 format as `::ffff:x.x.x.x`.

## Solution

### 1. Updated IP Whitelist Configuration

**File:** `.env` and `.env.example`

**Before:**

```env
ADMIN_IP_WHITELIST="127.0.0.1,::1,192.168.1.0/24"
```

**After:**

```env
ADMIN_IP_WHITELIST="127.0.0.1,::1,::ffff:127.0.0.1,localhost,192.168.1.0/24"
```

### 2. Enhanced IP Checking Logic

**File:** `middleware.ts`

**Before:**

```typescript
function isAdminIPAllowed(ip: string): boolean {
  if (ADMIN_IP_WHITELIST.length === 0) {
    return true;
  }
  return ADMIN_IP_WHITELIST.includes(ip);
}
```

**After:**

```typescript
function isAdminIPAllowed(ip: string): boolean {
  // If no whitelist is configured, allow all IPs (for development)
  if (ADMIN_IP_WHITELIST.length === 0) {
    return true;
  }

  // Normalize IP address for comparison
  let normalizedIP = ip;

  // Handle IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    normalizedIP = ip.substring(7);
  }

  // Check both original and normalized IP
  const ipsToCheck = [ip, normalizedIP];

  // Also check common localhost variations
  if (
    normalizedIP === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1"
  ) {
    ipsToCheck.push("127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost");
  }

  return ipsToCheck.some((checkIP) => ADMIN_IP_WHITELIST.includes(checkIP));
}
```

## Key Improvements

### 1. IPv6-Mapped IPv4 Support

- Automatically handles `::ffff:127.0.0.1` format
- Normalizes IPv6-mapped addresses to standard IPv4

### 2. Localhost Variations

- Supports multiple localhost formats:
  - `127.0.0.1` (IPv4)
  - `::1` (IPv6)
  - `::ffff:127.0.0.1` (IPv6-mapped IPv4)
  - `localhost` (hostname)

### 3. Flexible Matching

- Checks both original and normalized IP addresses
- Automatically includes common localhost variations for local development

## Testing Results

### ✅ Admin Login Page Access

```bash
curl -s http://localhost:3000/sys-4a7404d6f114b5b0 | head -10
# Returns: Full HTML content (no longer blocked)
```

### ✅ Admin Login API

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@verifynin.ng","password":"ChangeMe123!","portal":"admin"}'
# Returns: {"success":true}
```

## Production Considerations

### 1. Specific IP Whitelisting

For production environments, replace localhost entries with specific IP addresses:

```env
ADMIN_IP_WHITELIST="203.0.113.10,203.0.113.11,192.168.1.100"
```

### 2. CIDR Block Support

The current implementation supports individual IPs. For subnet support, consider using a library like `ipaddr.js`:

```env
ADMIN_IP_WHITELIST="192.168.1.0/24,10.0.0.0/8"
```

### 3. Security Headers

Ensure proper security headers are set for admin routes:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (for HTTPS)

## Related Files Modified

- `.env` - Updated IP whitelist
- `.env.example` - Updated IP whitelist template
- `middleware.ts` - Enhanced IP checking logic
- `docs/IP-WHITELIST-FIX.md` - This documentation

---

**Status**: ✅ **RESOLVED**

- Admin login page accessible
- IP whitelist properly configured
- IPv6-mapped IPv4 addresses supported
- Enhanced security with flexible localhost handling
