import type { User } from '@/types/user';

// Generate mock card IDs for testing
const generateMockCardIds = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `mock_card_${i + 1}_${Date.now()}`);
};

// Create user data with wallet address and mock data for testing
export const createUser = (walletAddress: string): User => {
  // Generate mock data for demonstration
  const mockCardCount = Math.floor(Math.random() * 15) + 5; // 5-20 cards
  const mockCatiTokens = Math.floor(Math.random() * 10000) + 1000; // 1000-11000 tokens
  
  return {
    walletAddress,
    catiTokens: mockCatiTokens,
    ownedCards: generateMockCardIds(mockCardCount)
  };
};

// API call to fetch user data from backend
export const fetchUserData = async (walletAddress: string): Promise<User | null> => {
  try {
    // TODO: Replace with actual API call to your backend
    // const response = await fetch(`/api/users/${walletAddress}`);
    // if (response.ok) {
    //   return await response.json();
    // }
    
    // For now, return mock user data with cards and tokens for testing
    return createUser(walletAddress);
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// API call to save user data
export const saveUserData = async (user: User): Promise<void> => {
  try {
    // TODO: Replace with actual API call to your backend
    // await fetch('/api/users', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(user)
    // });
    
    console.log('User data would be saved to backend:', user);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};
