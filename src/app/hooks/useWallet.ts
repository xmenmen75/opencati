import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import type { WalletState, User } from '@/types/user';
import { createUser, fetchUserData, saveUserData } from '../services/userService';

// BNB Smart Chain Testnet configuration
const BSC_TESTNET = {
  chainId: '0x61', // 97 in decimal
  chainName: 'BNB Smart Chain Testnet',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
  blockExplorerUrls: ['https://testnet.bscscan.com/'],
};

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    balance: null,
    chainId: null,
    isLoading: false,
    error: null,
  });

  const [user, setUser] = useState<User | null>(null);

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const balance = await provider.getBalance(address);
          const network = await provider.getNetwork();
          
          setWalletState({
            isConnected: true,
            account: address,
            balance: ethers.formatEther(balance),
            chainId: `0x${network.chainId.toString(16)}`,
            isLoading: false,
            error: null,
          });

          // Fetch or create user data
          let userData = await fetchUserData(address);
          if (!userData) {
            userData = createUser(address);
          }
          setUser(userData);
          await saveUserData(userData);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const connectWallet = async () => {
    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to use this feature.');
      }

      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);

      // Check if we're on BSC Testnet
      const network = await provider.getNetwork();
      const currentChainId = `0x${network.chainId.toString(16)}`;

      if (currentChainId !== BSC_TESTNET.chainId) {
        // Try to switch to BSC Testnet
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_TESTNET.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BSC_TESTNET],
            });
          } else {
            throw switchError;
          }
        }
      }

      // Get updated provider after network switch
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await updatedProvider.getSigner();
      const address = await signer.getAddress();
      const balance = await updatedProvider.getBalance(address);
      const updatedNetwork = await updatedProvider.getNetwork();

      setWalletState({
        isConnected: true,
        account: address,
        balance: ethers.formatEther(balance),
        chainId: `0x${updatedNetwork.chainId.toString(16)}`,
        isLoading: false,
        error: null,
      });

      // Create and save user data
      let userData = await fetchUserData(address);
      if (!userData) {
        userData = createUser(address);
      }
      setUser(userData);
      await saveUserData(userData);

      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

    } catch (error: any) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected wallet
      setWalletState({
        isConnected: false,
        account: null,
        balance: null,
        chainId: null,
        isLoading: false,
        error: null,
      });
      setUser(null);
    } else {
      // Account changed
      checkConnection();
    }
  };

  const handleChainChanged = () => {
    // Reload the page when chain changes
    window.location.reload();
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      account: null,
      balance: null,
      chainId: null,
      isLoading: false,
      error: null,
    });
    
    setUser(null);
    
    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
    }
  };

  const isCorrectNetwork = walletState.chainId === BSC_TESTNET.chainId;

  return {
    walletState,
    user,
    connectWallet,
    disconnectWallet,
    isCorrectNetwork,
  };
}

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
