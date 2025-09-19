import { authApi, userApi } from '@/services/api';
import type { User } from '@/types/user';

// Generate mock card IDs for testing
const generateMockCardIds = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `mock_card_${i + 1}_${Date.now()}`);
};

// Create user data with wallet address and mock data for testing (for backward compatibility)
export const createUser = (walletAddress: string): User => {
  // Generate mock data for demonstration
  const mockCardCount = Math.floor(Math.random() * 15) + 5; // 5-20 cards
  const mockCatiTokens = Math.floor(Math.random() * 10000) + 1000; // 1000-11000 tokens
  
  return {
    walletAddress,
    userNickname: `User${walletAddress.slice(-4)}`,
    catiBalance: mockCatiTokens.toString(),
    ownedCards: generateMockCardIds(mockCardCount)
  };
};

// API call to fetch user data from backend using the new API client
export const fetchUserData = async (): Promise<User | null> => {
  try {
    const response = await authApi.getMe();
    return response.user;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// API call to save user data using the new API client
export const saveUserData = async (userData: Partial<User>): Promise<User | null> => {
  try {
    const updatedUser = await userApi.updateProfile(userData);
    console.log('User data saved successfully:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error saving user data:', error);
    return null;
  }
};
