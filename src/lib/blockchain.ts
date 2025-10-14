import { ethers } from 'ethers';

// CATI Token Contract Configuration
export const CATI_TOKEN_CONFIG = {
  // CATI token contract address on BSC
  contractAddress: process.env.NEXT_PUBLIC_CATI_TOKEN_ADDRESS || '0xE66f3887177f59fC8FAe956b17104458aCD4b1DA',
  
  // Standard ERC-20 ABI for token operations
  abi: [
    // Transfer functions
    'function transfer(address to, uint256 amount) returns (bool)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    
    // Balance and allowance
    'function balanceOf(address account) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    
    // Approval
    'function approve(address spender, uint256 amount) returns (bool)',
    
    // Token info
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    
    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)',
  ],
  
  decimals: 18, // CATI token decimals
};

// Platform wallet configuration (for receiving deposits and sending withdrawals)
export const PLATFORM_WALLET_CONFIG = {
  // Platform wallet address that holds CATI tokens for the game
  address: process.env.PLATFORM_WALLET_ADDRESS || '0x9876543210987654321098765432109876543210',
  
  // Platform wallet private key (should be in environment variables)
  privateKey: process.env.PLATFORM_WALLET_PRIVATE_KEY,
};

// BSC Testnet RPC Configuration
export const BSC_TESTNET_CONFIG = {
  chainId: 97,
  name: 'BSC Testnet',
  rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  explorerUrl: 'https://testnet.bscscan.com',
};

// BSC Mainnet RPC Configuration
export const BSC_MAINNET_CONFIG = {
  chainId: 56,
  name: 'BSC Mainnet',
  rpcUrl: process.env.BSC_MAINNET_RPC_URL || 'https://bsc-dataseed.binance.org/',
  explorerUrl: 'https://bscscan.com',
};

// Active network configuration - CHANGE THIS TO SWITCH NETWORKS
export const ACTIVE_NETWORK = BSC_MAINNET_CONFIG; // Change to BSC_TESTNET_CONFIG for testnet

/**
 * Blockchain service for CATI token operations
 */
export class CatiBlockchainService {
  private provider: ethers.JsonRpcProvider;
  private platformWallet: ethers.Wallet;
  private catiContract: ethers.Contract;

  constructor() {
    // Initialize provider using active network
    this.provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
    
    // Initialize platform wallet
    if (!PLATFORM_WALLET_CONFIG.privateKey) {
      throw new Error('Platform wallet private key not configured');
    }
    
    this.platformWallet = new ethers.Wallet(PLATFORM_WALLET_CONFIG.privateKey, this.provider);
    
    // Initialize CATI token contract
    this.catiContract = new ethers.Contract(
      CATI_TOKEN_CONFIG.contractAddress,
      CATI_TOKEN_CONFIG.abi,
      this.platformWallet
    );
  }

