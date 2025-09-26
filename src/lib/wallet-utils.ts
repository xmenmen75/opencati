/**
 * Wallet utility functions for handling MetaMask connection and error states
 */

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

export interface MetaMaskStatus {
  isInstalled: boolean;
  isLocked: boolean | null; // null if we can't determine
  hasAccounts: boolean;
  error?: string;
}

/**
 * Check the current status of MetaMask
 * This function helps identify if MetaMask is installed, locked, or has accounts
 */
export async function checkMetaMaskStatus(): Promise<MetaMaskStatus> {
  const status: MetaMaskStatus = {
    isInstalled: false,
    isLocked: null,
    hasAccounts: false,
  };

  // Check if MetaMask is installed
  if (!window.ethereum) {
    status.error = 'MetaMask is not installed';
    return status;
  }

  status.isInstalled = true;

  try {
    // Try to get accounts without requesting permission with a short timeout
    // This will return accounts if already connected and unlocked, empty array if locked/disconnected
    const accountsPromise = window.ethereum.request({
      method: 'eth_accounts',
    }) as Promise<string[]>;
    
    const timeoutPromise = createTimeoutPromise<string[]>(5000, 'Timeout checking accounts');
    
    const accounts = await Promise.race([accountsPromise, timeoutPromise]).catch((error) => {
      console.warn('Error getting accounts:', error);
      return [] as string[];
    });

    status.hasAccounts = accounts && accounts.length > 0;

    // If we have accounts, MetaMask is definitely unlocked and connected
    if (status.hasAccounts) {
      status.isLocked = false;
      return status;
    }

    // If no accounts, try to determine if it's locked vs disconnected
    // Try a quick non-intrusive check
    try {
      const chainIdPromise = window.ethereum.request({
        method: 'eth_chainId',
      });
      
      const chainTimeoutPromise = createTimeoutPromise(3000, 'Chain ID timeout');
      
      await Promise.race([chainIdPromise, chainTimeoutPromise]);
      
      // If we can get chain ID quickly but no accounts, likely just disconnected
      status.isLocked = false;
    } catch (chainError) {
      // If we can't get chain ID or it times out, MetaMask might be locked
      console.warn('Chain ID check failed, MetaMask might be locked:', chainError);
      
      if (chainError instanceof Error && chainError.message.includes('timeout')) {
        // Timeout suggests MetaMask might be locked or unresponsive
        status.isLocked = true;
        status.error = 'MetaMask appears to be locked or unresponsive';
      } else {
        status.isLocked = null; // Unknown state
      }
    }

  } catch (error) {
    console.error('Error checking MetaMask status:', error);
    if (error instanceof Error) {
      if (error.message.includes('locked') || error.message.includes('unauthorized')) {
        status.isLocked = true;
        status.error = 'MetaMask is locked';
      } else {
        status.error = error.message;
      }
    } else {
      status.error = 'Unknown error checking MetaMask status';
    }
  }

  return status;
}

/**
 * Create a promise that rejects after a timeout
 * Useful for adding timeouts to MetaMask requests
 */
export function createTimeoutPromise<T = never>(timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });
}

/**
 * Simple wrapper for eth_requestAccounts with better error handling
 */
export async function requestAccounts(): Promise<string[]> {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please make sure MetaMask is unlocked.');
    }
    
    return accounts;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User rejected') || error.message.includes('User denied')) {
        throw new Error('Connection cancelled by user.');
      } else if (error.message.includes('locked') || error.message.includes('unauthorized')) {
        throw new Error('MetaMask is locked. Please unlock your wallet and try again.');
      }
    }
    throw error;
  }
}

/**
 * Get user-friendly error message for common MetaMask errors
 */
export function getMetaMaskErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An unknown error occurred';
  }

  const message = error.message.toLowerCase();

  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Connection cancelled by user.';
  } else if (message.includes('timed out') || message.includes('timeout')) {
    return 'Connection timed out. MetaMask might be locked. Please unlock MetaMask and try again.';
  } else if (message.includes('locked') || message.includes('unauthorized')) {
    return 'MetaMask is locked. Please unlock your wallet and try again.';
  } else if (message.includes('not installed')) {
    return 'MetaMask is not installed. Please install MetaMask to continue.';
  } else if (message.includes('wrong network') || message.includes('unsupported network')) {
    return 'Please switch to the correct network in MetaMask.';
  } else if (message.includes('insufficient funds')) {
    return 'Insufficient funds to complete the transaction.';
  } else {
    return error.message;
  }
}
