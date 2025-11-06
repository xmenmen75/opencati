import { ethers, BrowserProvider } from 'ethers';

// USDT Token Contract Configuration on BSC
export const USDT_TOKEN_CONFIG = {
  // USDT contract address on BSC Mainnet
  contractAddress: process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
  
  // Standard ERC-20 ABI for token operations (same as CATI)
  abi: [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  
  decimals: 6, // USDT uses 6 decimals
};

// Re-export platform wallet address
import { PLATFORM_WALLET_CONFIG } from './blockchain';
export const PLATFORM_WALLET_ADDRESS = PLATFORM_WALLET_CONFIG.address;

/**
 * Get USDT token balance for a wallet address using browser provider
 */
export async function getUsdtTokenBalance(
  walletAddress: string,
  provider?: BrowserProvider
): Promise<string> {
  try {
    // Use provided provider or create new one from window.ethereum
    const ethProvider = provider || (
      window.ethereum ? new BrowserProvider(window.ethereum) : null
    );
    
    if (!ethProvider) {
      throw new Error('No Ethereum provider found');
    }

    // Check which network we're connected to
    const network = await ethProvider.getNetwork();
    console.log('🔍 Connected to network for USDT:', {
      chainId: network.chainId.toString(),
      name: network.name,
      contractAddress: USDT_TOKEN_CONFIG.contractAddress
    });

    // Create contract instance
    const contract = new ethers.Contract(
      USDT_TOKEN_CONFIG.contractAddress,
      USDT_TOKEN_CONFIG.abi,
      ethProvider
    );

    // Check if contract exists on this network
    const code = await ethProvider.getCode(USDT_TOKEN_CONFIG.contractAddress);
    if (code === '0x') {
      console.error('⚠️ No USDT contract found at address on this network!');
      console.error('Expected chain:', 56, 'Connected to:', network.chainId.toString());
      throw new Error(`USDT token contract not found on chain ${network.chainId}. Please switch to BSC Mainnet.`);
    }

    // Get balance
    const balance = await contract.balanceOf(walletAddress);
    
    // Format with proper decimals (6 for USDT)
    return ethers.formatUnits(balance, USDT_TOKEN_CONFIG.decimals);
  } catch (error) {
    console.error('Error getting USDT token balance:', error);
    if (error instanceof Error && error.message.includes('not found on chain')) {
      throw error; // Re-throw our custom error
    }
    throw new Error('Failed to get USDT token balance');
  }
}

/**
 * Transfer USDT tokens to platform wallet
 * This initiates the deposit transaction from user's wallet
 */
export async function transferUsdtToPlatform(
  amount: string,
  provider?: BrowserProvider
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> {
  try {
    // Get provider and signer
    const ethProvider = provider || (
      window.ethereum ? new BrowserProvider(window.ethereum) : null
    );
    
    if (!ethProvider) {
      return { success: false, error: 'No Ethereum provider found' };
    }

    const signer = await ethProvider.getSigner();
    
    // Create contract instance with signer
    const contract = new ethers.Contract(
      USDT_TOKEN_CONFIG.contractAddress,
      USDT_TOKEN_CONFIG.abi,
      signer
    );

    // Convert amount to token units (with 6 decimals for USDT)
    const amountWei = ethers.parseUnits(amount, USDT_TOKEN_CONFIG.decimals);

    // Check user's balance
    const userAddress = await signer.getAddress();
    const balance = await contract.balanceOf(userAddress);
    
    if (balance < amountWei) {
      return { 
        success: false, 
        error: `Insufficient USDT balance. You have ${ethers.formatUnits(balance, USDT_TOKEN_CONFIG.decimals)} USDT` 
      };
    }

    // Estimate gas
    const gasEstimate = await contract.transfer.estimateGas(
      PLATFORM_WALLET_ADDRESS,
      amountWei
    );
    
    // Add 20% buffer to gas estimate
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

    // Execute transfer
    const tx = await contract.transfer(
      PLATFORM_WALLET_ADDRESS,
      amountWei,
      { gasLimit }
    );

    console.log('USDT transfer transaction sent:', tx.hash);
    
    // Wait for confirmation (1 block)
    const receipt = await tx.wait(1);
    
    if (receipt && receipt.status === 1) {
      console.log('USDT transfer confirmed:', tx.hash);
      return { success: true, txHash: tx.hash };
    } else {
      return { success: false, error: 'Transaction failed on blockchain' };
    }

  } catch (error) {
    console.error('Error transferring USDT tokens:', error);
    
    if (error instanceof Error) {
      // Handle common errors
      if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        return { success: false, error: 'Transaction cancelled by user' };
      } else if (error.message.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient funds for gas fees' };
      }
      
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'Failed to transfer USDT tokens' };
  }
}

/**
 * Get USDT token information (name, symbol, decimals)
 */
export async function getUsdtTokenInfo(provider?: BrowserProvider): Promise<{
  name: string;
  symbol: string;
  decimals: number;
}> {
  try {
    const ethProvider = provider || (
      window.ethereum ? new BrowserProvider(window.ethereum) : null
    );
    
    if (!ethProvider) {
      throw new Error('No Ethereum provider found');
    }

    const contract = new ethers.Contract(
      USDT_TOKEN_CONFIG.contractAddress,
      USDT_TOKEN_CONFIG.abi,
      ethProvider
    );

    // Try to fetch token info with timeout
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetching token info')), 5000)
    );

    const fetchInfo = Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);

    const [name, symbol, decimals] = await Promise.race([fetchInfo, timeout]) as [string, string, bigint];

    return { name, symbol, decimals: Number(decimals) };
  } catch (error) {
    // Return defaults if contract call fails
    console.debug('Error getting USDT token info, using defaults:', error);
    return {
      name: 'Tether USD',
      symbol: 'USDT',
      decimals: USDT_TOKEN_CONFIG.decimals,
    };
  }
}

/**
 * Check if user has enough USDT balance for a transaction
 */
export async function hasEnoughUsdtBalance(
  walletAddress: string,
  requiredAmount: string,
  provider?: BrowserProvider
): Promise<boolean> {
  try {
    const balance = await getUsdtTokenBalance(walletAddress, provider);
    return parseFloat(balance) >= parseFloat(requiredAmount);
  } catch (error) {
    console.error('Error checking USDT balance:', error);
    return false;
  }
}

/**
 * Format USDT amount for display
 */
export function formatUsdtAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Validate USDT amount input
 */
export function validateUsdtAmount(amount: string): {
  isValid: boolean;
  error?: string;
} {
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

  // Check decimal places (max 6 for USDT)
  const decimalPlaces = amount.split('.')[1]?.length || 0;
  if (decimalPlaces > USDT_TOKEN_CONFIG.decimals) {
    return { 
      isValid: false, 
      error: `Maximum ${USDT_TOKEN_CONFIG.decimals} decimal places allowed` 
    };
  }

  return { isValid: true };
}