  /**
   * Get CATI token balance for a wallet address
   */
  async getCatiBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.catiContract.balanceOf(walletAddress);
      return ethers.formatUnits(balance, CATI_TOKEN_CONFIG.decimals);
    } catch (error) {
      console.error('Error getting CATI balance:', error);
      throw new Error('Failed to get CATI balance');
    }
  }

  /**
   * Verify a deposit transaction exists on the blockchain
   * This checks if the user actually sent CATI tokens to our platform wallet
   */
  async verifyDepositTransaction(txHash: string, expectedFromAddress: string, expectedAmount: string): Promise<{
    isValid: boolean;
    actualAmount?: string;
    error?: string;
  }> {
    try {
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return { isValid: false, error: 'Transaction not found' };
      }

      if (receipt.status !== 1) {
        return { isValid: false, error: 'Transaction failed' };
      }

      // Parse transaction logs to find CATI transfer events
      const transferEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === CATI_TOKEN_CONFIG.contractAddress.toLowerCase())
        .map(log => {
          try {
            return this.catiContract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
          } catch {
            return null;
          }
        })
        .filter(event => event && event.name === 'Transfer');

      // Find the transfer to our platform wallet
      const depositTransfer = transferEvents.find(event => 
        event &&
        event.args.from.toLowerCase() === expectedFromAddress.toLowerCase() &&
        event.args.to.toLowerCase() === PLATFORM_WALLET_CONFIG.address.toLowerCase()
      );

      if (!depositTransfer) {
        return { isValid: false, error: 'No valid transfer found to platform wallet' };
      }

      const actualAmount = ethers.formatUnits(depositTransfer.args.value, CATI_TOKEN_CONFIG.decimals);
      const expectedAmountBN = ethers.parseUnits(expectedAmount, CATI_TOKEN_CONFIG.decimals);
      const actualAmountBN = depositTransfer.args.value;

      // Check if amounts match (with small tolerance for precision)
      const tolerance = ethers.parseUnits('0.001', CATI_TOKEN_CONFIG.decimals); // 0.001 CATI tolerance
      const diff = actualAmountBN > expectedAmountBN ? 
        actualAmountBN - expectedAmountBN : 
        expectedAmountBN - actualAmountBN;

      if (diff > tolerance) {
        return { 
          isValid: false, 
          error: `Amount mismatch. Expected: ${expectedAmount}, Actual: ${actualAmount}`,
          actualAmount 
        };
      }

      return { isValid: true, actualAmount };

    } catch (error) {
      console.error('Error verifying deposit transaction:', error);
      return { isValid: false, error: 'Failed to verify transaction' };
    }
  }

  /**
   * Send CATI tokens to a user's wallet (for withdrawals)
   */
  async sendWithdrawal(toAddress: string, amount: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      // Validate address
      const checksummedAddress = ethers.getAddress(toAddress);
      
      // Convert amount to token units
      const amountWei = ethers.parseUnits(amount, CATI_TOKEN_CONFIG.decimals);
      
      // Check platform wallet balance
      const platformBalance = await this.catiContract.balanceOf(PLATFORM_WALLET_CONFIG.address);
      
      if (platformBalance < amountWei) {
        return { 
          success: false, 
          error: 'Insufficient platform wallet balance for withdrawal' 
        };
      }

      // Estimate gas for the transaction
      const gasEstimate = await this.catiContract.transfer.estimateGas(checksummedAddress, amountWei);
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // Add 20% buffer

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('5', 'gwei'); // Fallback gas price

      // Execute transfer
      const tx = await this.catiContract.transfer(checksummedAddress, amountWei, {
        gasLimit,
        gasPrice,
      });

      console.log(`Withdrawal transaction sent: ${tx.hash}`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        console.log(`Withdrawal confirmed: ${tx.hash}`);
        return { success: true, txHash: tx.hash };
      } else {
        return { success: false, error: 'Transaction failed on blockchain' };
      }

    } catch (error) {
      console.error('Error sending withdrawal:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send withdrawal' 
      };
    }
  }

  /**
   * Get transaction details by hash
   */
  async getTransactionDetails(txHash: string): Promise<{
    exists: boolean;
    status?: number;
    from?: string;
    to?: string;
    value?: string;
    gasUsed?: string;
    blockNumber?: number;
  }> {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      if (!tx) {
        return { exists: false };
      }

      return {
        exists: true,
        status: receipt?.status || undefined,
        from: tx.from,
        to: tx.to || undefined,
        value: ethers.formatEther(tx.value),
        gasUsed: receipt?.gasUsed?.toString(),
        blockNumber: receipt?.blockNumber,
      };

    } catch (error) {
      console.error('Error getting transaction details:', error);
      return { exists: false };
    }
  }

  /**
   * Check if platform wallet has enough CATI tokens for withdrawals
   */
  async checkPlatformBalance(): Promise<{
    balance: string;
    isLowBalance: boolean;
    threshold: string;
  }> {
    const balance = await this.getCatiBalance(PLATFORM_WALLET_CONFIG.address);
    const threshold = '10000'; // 10,000 CATI minimum threshold
    const isLowBalance = parseFloat(balance) < parseFloat(threshold);

    return {
      balance,
      isLowBalance,
      threshold,
    };
  }
}

/**
 * Singleton instance of the blockchain service
 */
let blockchainService: CatiBlockchainService | null = null;

export function getCatiBlockchainService(): CatiBlockchainService {
  if (!blockchainService) {
    blockchainService = new CatiBlockchainService();
  }
  return blockchainService;
}
