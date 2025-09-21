import { Decimal } from '@prisma/client/runtime/library';

export interface CardWithProbability {
  id: number;
  rank: string;
  poolSharePercentage: Decimal;
  name: string;
  imageUrl: string;
  rarityColor: string;
  designer: string;
}

export interface CardSelectionConfig {
  winningProbabilities: Record<string, number>;
}

/**
 * Default card selection configuration with rank probabilities
 * These probabilities are designed so that a card is always drawn
 */
export const DEFAULT_CARD_SELECTION_CONFIG: CardSelectionConfig = {
  winningProbabilities: {
    'SS': 0.001,   // 0.1% - Ultra Rare
    'S': 0.020,    // 2.0% - Rare  
    'AA': 0.060,   // 6.0% - Uncommon
    'A': 0.919,    // 91.9% - Common (remainder to make total = 100%)
  }
};

/**
 * Original probability config with pack failure chance
 * Total probability is 38.1%, meaning 61.9% chance of no card (pack failure)
 */
export const ORIGINAL_CARD_SELECTION_CONFIG: CardSelectionConfig = {
  winningProbabilities: {
    'A': 0.30000,   // 30%
    'AA': 0.06000,  // 6%
    'S': 0.02000,   // 2%
    'SS': 0.00100   // 0.1%
    // Total: 38.1% (61.9% chance of pack failure)
  }
};

export interface PackOpenResult {
  success: boolean;
  card?: CardWithProbability;
  failureReason?: string;
}

/**
 * Pure function to select a random card based on probabilities
 * This function can be tested independently with controlled randomness
 * Returns a result object that can indicate pack failure
 */
export function selectRandomCard(
  cards: CardWithProbability[], 
  config: CardSelectionConfig = DEFAULT_CARD_SELECTION_CONFIG,
  randomValue?: number // Optional for testing with controlled randomness
): PackOpenResult {
  if (cards.length === 0) {
    throw new Error('No cards available for selection');
  }

  // Group cards by rank
  const cardsByRank = cards.reduce((acc, card) => {
    if (!acc[card.rank]) {
      acc[card.rank] = [];
    }
    acc[card.rank].push(card);
    return acc;
  }, {} as Record<string, CardWithProbability[]>);

  // Use provided random value or generate one
  const random = randomValue !== undefined ? randomValue : Math.random();
  
  // Sort ranks by rarity (most valuable first) for proper probability handling
  const sortedRanks = ['SS', 'S', 'AA', 'A'];
  
  // Calculate cumulative probabilities and select rank
  let cumulativeProbability = 0;
  
  for (const rank of sortedRanks) {
    const probability = config.winningProbabilities[rank] || 0;
    cumulativeProbability += probability;
    
    if (random <= cumulativeProbability && cardsByRank[rank] && cardsByRank[rank].length > 0) {
      // Randomly select a card from this rank
      const cardsInRank = cardsByRank[rank];
      const randomCardIndex = Math.floor(Math.random() * cardsInRank.length);
      return {
        success: true,
        card: cardsInRank[randomCardIndex]
      };
    }
  }

  // Calculate total probability to determine if this should be a pack failure
  const totalWinProbability = Object.values(config.winningProbabilities).reduce((sum, prob) => sum + prob, 0);
  
  if (random > totalWinProbability) {
    // Pack failure - no card won
    return {
      success: false,
      failureReason: 'Pack opened but no card was won. Better luck next time!'
    };
  }

  // Fallback to most common rank (A) if something goes wrong
  const fallbackCards = cardsByRank['A'] || Object.values(cardsByRank)[0] || cards;
  return {
    success: true,
    card: fallbackCards[Math.floor(Math.random() * fallbackCards.length)]
  };
}

/**
 * Function to validate card selection probabilities
 */
export function validateCardSelectionConfig(config: CardSelectionConfig): boolean {
  const totalProbability = Object.values(config.winningProbabilities).reduce((sum, prob) => sum + prob, 0);
  
  // Allow some tolerance for floating point precision
  return totalProbability <= 1.0 && totalProbability > 0;
}

/**
 * Function to get probability distribution for testing (including failure chance)
 */
