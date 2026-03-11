import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { config } from "dotenv";
import { eq } from "drizzle-orm";

// Load environment variables from .env file
config();

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const FIRST_SUPER_ADMIN_EMAIL = process.env.FIRST_SUPER_ADMIN_EMAIL;
const FIRST_SUPER_ADMIN_PASSWORD = process.env.FIRST_SUPER_ADMIN_PASSWORD;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set");
  process.exit(1);
}

if (!FIRST_SUPER_ADMIN_EMAIL) {
  console.error("❌ FIRST_SUPER_ADMIN_EMAIL is not set");
  process.exit(1);
}

if (!FIRST_SUPER_ADMIN_PASSWORD) {
  console.error("❌ FIRST_SUPER_ADMIN_PASSWORD is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

async function createSuperAdmin() {
  try {
    console.log("🚀 Creating super admin user...");
    console.log(`📧 Email: ${FIRST_SUPER_ADMIN_EMAIL}`);

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, FIRST_SUPER_ADMIN_EMAIL!)
    });

    if (existingUser) {
      console.log("⚠️  User already exists with this email");
      
      // Update role to super_admin if not already
      if (existingUser.role !== "super_admin") {
        await db
          .update(schema.users)
          .set({ role: "super_admin" })
          .where(eq(schema.users.email, FIRST_SUPER_ADMIN_EMAIL!));
        console.log("✅ Updated existing user role to super_admin");
      } else {
        console.log("✅ User already has super_admin role");
      }
      
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(FIRST_SUPER_ADMIN_PASSWORD!, 10);

    // Create super admin user
    const userId = `admin_${nanoid()}`;
    await db.insert(schema.users).values({
      id: userId,
      fullName: "System Administrator",
      email: FIRST_SUPER_ADMIN_EMAIL!,
      phone: "+2340000000000",
      passwordHash,
      role: "super_admin",
      isSuspended: false
    });

    // Create wallet for admin user
    const walletId = nanoid();
    await db.insert(schema.wallets).values({
      id: walletId,
      userId,
      balance: 0,
      currency: "NGN"
    });

    console.log("✅ Super admin user created successfully");
    console.log(`👤 User ID: ${userId}`);
    console.log(`📧 Email: ${FIRST_SUPER_ADMIN_EMAIL}`);
    console.log(`🔑 Role: super_admin`);
    console.log("\n⚠️  IMPORTANT: Change the default password after first login!");

  } catch (error) {
    console.error("❌ Error creating super admin:", error);
    throw error;
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });