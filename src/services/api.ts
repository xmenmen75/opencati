import { apiClient } from '@/lib/api-client';
import type { User } from '@/types/user';
import type { OwnedCard, PackOpeningResult } from '@/types/card';

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

export interface UpdateProfileRequest {
  userNickname?: string;
  language?: string;
  timezone?: string;
  profilePictureFile?: File;
}

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
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const formData = new FormData();
    
    // Add text fields
    if (data.userNickname !== undefined) {
      formData.append('userNickname', data.userNickname);
    }
    if (data.language !== undefined) {
      formData.append('language', data.language);
    }
    if (data.timezone !== undefined) {
      formData.append('timezone', data.timezone);
    }
    
    // Add file if provided
    if (data.profilePictureFile) {
      formData.append('profilePictureFile', data.profilePictureFile);
    }

    return apiClient.put('/api/users/profile', formData);
  },
};

export interface PackOpenResponse {
  success: boolean;
  card?: OwnedCard;
  failureReason?: string;
  message?: string;
  newBalance: string;
  season?: {
    id: string;
    name: string;
    slogan: string;
  };
}

export interface SeasonRewardsResponse {
  season: {
    id: string;
    name: string;
    slogan: string;
    sponsorAmount: string;
  };
  poolInfo: {
    totalPool: string;
    totalSpent: string;
    sponsorAmount: string;
    rankPools: Record<string, string>;
    rankCounts: Record<string, number>;
    rewardPerCard: Record<string, string>;
  };
  userSummary: Array<{
    user: {
      id: string;
      userNickname: string;
    };
    totalSpent: string;
    totalReward: string;
    cardCounts: Record<string, number>;
    cardDetails: Array<{
      id: string;
      cardName: string;
      rank: string;
      catiSpent: string;
      catiReward: string;
      acquiredAt: string;
    }>;
    roi: number;
  }>;
  seasonRewards: Array<{
    user: {
      id: string;
      userNickname: string;
    };
    totalPoolShare: number;
    rewardAmount: string;
    status: string;
  }>;
}

/**
 * Cards API functions
 */
export const cardsApi = {
  /**
   * Get user's owned cards
   */
  getOwnedCards: async (): Promise<OwnedCard[]> => {
    return apiClient.get('/api/cards/owned');
  },

  /**
   * Open a card pack
   */
  openPack: async (): Promise<PackOpenResponse> => {
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

  /**
   * Get season rewards information
   */
  getSeasonRewards: async (): Promise<SeasonRewardsResponse> => {
    return apiClient.get('/api/season/rewards');
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
