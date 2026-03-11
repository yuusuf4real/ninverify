import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

async function queryWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
      }
    }
  }
  throw lastError;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  console.log("Fetching wallet balance for user:", session.userId);

  const wallet = await queryWithRetry(() =>
    db.query.wallets.findFirst({
      where: (wallets, { eq }) => eq(wallets.userId, session.userId)
    })
  );

  if (!wallet) {
    console.error("Wallet not found for user:", session.userId);
    return NextResponse.json({ message: "Wallet not found" }, { status: 404 });
  }

  console.log("Wallet found. Balance:", wallet.balance, "Updated at:", wallet.updatedAt);

  return NextResponse.json({ 
    balance: wallet.balance, 
    currency: wallet.currency,
    updatedAt: wallet.updatedAt 
  });
}
