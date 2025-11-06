export interface User {
  id?: string;
  walletAddress: string;
  userNickname: string;
  profilePictureUrl?: string;
  catiBalance: string; // String to handle BigInt conversion
  usdBalance: string;  // String to handle BigInt conversion
  language?: string; // User's preferred language
  timezone?: string; // User's preferred timezone
  createdAt?: Date;
  ownedCards?: string[]; // Array of card IDs for backward compatibility
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  error: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}
