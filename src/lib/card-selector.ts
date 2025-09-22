import { Decimal } from '@prisma/client/runtime/library';

export interface CardWithProbability {
  id: number;
  rank: string;
  name: string;
  imageUrl: string;
  rarityColor: string;
  designer: string;
}

export interface SeasonCardWithProbability extends CardWithProbability {
  poolSharePercentage: Decimal;
  dropProbability: Decimal;
  seasonCardId: bigint;
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
  card?: SeasonCardWithProbability;
  failureReason?: string;
}

/**
 * Pure function to select a random card based on rank probabilities from SeasonCard data
 * First selects a rank, then randomly picks a card from that rank
 * Returns a result object that can indicate pack failure
 */
export function selectRandomCard(
  seasonCards: SeasonCardWithProbability[], 
  randomValue?: number // Optional for testing with controlled randomness
): PackOpenResult {
  if (seasonCards.length === 0) {
    throw new Error('No cards available for selection');
  }

  // Filter only active cards
  const activeCards = seasonCards.filter(sc => sc.dropProbability.gt(0));
  
  if (activeCards.length === 0) {
    return {
      success: false,
      failureReason: 'No active cards available for this season'
    };
  }

  // Group cards by rank and calculate rank probabilities
  const cardsByRank: Record<string, SeasonCardWithProbability[]> = {};
  const rankProbabilities: Record<string, number> = {};

  for (const card of activeCards) {
    if (!cardsByRank[card.rank]) {
      cardsByRank[card.rank] = [];
      rankProbabilities[card.rank] = 0;
    }
    cardsByRank[card.rank].push(card);
    // Use the first card's drop probability as the rank probability
    // (assuming all cards of same rank have same probability)
    if (rankProbabilities[card.rank] === 0) {
      rankProbabilities[card.rank] = parseFloat(card.dropProbability.toString());
    }
  }

  // Use provided random value or generate one
  const random = randomValue !== undefined ? randomValue : Math.random();
  
  // Sort ranks by rarity (most valuable first) for proper probability handling
  const rankOrder = { 'SS': 0, 'S': 1, 'AA': 2, 'A': 3 };
  const sortedRanks = Object.keys(rankProbabilities).sort((a, b) => {
    const rankA = rankOrder[a as keyof typeof rankOrder] ?? 99;
    const rankB = rankOrder[b as keyof typeof rankOrder] ?? 99;
    return rankA - rankB;
  });
  
  // Calculate cumulative probabilities and select rank
  let cumulativeProbability = 0;
  let selectedRank: string | null = null;
  
  for (const rank of sortedRanks) {
    const probability = rankProbabilities[rank];
    cumulativeProbability += probability;
    
    if (random <= cumulativeProbability) {
      selectedRank = rank;
      break;
    }
  }

  // If no rank was selected, check if this should be a pack failure
  if (!selectedRank) {
    const totalWinProbability = Object.values(rankProbabilities).reduce((sum, prob) => sum + prob, 0);
    
    if (random > totalWinProbability) {
      // Pack failure - no card won
      return {
        success: false,
        failureReason: 'Pack opened but no card was won. Better luck next time!'
      };
    }

    // Fallback to most common rank (A) if something goes wrong
    selectedRank = sortedRanks[sortedRanks.length - 1] || sortedRanks[0];
  }

  // Randomly select a card from the selected rank
  const cardsInSelectedRank = cardsByRank[selectedRank];
  if (!cardsInSelectedRank || cardsInSelectedRank.length === 0) {
    return {
      success: false,
      failureReason: 'No cards available in selected rank'
    };
  }

  const randomCardIndex = Math.floor(Math.random() * cardsInSelectedRank.length);
  const selectedCard = cardsInSelectedRank[randomCardIndex];

  return {
    success: true,
    card: selectedCard
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
  seasonCards: SeasonCardWithProbability[]
): Record<string, { probability: number; cardCount: number; cards: string[] }> {
  const cardsByRank = seasonCards.reduce((acc, seasonCard) => {
    if (!acc[seasonCard.rank]) {
      acc[seasonCard.rank] = [];
    }
    acc[seasonCard.rank].push(seasonCard);
    return acc;
  }, {} as Record<string, SeasonCardWithProbability[]>);

  const distribution: Record<string, { probability: number; cardCount: number; cards: string[] }> = {};

  // Add win probabilities by rank
  for (const [rank, cards] of Object.entries(cardsByRank)) {
    const totalProbability = cards.reduce((sum, card) => 
      sum + parseFloat(card.dropProbability.toString()), 0
    );
    
    distribution[rank] = {
      probability: totalProbability,
      cardCount: cards.length,
      cards: cards.map(card => card.name),
    };
  }

  // Calculate and add failure probability
  const totalWinProbability = seasonCards.reduce((sum, card) => 
    sum + parseFloat(card.dropProbability.toString()), 0
  );
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
  seasonCards: SeasonCardWithProbability[], 
  randomValue?: number
): SeasonCardWithProbability {
  const result = selectRandomCard(seasonCards, randomValue);
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
    name,
    imageUrl: `/cards/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    rarityColor: getRarityColor(rank),
    designer: 'Test Designer',
    ...overrides,
  };
}

/**
 * Helper function to create mock season card data for testing
 */
export function createMockSeasonCard(
  id: number,
  rank: string,
  name: string,
  dropProbability: number = 0.1,
  poolSharePercentage: number = 2.5,
  overrides: Partial<SeasonCardWithProbability> = {}
): SeasonCardWithProbability {
  return {
    id,
    rank,
    name,
    imageUrl: `/cards/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
    rarityColor: getRarityColor(rank),
    designer: 'Test Designer',
    poolSharePercentage: new Decimal(poolSharePercentage.toString()),
    dropProbability: new Decimal(dropProbability.toString()),
    seasonCardId: BigInt(id),
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
 * Helper function to create a set of mock season cards for testing
 */
export function createMockSeasonCardSet(): SeasonCardWithProbability[] {
  return [
    // A rank cards (common) - all have 0.3 probability
    createMockSeasonCard(1, 'A', 'Common Fighter', 0.30),
    createMockSeasonCard(2, 'A', 'Basic Warrior', 0.30),
    createMockSeasonCard(3, 'A', 'Simple Mage', 0.30),
    createMockSeasonCard(4, 'A', 'Young Archer', 0.30),
    createMockSeasonCard(5, 'A', 'Novice Knight', 0.30),
    
    // AA rank cards (uncommon) - all have 0.06 probability
    createMockSeasonCard(6, 'AA', 'Elite Guardian', 0.06),
    createMockSeasonCard(7, 'AA', 'Skilled Assassin', 0.06),
    createMockSeasonCard(8, 'AA', 'Veteran Spellcaster', 0.06),
    
    // S rank cards (rare) - all have 0.02 probability
    createMockSeasonCard(9, 'S', 'Legendary Hero', 0.02),
    createMockSeasonCard(10, 'S', 'Master Sorcerer', 0.02),
    
    // SS rank cards (ultra rare) - all have 0.001 probability
    createMockSeasonCard(11, 'SS', 'Divine Champion', 0.001),
  ];
}

/**
 * Function to simulate multiple card draws for testing probability distribution
 */
export function simulateCardDraws(
  seasonCards: SeasonCardWithProbability[],
  drawCount: number
): Record<string, number> {
  const results: Record<string, number> = {};
  
  for (let i = 0; i < drawCount; i++) {
    const result = selectRandomCard(seasonCards);
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
