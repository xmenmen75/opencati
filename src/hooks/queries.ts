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
    rewards: ['seasons', 'rewards'] as const,
  },
  transactions: {
    list: (limit: number, offset: number) => ['transactions', 'list', limit, offset] as const,
  },
} as const;

/**
 * Authentication Hooks
 */

export const useAuthMe = () => {
  // Check token existence in a way that React Query can track
  // Make sure we're in the browser before accessing localStorage
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('opencati_auth_token');
  
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.getMe,
    enabled: hasToken, // Only run if token exists
    retry: (failureCount, error: unknown) => {
      // Don't retry on 401 (unauthorized)
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) return false;
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: hasToken, // Only refetch on mount if we have a token
    refetchOnWindowFocus: hasToken, // Only refetch on window focus if we have a token
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
    onMutate: async () => {
      // Cancel any outgoing refetches to prevent them from overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.me });
      
      // Immediately update the auth state to logged out
      queryClient.setQueryData(queryKeys.auth.me, null);
    },
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

export const useOwnedCards = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.cards.owned,
    queryFn: cardsApi.getOwnedCards,
    enabled: options?.enabled ?? true,
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
      
      // Invalidate season rewards to update pool and user rewards
      queryClient.invalidateQueries({ queryKey: queryKeys.seasons.rewards });
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

export const useSeasonRewards = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: queryKeys.seasons.rewards,
    queryFn: seasonsApi.getSeasonRewards,
    enabled: options?.enabled ?? true,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
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
