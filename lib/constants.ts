/**
 * Application constants
 */

// NIN Verification Cost (in kobo)
export const NIN_VERIFICATION_COST_KOBO = 50000; // ₦500

// NIN Verification Cost (in Naira)
export const NIN_VERIFICATION_COST_NAIRA = 500;

// Currency constants
export const CURRENCY = 'NGN';
export const KOBO_PER_NAIRA = 100;

// System limits
export const MAX_DAILY_VERIFICATIONS_PER_USER = parseInt(process.env.MAX_DAILY_VERIFICATIONS_PER_USER || '10');
export const MAX_WALLET_FUNDING_AMOUNT_KOBO = parseInt(process.env.MAX_WALLET_FUNDING_AMOUNT || '100000000'); // ₦1,000,000
export const MIN_WALLET_FUNDING_AMOUNT_KOBO = parseInt(process.env.MIN_WALLET_FUNDING_AMOUNT || '50000'); // ₦500