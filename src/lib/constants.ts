// Application constants

// Wallet limits
export const MAX_WALLET_BALANCE = 2000; // Maximum diamonds a user can hold
export const MIN_WITHDRAWAL_DIAMONDS = 100; // Minimum diamonds for withdrawal

// Quiz settings
export const DEFAULT_QUESTION_TIME_LIMIT = 30; // seconds

// Currency
export const DIAMOND_TO_NAIRA_RATE = 50; // 1 diamond = ₦50

// VIP Membership
export const VIP_COST_NAIRA = 50000; // ₦50,000 for VIP
export const VIP_COST_DIAMONDS = VIP_COST_NAIRA / DIAMOND_TO_NAIRA_RATE; // 1000 diamonds
export const VIP_DURATION_DAYS = 30; // 30 days VIP membership