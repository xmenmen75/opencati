import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/user';

export interface AuthNonceResponse {
  nonce: string;
}

export interface AuthVerifyRequest {
  message: string;
  signature: string;
}

export interface AuthVerifyResponse {
  token: string;
  user: User;
}

export interface AuthMeResponse {
  user: User;
}

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Get authentication nonce for wallet address
   */
  getNonce: async (address: string): Promise<AuthNonceResponse> => {
    return apiClient.get(`/api/auth/nonce?address=${address}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  },

  /**
   * Verify SIWE signature and get authentication token
   */
  verify: async (data: AuthVerifyRequest): Promise<AuthVerifyResponse> => {
    return apiClient.post('/api/auth/verify', data, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<AuthMeResponse> => {
    return apiClient.get('/api/auth/me');
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    return apiClient.post('/api/auth/logout');
  },
};

/**
 * User API functions
 */
export const userApi = {
  /**
   * Get user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await authApi.getMe();
    return response.user;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiClient.put('/api/users/profile', data);
  },
};

/**
 * Cards API functions
 */
export const cardsApi = {
  /**
   * Get user's owned cards
   */
  getOwnedCards: async (): Promise<unknown[]> => {
    return apiClient.get('/api/cards/owned');
  },

  /**
   * Open a card pack
   */
  openPack: async (): Promise<unknown> => {
    return apiClient.post('/api/cards/open-pack');
  },
};

/**
 * Seasons API functions
 */
export const seasonsApi = {
  /**
   * Get active seasons
   */
  getActiveSeasons: async (): Promise<unknown[]> => {
    return apiClient.get('/api/seasons/active');
  },

  /**
   * Get season details
   */
  getSeason: async (seasonId: string): Promise<unknown> => {
    return apiClient.get(`/api/seasons/${seasonId}`);
  },
};

/**
 * Transactions API functions
 */
export const transactionsApi = {
  /**
   * Get user's transaction history
   */
  getTransactions: async (limit = 20, offset = 0): Promise<unknown[]> => {
    return apiClient.get(`/api/transactions?limit=${limit}&offset=${offset}`);
  },

  /**
   * Create a withdrawal request
   */
  createWithdrawal: async (data: { amount: string; toAddress: string }): Promise<unknown> => {
    return apiClient.post('/api/transactions/withdraw', data);
  },
};
