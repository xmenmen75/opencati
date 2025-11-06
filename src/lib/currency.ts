/**
 * Currency Abstraction Layer
 * 
 * This module provides a central abstraction for handling multiple currencies
 * in the OpenCATI platform. It makes currency switching easy and type-safe.
 */

// Currency types supported by the platform
export enum CurrencyType {
  CATI = 'CATI',
  USD = 'USD',
}

// Currency configuration
export interface CurrencyConfig {
  symbol: string;
  name: string;
  decimals: number;        // Blockchain decimals (18 for CATI, 6 for USDT)
  displayDecimals: number; // UI display decimals
  canWithdraw: boolean;
  canDeposit: boolean;
  iconColor: string;       // UI color theme
}

export const CURRENCY_CONFIG: Record<CurrencyType, CurrencyConfig> = {
  [CurrencyType.CATI]: {
    symbol: 'CATI',
    name: 'CATI Token',
    decimals: 18,
    displayDecimals: 0,
    canWithdraw: true,
    canDeposit: true,
    iconColor: '#fbbf24', // amber-400
  },
  [CurrencyType.USD]: {
    symbol: 'USD',
    name: 'USD (USDT)',
    decimals: 6,
    displayDecimals: 2,
    canWithdraw: false, // USD withdrawal disabled per requirements
    canDeposit: true,
    iconColor: '#22c55e', // green-500
  },
};

// Pack opening configuration
export interface PackOpeningConfig {
  currency: CurrencyType;
  amount: number; // Human-readable amount (e.g., 2 for USD, 500 for CATI)
}

export const PACK_OPENING_COST: PackOpeningConfig = {
  currency: CurrencyType.USD,
  amount: 2, // 2 USD per pack
};

/**
 * Convert human-readable amount to blockchain units (with decimals)
 * e.g., 2 USD -> 2000000 (with 6 decimals)
 */
export function toBlockchainUnits(amount: number | string, currency: CurrencyType): bigint {
  const config = CURRENCY_CONFIG[currency];
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Multiply by 10^decimals to get blockchain units
  const multiplier = Math.pow(10, config.decimals);
  const blockchainAmount = Math.floor(amountNum * multiplier);
  
  return BigInt(blockchainAmount);
}

/**
 * Convert blockchain units to human-readable amount
 * e.g., 2000000 -> 2 USD (with 6 decimals)
 */
export function fromBlockchainUnits(amount: bigint | string, currency: CurrencyType): number {
  const config = CURRENCY_CONFIG[currency];
  const amountBigInt = typeof amount === 'string' ? BigInt(amount) : amount;
  
  // Divide by 10^decimals to get human-readable amount
  const divisor = Math.pow(10, config.decimals);
  return Number(amountBigInt) / divisor;
}

/**
 * Format currency amount for display
 * Respects the displayDecimals configuration for each currency
 */
export function formatCurrency(
  amount: number | string | bigint,
  currency: CurrencyType,
  options?: {
    includeSymbol?: boolean;
    decimals?: number;
  }
): string {
  const config = CURRENCY_CONFIG[currency];
  
  // Convert to number if needed
  let amountNum: number;
  if (typeof amount === 'bigint') {
    amountNum = fromBlockchainUnits(amount, currency);
  } else if (typeof amount === 'string') {
    // Assume string is already in human-readable format
    amountNum = parseFloat(amount);
  } else {
    amountNum = amount;
  }
  
  const decimals = options?.decimals ?? config.displayDecimals;
  const includeSymbol = options?.includeSymbol ?? true;
  
  const formatted = amountNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return includeSymbol ? `${formatted} ${config.symbol}` : formatted;
}

/**
 * Validate currency amount input
 */
export function validateCurrencyAmount(
  amount: string,
  currency: CurrencyType
): {
  isValid: boolean;
  error?: string;
} {
  const config = CURRENCY_CONFIG[currency];
  
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid amount' };
  }

  if (num <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (num > 1000000000) {
    return { isValid: false, error: 'Amount is too large' };
  }

  // Check decimal places
  const decimalPlaces = amount.split('.')[1]?.length || 0;
  if (decimalPlaces > config.decimals) {
    return { 
      isValid: false, 
      error: `Maximum ${config.decimals} decimal places allowed` 
    };
  }

  return { isValid: true };
}

/**
 * Get pack opening cost in blockchain units
 */
export function getPackCostInBlockchainUnits(): bigint {
  return toBlockchainUnits(PACK_OPENING_COST.amount, PACK_OPENING_COST.currency);
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(currency: CurrencyType): CurrencyConfig {
  return CURRENCY_CONFIG[currency];
}

/**
 * Check if currency supports withdrawals
 */
export function canWithdraw(currency: CurrencyType): boolean {
  return CURRENCY_CONFIG[currency].canWithdraw;
}

/**
 * Check if currency supports deposits
 */
export function canDeposit(currency: CurrencyType): boolean {
  return CURRENCY_CONFIG[currency].canDeposit;
}

/**
 * Get balance field name for database queries
 */
export function getBalanceFieldName(currency: CurrencyType): 'catiBalance' | 'usdBalance' {
  return currency === CurrencyType.CATI ? 'catiBalance' : 'usdBalance';
}

/**
 * Format pack opening cost for display
 */
export function formatPackCost(): string {
  return formatCurrency(PACK_OPENING_COST.amount, PACK_OPENING_COST.currency);
}

/**
 * Utility to make amount comparison easier
 */
export function hasEnoughBalance(
  userBalance: bigint | string,
  requiredAmount: bigint | string,
  currency: CurrencyType
): boolean {
  const balanceBigInt = typeof userBalance === 'string' ? BigInt(userBalance) : userBalance;
  const requiredBigInt = typeof requiredAmount === 'string' ? BigInt(requiredAmount) : requiredAmount;
  
  return balanceBigInt >= requiredBigInt;
}

/**
 * Type guard to check if a string is a valid currency type
 */
export function isCurrencyType(value: string): value is CurrencyType {
  return Object.values(CurrencyType).includes(value as CurrencyType);
}
