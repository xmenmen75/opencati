import { ethers, BrowserProvider } from 'ethers';
import { CATI_TOKEN_CONFIG, PLATFORM_WALLET_CONFIG } from './blockchain';

// Re-export for convenience
export { CATI_TOKEN_CONFIG };

// Platform wallet address (frontend-safe, no private key)
export const PLATFORM_WALLET_ADDRESS = PLATFORM_WALLET_CONFIG.address;

/**
 * Get CATI token balance for a wallet address using browser provider
 */
export async function getCatiTokenBalance(
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
    console.log('🔍 Connected to network:', {
      chainId: network.chainId.toString(),
      name: network.name,
      contractAddress: CATI_TOKEN_CONFIG.contractAddress
    });

    // Create contract instance
    const contract = new ethers.Contract(
      CATI_TOKEN_CONFIG.contractAddress,
      CATI_TOKEN_CONFIG.abi,
      ethProvider
    );

    // Check if contract exists on this network
    const code = await ethProvider.getCode(CATI_TOKEN_CONFIG.contractAddress);
    if (code === '0x') {
      console.error('⚠️ No contract found at address on this network!');
      console.error('Expected chain:', 56, 'Connected to:', network.chainId.toString());
      throw new Error(`CATI token contract not found on chain ${network.chainId}. Please switch to BSC Mainnet.`);
    }

    // Get balance
    const balance = await contract.balanceOf(walletAddress);
    
    // Format with proper decimals
    return ethers.formatUnits(balance, CATI_TOKEN_CONFIG.decimals);
  } catch (error) {
    console.error('Error getting CATI token balance:', error);
    if (error instanceof Error && error.message.includes('not found on chain')) {
      throw error; // Re-throw our custom error
    }
    throw new Error('Failed to get CATI token balance');
  }
}

/**
 * Get BNB balance for a wallet address
 */
export async function getBnbBalance(
  walletAddress: string,
  provider?: BrowserProvider
): Promise<string> {
  try {
    const ethProvider = provider || (
      window.ethereum ? new BrowserProvider(window.ethereum) : null
    );
    
    if (!ethProvider) {
      throw new Error('No Ethereum provider found');
    }

    const balance = await ethProvider.getBalance(walletAddress);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting BNB balance:', error);
    throw new Error('Failed to get BNB balance');
  }
}

/**
 * Transfer CATI tokens to platform wallet
 * This initiates the deposit transaction from user's wallet
 */
export async function transferCatiToPlatform(
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
      CATI_TOKEN_CONFIG.contractAddress,
      CATI_TOKEN_CONFIG.abi,
      signer
    );

    // Convert amount to token units (with decimals)
    const amountWei = ethers.parseUnits(amount, CATI_TOKEN_CONFIG.decimals);

    // Check user's balance
    const userAddress = await signer.getAddress();
    const balance = await contract.balanceOf(userAddress);
    
    if (balance < amountWei) {
      return { 
        success: false, 
        error: `Insufficient CATI balance. You have ${ethers.formatUnits(balance, CATI_TOKEN_CONFIG.decimals)} CATI` 
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

    console.log('Transfer transaction sent:', tx.hash);
    
    // Wait for confirmation (1 block)
    const receipt = await tx.wait(1);
    
    if (receipt && receipt.status === 1) {
      console.log('Transfer confirmed:', tx.hash);
      return { success: true, txHash: tx.hash };
    } else {
      return { success: false, error: 'Transaction failed on blockchain' };
    }

  } catch (error) {
    console.error('Error transferring CATI tokens:', error);
    
    if (error instanceof Error) {
      // Handle common errors
      if (error.message.includes('user rejected') || error.message.includes('User denied')) {
        return { success: false, error: 'Transaction cancelled by user' };
      } else if (error.message.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient funds for gas fees' };
      }
      
      return { success: false, error: error.message };
    }
    
    return { success: false, error: 'Failed to transfer CATI tokens' };
  }
}

/**
 * Get token information (name, symbol, decimals)
 */
export async function getCatiTokenInfo(provider?: BrowserProvider): Promise<{
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
      CATI_TOKEN_CONFIG.contractAddress,
      CATI_TOKEN_CONFIG.abi,
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
    // Return defaults if contract call fails (wrong network, contract issue, etc.)
    console.debug('Error getting token info, using defaults:', error);
    return {
      name: 'CATI Token',
      symbol: 'CATI',
      decimals: CATI_TOKEN_CONFIG.decimals,
    };
  }
}

/**
 * Check if user has enough CATI balance for a transaction
 */
export async function hasEnoughCatiBalance(
  walletAddress: string,
  requiredAmount: string,
  provider?: BrowserProvider
): Promise<boolean> {
  try {
    const balance = await getCatiTokenBalance(walletAddress, provider);
    return parseFloat(balance) >= parseFloat(requiredAmount);
  } catch (error) {
    console.error('Error checking CATI balance:', error);
    return false;
  }
}

/**
 * Format CATI amount for display
 */
export function formatCatiAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Validate CATI amount input
 */
export function validateCatiAmount(amount: string): {
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

  // Check decimal places (max 18 for CATI)
  const decimalPlaces = amount.split('.')[1]?.length || 0;
  if (decimalPlaces > CATI_TOKEN_CONFIG.decimals) {
    return { 
      isValid: false, 
      error: `Maximum ${CATI_TOKEN_CONFIG.decimals} decimal places allowed` 
    };
  }

  return { isValid: true };
}
