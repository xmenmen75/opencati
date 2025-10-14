import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAuth } from '@/hooks/useAuth';
import { getMetaMaskErrorMessage } from '@/lib/wallet-utils';
import { ACTIVE_NETWORK } from '@/lib/blockchain';
import {
  getCatiTokenBalance,
  getBnbBalance,
  transferCatiToPlatform,
  hasEnoughCatiBalance,
  getCatiTokenInfo,
} from '@/lib/cati-token';
import type { WalletState } from '@/types/user';

// MetaMask Ethereum provider types
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// Get chain ID from active network
const ACTIVE_CHAIN_ID = `0x${ACTIVE_NETWORK.chainId.toString(16)}`;

interface TokenBalances {
  catiBalance: string;
  bnbBalance: string;
  isLoading: boolean;
  error: string | null;
}

interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { isAuthenticated, user, signInWithEthereum, logout, isLoading: authLoading, error: authError, clearError: clearAuthError, cancelAuthentication } = useAuth();

  // Token balances state
  const [balances, setBalances] = useState<TokenBalances>({
    catiBalance: '0',
    bnbBalance: '0',
    isLoading: false,
    error: null,
  });

  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    name: 'CATI Token',
    symbol: 'CATI',
    decimals: 18,
  });

  const [isTransferring, setIsTransferring] = useState(false);

  // Check for existing connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Check if user is connected to the correct network
  const isCorrectNetwork = true; // For now, assume always correct

  /**
   * Fetch token balances (CATI and BNB)
   */
  const fetchBalances = useCallback(async () => {
    if (!walletState.address) {
      setBalances({
        catiBalance: '0',
        bnbBalance: '0',
        isLoading: false,
        error: null,
      });
      return;
    }

    setBalances(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // First, verify we're on the correct network
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      
      console.log('🔍 fetchBalances - Current network:', {
        chainId: currentChainId,
        expectedChainId: ACTIVE_NETWORK.chainId,
        match: currentChainId === ACTIVE_NETWORK.chainId
      });
      
      if (currentChainId !== ACTIVE_NETWORK.chainId) {
        throw new Error(`Wrong network. Connected to chain ${currentChainId}, expected ${ACTIVE_NETWORK.chainId} (${ACTIVE_NETWORK.name})`);
      }

      const [cati, bnb] = await Promise.all([
        getCatiTokenBalance(walletState.address, provider),
        getBnbBalance(walletState.address, provider),
      ]);

      setBalances({
        catiBalance: cati,
        bnbBalance: bnb,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setBalances(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balances',
      }));
    }
  }, [walletState.address]);

  /**
   * Fetch token info (name, symbol, decimals)
   * This is optional and won't block the app if it fails
   */
  const fetchTokenInfo = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const info = await getCatiTokenInfo(provider);
      setTokenInfo(info);
    } catch (error) {
      // Silently fail - token info is not critical
      // We'll use default values already set in state
      console.debug('Could not fetch token info, using defaults:', error);
    }
  }, []);

  /**
   * Transfer CATI tokens to platform (deposit)
   */
  const depositCati = useCallback(async (amount: string): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> => {
    if (!walletState.address || !window.ethereum) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsTransferring(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check balance first
      const hasBalance = await hasEnoughCatiBalance(walletState.address, amount, provider);
      
      if (!hasBalance) {
        setIsTransferring(false);
        return { 
          success: false, 
          error: 'Insufficient CATI balance' 
        };
      }

      // Execute transfer
      const result = await transferCatiToPlatform(amount, provider);
      
      // Refresh balances after transfer
      if (result.success) {
        await fetchBalances();
      }

      return result;
    } catch (error) {
      console.error('Error depositing CATI:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to deposit CATI',
      };
    } finally {
      setIsTransferring(false);
    }
  }, [walletState.address, fetchBalances]);

  /**
   * Refresh balances manually
   */
  const refreshBalances = useCallback(() => {
    fetchBalances();
  }, [fetchBalances]);

  const checkWalletConnection = async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({
        method: 'eth_accounts',
      }) as string[];

      if (accounts && accounts.length > 0) {
        setWalletState({
          isConnected: true,
          isConnecting: false,
          address: accounts[0],
          error: null,
        });
      }
    } catch (error) {
      console.error('Failed to check wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please make sure MetaMask is unlocked.');
      }

      const account = accounts[0];
      
      if (!window.ethereum) {
        throw new Error('MetaMask is no longer available');
      }

      // Check and switch to correct network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ACTIVE_CHAIN_ID }],
        });
      } catch (switchError: unknown) {
        // If network doesn't exist, add it
        if ((switchError as { code?: number }).code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ACTIVE_CHAIN_ID,
                chainName: ACTIVE_NETWORK.name,
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: [ACTIVE_NETWORK.rpcUrl],
                blockExplorerUrls: [ACTIVE_NETWORK.explorerUrl],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
      
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Update wallet state
      setWalletState({
        isConnected: true,
        isConnecting: false,
        address: account,
        error: null,
      });

      // Authenticate with SIWE
      const authResult = await signInWithEthereum(account, provider);
      
      if (!authResult.success) {
        throw new Error(authResult.error || 'Authentication failed');
      }

    } catch (error: unknown) {
      const errorMessage = getMetaMaskErrorMessage(error);
      setWalletState({
        isConnected: false,
        isConnecting: false,
        address: null,
        error: errorMessage,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      isConnecting: false,
      address: null,
      error: null,
    });
    // Reset balances on disconnect
    setBalances({
      catiBalance: '0',
      bnbBalance: '0',
      isLoading: false,
      error: null,
    });
    logout();
  };

  /**
   * Manually switch to the correct network
   */
  const switchToCorrectNetwork = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ACTIVE_CHAIN_ID }],
      });
    } catch (switchError: unknown) {
      // If network doesn't exist, add it
      if ((switchError as { code?: number }).code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: ACTIVE_CHAIN_ID,
              chainName: ACTIVE_NETWORK.name,
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18,
              },
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: [ACTIVE_NETWORK.explorerUrl],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  };

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (accountsArray.length === 0) {
        disconnectWallet();
      } else if (accountsArray[0] !== walletState.address) {
        await disconnectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [walletState.address, disconnectWallet]);

  // Fetch balances when wallet address changes or becomes available
  useEffect(() => {
    if (walletState.address && walletState.isConnected) {
      fetchBalances();
    }
  }, [walletState.address, walletState.isConnected, fetchBalances]);

  // Fetch token info once on mount (optional, non-blocking)
  useEffect(() => {
    if (window.ethereum) {
      // Fire and forget - don't wait for this
      fetchTokenInfo().catch(() => {
        // Already handled in fetchTokenInfo
      });
    }
  }, [fetchTokenInfo]);

  // Set up auto-refresh interval for balances (every 30 seconds)
  useEffect(() => {
    if (!walletState.address || !walletState.isConnected) return;

    const intervalId = setInterval(() => {
      fetchBalances();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [walletState.address, walletState.isConnected, fetchBalances]);

  return {
    // Wallet connection state
    walletState,
    user,
    isAuthenticated,
    authLoading,
    authError,
    isConnecting,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    isCorrectNetwork,
    clearAuthError,
    cancelAuthentication,
    
    // Token balances and operations
    catiBalance: balances.catiBalance,
    bnbBalance: balances.bnbBalance,
    isLoadingBalances: balances.isLoading,
    balancesError: balances.error,
    tokenInfo,
    isTransferring,
    depositCati,
    refreshBalances,
    
    // Network info
    expectedNetwork: ACTIVE_NETWORK,
    expectedChainId: ACTIVE_CHAIN_ID,
  };
}
