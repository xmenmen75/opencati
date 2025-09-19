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

// API call to fetch user data from backend (now authenticated)
export const fetchUserData = async (token: string): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

// API call to save user data (placeholder for future implementation)
export const saveUserData = async (user: User): Promise<void> => {
  try {
    // TODO: Implement user data update API endpoint
    // await fetch('/api/users/update', {
    //   method: 'PUT',
    //   headers: { 
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${token}`
    //   },
    //   body: JSON.stringify(user)
    // });
    
    console.log('User data would be saved to backend:', user);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};
