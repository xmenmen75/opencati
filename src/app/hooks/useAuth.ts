import { useState, useEffect, useCallback } from 'react';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import type { AuthState } from '@/types/user';

const STORAGE_KEY = 'opencati_auth_token';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  // Check for existing token on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEY);
      
      if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          token,
          isLoading: false,
          error: null,
        });
      } else {
        // Token is invalid, remove it
        localStorage.removeItem(STORAGE_KEY);
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to check authentication status',
      }));
    }
  };

  const signInWithEthereum = async (walletAddress: string, provider: ethers.BrowserProvider) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Clear any existing auth state first
      localStorage.removeItem(STORAGE_KEY);

      // Wait a moment to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 1: Properly format the wallet address with EIP-55 checksum
      const checksummedAddress = ethers.getAddress(walletAddress.toLowerCase());
      console.log('Using checksummed address:', checksummedAddress);

      // Step 2: Get nonce from server
      const nonceResponse = await fetch(`/api/auth/nonce?address=${checksummedAddress}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!nonceResponse.ok) {
        const errorData = await nonceResponse.json();
        throw new Error(errorData.error || 'Failed to get nonce');
      }

      const nonceData = await nonceResponse.json();
      const nonce = nonceData.nonce;
      console.log('Received nonce:', nonce);

      // Step 3: Get network info with proper validation
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Validate chainId is valid
      if (!chainId || chainId <= 0) {
        throw new Error('Invalid network chain ID');
      }

      console.log('Using chainId:', chainId);

      // Step 4: Create SIWE message with strict validation
      const domain = window.location.hostname; // Use hostname instead of host to avoid port issues
      const origin = window.location.origin;
      
      console.log('SIWE params:', {
        domain,
        address: checksummedAddress,
        chainId,
        nonce,
        origin
      });

      // Create SIWE message with explicit types and validation
      const siweMessageParams = {
        domain: domain,
        address: checksummedAddress, // Use checksummed address
        statement: 'Sign in to OpenCATI with your Ethereum account.',
        uri: origin,
        version: '1' as const,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        // Add expiration time (10 minutes from now)
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      const message = new SiweMessage(siweMessageParams);
      const messageString = message.prepareMessage();
      
      console.log('Generated SIWE message:', messageString);

      // Step 5: Request signature from wallet with better error handling
      let signature: string;
      try {
        const signer = await provider.getSigner();
        signature = await signer.signMessage(messageString);
        console.log('Signature received');
      } catch (signingError) {
        if (signingError instanceof Error && signingError.message.includes('User denied')) {
          throw new Error('User cancelled the signature request');
        }
        throw new Error('Failed to sign authentication message');
      }

      // Step 6: Verify signature with server (single attempt with smart error handling)
      const verifyResponse = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          message: messageString,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        console.error('Verification failed:', errorData);
        throw new Error(errorData.error || 'Authentication verification failed');
      }

      const { token, user } = await verifyResponse.json();

      // Step 7: Store token and update state
      localStorage.setItem(STORAGE_KEY, token);
      
      setAuthState({
        isAuthenticated: true,
        user,
        token,
        isLoading: false,
        error: null,
      });

      console.log('Authentication successful');
      return { success: true, user };
    } catch (error: unknown) {
      console.error('SIWE authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const token = authState.token;
      
      // Clear local state immediately
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
      
      // Clear local storage
      localStorage.removeItem(STORAGE_KEY);
      
      if (token) {
        // Notify server about logout (don't wait for response)
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }).catch(console.error); // Silent fail for logout
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Still ensure local state is cleared
      localStorage.removeItem(STORAGE_KEY);
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    }
  };

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    signInWithEthereum,
    logout,
    clearError,
    checkAuthStatus,
  };
}