export function getProbabilityDistribution(
  cards: CardWithProbability[],
  config: CardSelectionConfig = DEFAULT_CARD_SELECTION_CONFIG
): Record<string, { probability: number; cardCount: number; cards: string[] }> {
  const cardsByRank = cards.reduce((acc, card) => {
    if (!acc[card.rank]) {
      acc[card.rank] = [];
    }
    acc[card.rank].push(card);
    return acc;
  }, {} as Record<string, CardWithProbability[]>);

  const distribution: Record<string, { probability: number; cardCount: number; cards: string[] }> = {};

  // Add win probabilities
  for (const [rank, probability] of Object.entries(config.winningProbabilities)) {
    const cardsInRank = cardsByRank[rank] || [];
    distribution[rank] = {
      probability,
      cardCount: cardsInRank.length,
      cards: cardsInRank.map(card => card.name),
    };
  }

  // Calculate and add failure probability
  const totalWinProbability = Object.values(config.winningProbabilities).reduce((sum, prob) => sum + prob, 0);
  const failureProbability = Math.max(0, 1 - totalWinProbability);
  
  if (failureProbability > 0) {
    distribution['FAILURE'] = {
      probability: failureProbability,
      cardCount: 0,
      cards: ['Pack Failure - No Card Won'],
    };
  }

  return distribution;
}

/**
 * Backward compatibility function that returns a card or throws on failure
 */
export function selectRandomCardLegacy(
  cards: CardWithProbability[], 
  config: CardSelectionConfig = DEFAULT_CARD_SELECTION_CONFIG,
  randomValue?: number
): CardWithProbability {
  const result = selectRandomCard(cards, config, randomValue);
  if (!result.success || !result.card) {
    throw new Error(result.failureReason || 'Pack opening failed');
  }
  return result.card;
}

/**
 * Helper function to create mock card data for testing
 */
export function createMockCard(
  id: number,
  rank: string,
  name: string,
  overrides: Partial<CardWithProbability> = {}
): CardWithProbability {
  return {
    id,
    rank,
    poolSharePercentage: new Decimal('2.5'),
    name,
    imageUrl: `/cards/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    rarityColor: getRarityColor(rank),
    designer: 'Test Designer',
    ...overrides,
  };
}

/**
 * Helper function to get rarity color by rank
 */
function getRarityColor(rank: string): string {
  switch (rank) {
    case 'A':
      return '#0066cc';
    case 'AA':
      return '#8a2be2';
    case 'S':
      return '#ffd700';
    case 'SS':
      return '#dc143c';
    default:
      return '#666666';
  }
}

/**
 * Helper function to create a set of mock cards for testing
 */
export function createMockCardSet(): CardWithProbability[] {
  return [
    // A rank cards (common)
    createMockCard(1, 'A', 'Common Fighter'),
    createMockCard(2, 'A', 'Basic Warrior'),
    createMockCard(3, 'A', 'Simple Mage'),
    createMockCard(4, 'A', 'Young Archer'),
    createMockCard(5, 'A', 'Novice Knight'),
    
    // AA rank cards (uncommon)
    createMockCard(6, 'AA', 'Elite Guardian'),
    createMockCard(7, 'AA', 'Skilled Assassin'),
    createMockCard(8, 'AA', 'Veteran Spellcaster'),
    
    // S rank cards (rare)
    createMockCard(9, 'S', 'Legendary Hero'),
    createMockCard(10, 'S', 'Master Sorcerer'),
    
    // SS rank cards (ultra rare)
    createMockCard(11, 'SS', 'Divine Champion'),
  ];
}

/**
 * Function to simulate multiple card draws for testing probability distribution
 */
export function simulateCardDraws(
  cards: CardWithProbability[],
  drawCount: number,
  config: CardSelectionConfig = DEFAULT_CARD_SELECTION_CONFIG
): Record<string, number> {
  const results: Record<string, number> = {};
  
  for (let i = 0; i < drawCount; i++) {
    const result = selectRandomCard(cards, config);
    if (result.success && result.card) {
      const rank = result.card.rank;
      results[rank] = (results[rank] || 0) + 1;
    } else {
      // Count pack failures
      results['FAILURE'] = (results['FAILURE'] || 0) + 1;
    }
  }
  
  return results;
}
