export interface User {
  walletAddress: string;
  name?: string;
  profilePictureUrl?: string;
  catiTokens: number;
  ownedCards: string[]; // Array of card IDs
  nickname?: string;
  language?: string;
  timezone?: string;
}

export interface WalletState {
  isConnected: boolean;
  account: string | null;
  balance: string | null;
  chainId: string | null;
  isLoading: boolean;
  error: string | null;
}
