import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, userApi, cardsApi, seasonsApi, transactionsApi } from '@/services/api';

/**
 * Query Keys - Centralized for consistency and cache invalidation
 */
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    nonce: (address: string) => ['auth', 'nonce', address] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
  cards: {
    owned: ['cards', 'owned'] as const,
  },
  seasons: {
    active: ['seasons', 'active'] as const,
    detail: (id: string) => ['seasons', 'detail', id] as const,
  },
  transactions: {
    list: (limit: number, offset: number) => ['transactions', 'list', limit, offset] as const,
  },
} as const;

/**
 * Authentication Hooks
 */

export const useAuthMe = () => {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.getMe,
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401 (unauthorized)
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useAuthNonce = (address: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.auth.nonce(address),
    queryFn: () => authApi.getNonce(address),
    enabled: enabled && !!address,
    staleTime: 0, // Always fetch fresh nonce
    gcTime: 0, // Don't cache nonces
  });
};

export const useAuthVerify = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.verify,
    onSuccess: (data) => {
      // Update the user cache with the new user data
      queryClient.setQueryData(queryKeys.auth.me, data);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.owned });
    },
  });
};

export const useAuthLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear();
    },
    onError: () => {
      // Even if logout fails on server, clear local cache
      queryClient.clear();
    },
  });
};

/**
 * User Hooks
 */

export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: userApi.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (updatedUser) => {
      // Update the user profile cache
      queryClient.setQueryData(queryKeys.user.profile, updatedUser);
      
      // Also update the auth.me cache if it exists
      queryClient.setQueryData(queryKeys.auth.me, (old: unknown) => 
        old && typeof old === 'object' ? { ...old, user: updatedUser } : old
      );
    },
  });
};

/**
 * Cards Hooks
 */

export const useOwnedCards = () => {
  return useQuery({
    queryKey: queryKeys.cards.owned,
    queryFn: cardsApi.getOwnedCards,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useOpenPack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cardsApi.openPack,
    onSuccess: () => {
      // Invalidate owned cards to refresh the list
      queryClient.invalidateQueries({ queryKey: queryKeys.cards.owned });
      
      // Also invalidate user profile to update CATI balance
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
};

/**
 * Seasons Hooks
 */

export const useActiveSeasons = () => {
  return useQuery({
    queryKey: queryKeys.seasons.active,
    queryFn: seasonsApi.getActiveSeasons,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSeason = (seasonId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.seasons.detail(seasonId),
    queryFn: () => seasonsApi.getSeason(seasonId),
    enabled: enabled && !!seasonId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Transactions Hooks
 */

export const useTransactions = (limit = 20, offset = 0) => {
  return useQuery({
    queryKey: queryKeys.transactions.list(limit, offset),
    queryFn: () => transactionsApi.getTransactions(limit, offset),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionsApi.createWithdrawal,
    onSuccess: () => {
      // Invalidate transactions to show the new withdrawal
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Invalidate user data to update balance
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
  });
};

/**
 * Utility hooks for common patterns
 */

export const useInvalidateAuth = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
  };
};

export const useInvalidateUserData = () => {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
    queryClient.invalidateQueries({ queryKey: queryKeys.cards.owned });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };
};
