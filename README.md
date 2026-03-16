# VerifyNIN - Universal NIN Verification Service

A secure, fast NIN verification platform for banking, education, travel, and more. Built with Next.js 15, TypeScript, and Drizzle ORM.

## Features

- 🔐 Secure NIN verification via YouVerify API
- 💳 Wallet-based payment system with Paystack
- 📄 Instant verification document generation for any purpose
- 🔒 Privacy-focused (masked NIN in history)
- ⚡ Real-time verification with automatic refunds on failure
- 📊 Transaction history and audit logging

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Payments:** Paystack
- **Verification:** YouVerify API
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion

## Prerequisites

- Node.js 18+
- PostgreSQL database
- Paystack account (for payments)
- YouVerify account (for NIN verification)

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Authentication
AUTH_SECRET="your-secret-key-minimum-32-characters"

# Paystack
PAYSTACK_PUBLIC_KEY="pk_live_..."
PAYSTACK_SECRET_KEY="sk_live_..."

# YouVerify
YOUVERIFY_TOKEN="your-live-api-token"
YOUVERIFY_BASE_URL="https://api.youverify.co"
```

See `.env.example` for complete configuration options.

## Installation

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Testing in Sandbox

For testing with sandbox/test API keys, use these test NINs:

- **Valid NIN (Success):** `11111111111`
- **Invalid NIN (Not Found):** `00000000000`

See `docs/TEST_DATA.md` for complete test data including Paystack test cards and other test identifiers.

## Database Setup

```bash
# Generate migrations
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## YouVerify Setup

**CRITICAL:** Your YouVerify wallet must have sufficient balance (minimum ₦500 recommended).

1. Login to [os.youverify.co](https://os.youverify.co)
2. Go to Account Settings → API/Webhooks
3. Create API key with **NIN permission enabled**
4. Use **LIVE environment** key (not Test)
5. Top up wallet at Billing section
6. Add token to `.env` file

See `docs/YOUVERIFY_SETUP_GUIDE.md` for detailed setup instructions.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── api/               # API routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── atoms/            # Basic UI components
│   ├── molecules/        # Composite components
│   ├── organisms/        # Complex components
│   ├── sections/         # Page sections
│   └── ui/               # shadcn/ui components
├── db/                    # Database schema & migrations
├── lib/                   # Utility functions
└── docs/                  # Documentation
```

## Key Features

### NIN Verification Flow

1. User creates account and funds wallet
2. User enters 11-digit NIN and provides consent
3. System debits ₦500 from wallet
4. Verification request sent to YouVerify
5. On success: Receipt generated
6. On failure: Automatic wallet refund

### Security Features

- Session-based authentication
- Rate limiting on all endpoints
- Audit logging for all operations
- NIN masking in database and receipts
- Secure webhook signature verification

### Payment Integration

- Paystack for wallet funding
- Automatic payment verification
- Webhook handling for async updates
- Transaction history tracking

## API Routes

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### NIN Verification

- `POST /api/nin/verify` - Verify NIN

### Wallet

- `GET /api/wallet/balance` - Get wallet balance

### Paystack

- `POST /api/paystack/initialize` - Initialize payment
- `GET /api/paystack/verify` - Verify payment
- `POST /api/paystack/webhook` - Payment webhook

### Admin (Protected)

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables Required

- `DATABASE_URL`
- `AUTH_SECRET`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `YOUVERIFY_TOKEN`
- `YOUVERIFY_BASE_URL`
- `ADMIN_SECRET_KEY` (for payment reconciliation)

## Troubleshooting

### Payment Deducted But Not Showing in Wallet

**Cause:** Network interruption during payment verification  
**Solution:** Use "Check Payment Status" button on dashboard with your payment reference

### 402 Error - Insufficient Funds

**Cause:** YouVerify wallet balance too low  
**Solution:** Top up wallet at os.youverify.co

### 403 Error - Permission Denied

**Cause:** API key missing NIN permission  
**Solution:** Regenerate key with NIN permission enabled

### NIN Not Found

**Cause:** Invalid NIN or not in NIMC database  
**Solution:** Verify NIN is correct, wallet is automatically refunded

See `docs/YOUVERIFY_SETUP_GUIDE.md` for complete troubleshooting guide.

## Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] YouVerify wallet funded (minimum ₦500)
- [ ] YouVerify API key has NIN permission
- [ ] Paystack webhook URL configured
- [ ] AUTH_SECRET is strong and unique
- [ ] Rate limiting enabled
- [ ] Audit logging enabled

See `docs/PRODUCTION_READINESS.md` for complete checklist.

## License

MIT

## Support

For issues or questions:

- Check documentation in `docs/` folder
- Review `.env.example` for configuration
- Contact YouVerify support for API issues
- Contact Paystack support for payment issues

---

**Built with ❤️ in Nigeria**
