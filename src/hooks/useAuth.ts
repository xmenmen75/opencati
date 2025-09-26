import { useState, useCallback } from 'react';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import { useAuthMe, useAuthVerify, useAuthLogout } from '@/hooks/queries';
import { queryClient } from '@/lib/react-query';
import { queryKeys } from '@/hooks/queries';

const STORAGE_KEY = 'opencati_auth_token';

export function useAuth() {
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  // Use React Query hooks
  const { data: authData, isLoading: isAuthLoading, error: authError } = useAuthMe();
  const authVerifyMutation = useAuthVerify();
  const authLogoutMutation = useAuthLogout();

  const isAuthenticated = !!authData?.user;
  const user = authData?.user || null;
  const isLoading = isAuthLoading || localLoading || authVerifyMutation.isPending;
  const error = localError || 
    (authError && typeof authError === 'object' && 'message' in authError ? authError.message : null) ||
    (authVerifyMutation.error && typeof authVerifyMutation.error === 'object' && 'message' in authVerifyMutation.error ? authVerifyMutation.error.message : null) ||
    null;

  const signInWithEthereum = async (walletAddress: string, provider: ethers.BrowserProvider) => {
    // Create abort controller for this authentication attempt
    const controller = new AbortController();
    setAbortController(controller);
    
    try {
      setLocalLoading(true);
      setLocalError(null);

      // Clear any existing auth state first
      localStorage.removeItem(STORAGE_KEY);
      queryClient.clear();

      // Wait a moment to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if aborted
      if (controller.signal.aborted) {
        throw new Error('Authentication cancelled');
      }

      // Step 1: Format the wallet address with EIP-55 checksum
      const checksummedAddress = ethers.getAddress(walletAddress.toLowerCase());
      console.log('Using checksummed address:', checksummedAddress);

      // Step 2: Get nonce from server using React Query
      const nonceData = await queryClient.fetchQuery({
        queryKey: queryKeys.auth.nonce(checksummedAddress),
        queryFn: async () => {
          const response = await fetch(`/api/auth/nonce?address=${checksummedAddress}`, {
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to get nonce');
          }
          return response.json();
        },
        staleTime: 0,
        gcTime: 0,
      });

      const nonce = nonceData.nonce;
      console.log('Received nonce:', nonce);

      // Step 3: Get network info
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      if (!chainId || chainId <= 0) {
        throw new Error('Invalid network chain ID');
      }

      console.log('Using chainId:', chainId);

      // Step 4: Create SIWE message
      const domain = window.location.hostname;
      const origin = window.location.origin;
      
      const siweMessageParams = {
        domain: domain,
        address: checksummedAddress,
        statement: 'Sign in to OpenCATI with your Ethereum account.',
        uri: origin,
        version: '1' as const,
        chainId: chainId,
        nonce: nonce,
        issuedAt: new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      const message = new SiweMessage(siweMessageParams);
      const messageString = message.prepareMessage();
      
      console.log('Generated SIWE message:', messageString);

      // Check if aborted before getting signer
      if (controller.signal.aborted) {
        throw new Error('Authentication cancelled');
      }

      // Step 5: Request signature from wallet
      let signature: string;
      try {
        // Get signer and sign message with abort capability
        const signer = await provider.getSigner();
        console.log('Signer obtained, requesting signature...');
        
        // Check if aborted before signing
        if (controller.signal.aborted) {
          throw new Error('Authentication cancelled');
        }
        
        // Add abort signal to the signing process
        const signPromise = signer.signMessage(messageString);
        const abortPromise = new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Authentication cancelled'));
          });
        });
        
        signature = await Promise.race([signPromise, abortPromise]);
        console.log('Signature received');
      } catch (signingError) {
        console.error('Signing error:', signingError);
        if (signingError instanceof Error) {
          if (signingError.message.includes('User denied') || signingError.message.includes('User rejected')) {
            throw new Error('User cancelled the signature request');
          } else if (signingError.message.includes('Authentication cancelled')) {
            throw new Error('Authentication cancelled');
          }
        }
        throw new Error('Failed to sign authentication message. Please ensure MetaMask is unlocked and try again.');
      }

      // Step 6: Verify signature using React Query mutation
      const result = await authVerifyMutation.mutateAsync({
        message: messageString,
        signature,
      });

      // Step 7: Store token
      localStorage.setItem(STORAGE_KEY, result.token);

      console.log('Authentication successful');
      toast.success('Successfully signed in with Ethereum!');
      setLocalLoading(false);
      setAbortController(null);
      return { success: true, user: result.user };
    } catch (error: unknown) {
      console.error('SIWE authentication failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      // Don't show error message if it was cancelled
      if (!errorMessage.includes('cancelled')) {
        setLocalError(errorMessage);
        toast.error(`Authentication failed: ${errorMessage}`);
      }
      
      setLocalLoading(false);
      setAbortController(null);
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(async () => {
    try {
      // First, cancel any ongoing queries to prevent new requests
      await queryClient.cancelQueries();
      
      // Call logout API first (while token is still available)
      await authLogoutMutation.mutateAsync();
      
      // Clear local state
      localStorage.removeItem(STORAGE_KEY);
      
      // Clear all cached data and prevent any refetching
      queryClient.clear();
      
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Logout API failed:', error);
      // Still ensure local state is cleared even if API fails
      localStorage.removeItem(STORAGE_KEY);
      queryClient.clear();
      toast.error('Logout failed, but local session was cleared');
    }
  }, [authLogoutMutation, queryClient]);

  const clearError = useCallback(() => {
    setLocalError(null);
    authVerifyMutation.reset();
  }, [authVerifyMutation]);

  const cancelAuthentication = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setLocalLoading(false);
      setLocalError(null);
    }
  }, [abortController]);

  const checkAuthStatus = useCallback(async () => {
    // This is now handled automatically by the useAuthMe query
    // Just trigger a refetch if needed
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
  }, []);

  return {
    isAuthenticated,
    user,
    token: authData && typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
    isLoading,
    error,
    signInWithEthereum,
    logout,
    clearError,
    cancelAuthentication,
    checkAuthStatus,
  };
}
