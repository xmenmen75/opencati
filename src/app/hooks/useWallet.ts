import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAuth } from '@/hooks/useAuth';
import { getMetaMaskErrorMessage } from '@/lib/wallet-utils';
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

const BSC_TESTNET_CHAIN_ID = '0x61'; // 97 in decimal

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    error: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const { isAuthenticated, user, signInWithEthereum, logout, isLoading: authLoading, error: authError, clearError: clearAuthError, cancelAuthentication } = useAuth();

  // Check for existing connection on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Check if user is connected to the correct network
  const isCorrectNetwork = true; // For now, assume always correct

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
    logout();
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

  return {
    walletState,
    user,
    isAuthenticated,
    authLoading,
    authError,
    isConnecting,
    connectWallet,
    disconnectWallet,
    isCorrectNetwork,
    clearAuthError,
    cancelAuthentication,
  };
}
