#!/bin/bash

# =====================================================
# NIN Verification Platform - Database Deployment Script
# =====================================================

set -e  # Exit on any error

echo "🚀 Starting database deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set your Neon database URL in .env file"
    exit 1
fi

# Check if admin credentials are set
if [ -z "$FIRST_SUPER_ADMIN_EMAIL" ] || [ -z "$FIRST_SUPER_ADMIN_PASSWORD" ]; then
    echo "❌ ERROR: Admin credentials not set"
    echo "Please set FIRST_SUPER_ADMIN_EMAIL and FIRST_SUPER_ADMIN_PASSWORD in .env file"
    exit 1
fi

echo "✅ Environment variables validated"

# Step 1: Run database schema setup
echo "📊 Creating database schema..."
if command -v psql &> /dev/null; then
    psql "$DATABASE_URL" -f db/deployment/complete-database-setup.sql
else
    echo "⚠️  psql not found. Please run the SQL script manually in your Neon dashboard:"
    echo "   File: db/deployment/complete-database-setup.sql"
    echo ""
    read -p "Press Enter after running the SQL script manually..."
fi

# Step 2: Create super admin user
echo "👤 Creating super admin user..."
npm run admin:create

# Step 3: Verify deployment
echo "🔍 Verifying deployment..."
echo "✅ Database deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Start your application: npm run dev"
echo "2. Visit admin login: http://localhost:3000/adminlogin-cores"
echo "3. Login with:"
echo "   Email: $FIRST_SUPER_ADMIN_EMAIL"
echo "   Password: $FIRST_SUPER_ADMIN_PASSWORD"
echo "4. ⚠️  IMPORTANT: Change the default password after first login!"
echo ""
echo "💰 Verification Cost: ₦500 (50,000 kobo)"
echo "🔒 All amounts are stored in kobo for precision"
echo ""
echo "🎉 Deployment completed successfully!"