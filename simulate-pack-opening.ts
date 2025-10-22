import { writeFileSync } from 'fs';
import { selectRandomCard, createMockSeasonCard, type SeasonCardWithProbability } from './src/lib/card-selector';
import { calculateSeasonRewards, type UserCardData, type SeasonData } from './src/lib/reward-calculator';

// Simulation configuration
const PLAYERS = ['Alice', 'Bob', 'Charlie'];
const INITIAL_CATI = 2500;
const PACK_COST = 500;
const PLAYS_PER_PLAYER = 5;
const SPONSOR_POOL = 100000; // Sponsor pool amount

// Create season cards using the actual createMockSeasonCard function
// Each card has the same probability within its rank: A: 0.3, AA: 0.06, S: 0.02, SS: 0.001
const SEASON_CARDS: SeasonCardWithProbability[] = [
  // SS rank cards (ultra rare) - 0.001 probability each, 70% pool share
  createMockSeasonCard(1, 'SS', 'Legendary Dragon', 0.001, 70.0),
  
  // S rank cards (rare) - 0.02 probability each, 12% pool share
  createMockSeasonCard(2, 'S', 'Mystic Phoenix', 0.02, 12.0),
  createMockSeasonCard(3, 'S', 'Thunder Wolf', 0.02, 12.0),
  
  // AA rank cards (uncommon) - 0.06 probability each, 10% pool share
  createMockSeasonCard(4, 'AA', 'Crystal Guardian', 0.06, 10.0),
  createMockSeasonCard(5, 'AA', 'Shadow Knight', 0.06, 10.0),
  createMockSeasonCard(6, 'AA', 'Fire Sprite', 0.06, 10.0),
  
  // A rank cards (common) - 0.3 probability each, 4% pool share
  createMockSeasonCard(7, 'A', 'Wind Archer', 0.3, 4.0),
  createMockSeasonCard(8, 'A', 'Earth Golem', 0.3, 4.0),
  createMockSeasonCard(9, 'A', 'Water Mage', 0.3, 4.0),
  createMockSeasonCard(10, 'A', 'Lightning Cat', 0.3, 4.0),
];

console.log('✅ Successfully imported actual TypeScript functions!');
console.log('✅ Using real createMockSeasonCard function for card data');

// Type definitions for simulation state
interface PlayerData {
  userId: bigint;
  catiBalance: bigint;
  cards: SeasonCardWithProbability[];
  totalReward: bigint;
}

interface SimulationEvent {
  index: number;
  player: string;
  poolAmount: number;
  wonCard: string;
  cardPoolShare: number;
  aliceTotalReward: number;
  bobTotalReward: number;
  charlieTotalReward: number;
}

interface GameState {
  players: Record<string, PlayerData>;
  totalPoolAmount: bigint;
  events: SimulationEvent[];
  userCards: UserCardData[];
}

// Initialize simulation state
const gameState: GameState = {
  players: {},
  totalPoolAmount: BigInt(0),
  events: [],
  userCards: []
};

// Initialize players with BigInt user IDs
PLAYERS.forEach((player, index) => {
  gameState.players[player] = {
    userId: BigInt(index + 1),
    catiBalance: BigInt(INITIAL_CATI),
    cards: [],
    totalReward: BigInt(0)
  };
});

// Season data for reward calculation
const SEASON_DATA: SeasonData = {
  id: BigInt(1),
  name: 'Test Season',
  slogan: 'Test Season Slogan',
  additionalTotalPool: BigInt(SPONSOR_POOL),
  bidPoolAmount: BigInt(0),
  status: 'ACTIVE',
};

// Run simulation
let eventIndex = 1;
let userCardIdCounter = 1;

console.log('🎮 Starting pack opening simulation...');
console.log(`📊 Players: ${PLAYERS.join(', ')}`);
console.log(`💰 Each player starts with ${INITIAL_CATI} CATI`);
console.log(`📦 Pack cost: ${PACK_COST} CATI`);
console.log(`🎯 ${PLAYS_PER_PLAYER} packs per player`);
console.log(`🏆 Sponsor pool: ${SPONSOR_POOL} CATI\n`);

for (let round = 0; round < PLAYS_PER_PLAYER; round++) {
  console.log(`--- Round ${round + 1} ---`);
  
  for (const player of PLAYERS) {
    const playerData = gameState.players[player];
    
    // Deduct pack cost
    playerData.catiBalance -= BigInt(PACK_COST);
    gameState.totalPoolAmount += BigInt(PACK_COST);
    
    // Try to get a card using the actual card selector
    const cardResult = selectRandomCard(SEASON_CARDS);
    
    let wonCard = 'No';
    let cardPoolShare = 0;
    
    if (cardResult.success && cardResult.card) {
      const selectedCard = cardResult.card;
      playerData.cards.push(selectedCard);
      wonCard = `${selectedCard.rank} - ${selectedCard.name}`;
      cardPoolShare = parseFloat(selectedCard.poolSharePercentage.toString());
      
      console.log(`🎉 ${player} won: ${wonCard} (${cardPoolShare}% pool share)`);
      
      // Add to user cards for reward calculation
      gameState.userCards.push({
        id: BigInt(userCardIdCounter++),
        userId: playerData.userId,
        cardId: selectedCard.id,
        seasonId: SEASON_DATA.id,
        catiSpent: BigInt(PACK_COST),
        catiReward: BigInt(0),
        card: {
          id: selectedCard.id,
          rank: selectedCard.rank,
          name: selectedCard.name,
          imageUrl: selectedCard.imageUrl,
          rarityColor: selectedCard.rarityColor,
          designer: selectedCard.designer,
        }
      });
    } else {
      console.log(`💸 ${player} opened pack but won no card (pack failure)`);
    }
    
    // Recalculate rewards after each event using the actual reward calculator
    // Need to replace [] with season cards.
    const rewardResult = calculateSeasonRewards(gameState.userCards,[], SEASON_DATA);
    
    // Update player rewards from calculation result
    PLAYERS.forEach(playerName => {
      const playerUserId = gameState.players[playerName].userId;
      const seasonReward = rewardResult.seasonRewards.find(sr => sr.userId === playerUserId);
      gameState.players[playerName].totalReward = seasonReward ? seasonReward.totalReward : BigInt(0);
    });
    
    // Record event
    const event: SimulationEvent = {
      index: eventIndex++,
      player: player,
      poolAmount: Number(gameState.totalPoolAmount) + SPONSOR_POOL,
      wonCard: wonCard,
      cardPoolShare: cardPoolShare,
      aliceTotalReward: Number(gameState.players['Alice'].totalReward),
      bobTotalReward: Number(gameState.players['Bob'].totalReward),
      charlieTotalReward: Number(gameState.players['Charlie'].totalReward)
    };
    
    gameState.events.push(event);
  }
}

// Generate markdown report
function generateMarkdownReport(): string {
  let markdown = `# Card Pack Opening Simulation Report

`;
  
  markdown += `## Simulation Parameters

`;
  markdown += `- **Players**: ${PLAYERS.join(', ')}
`;
  markdown += `- **Initial CATI Balance**: ${INITIAL_CATI} CATI per player
`;
  markdown += `- **Pack Cost**: ${PACK_COST} CATI
`;
  markdown += `- **Plays per Player**: ${PLAYS_PER_PLAYER}
`;
  markdown += `- **Sponsor Pool**: ${SPONSOR_POOL} CATI
`;
  markdown += `- **Total Events**: ${gameState.events.length}

## Card Probabilities & Pool Shares

`;
  
  // Group cards by rank for better display
  const cardsByRank: Record<string, SeasonCardWithProbability[]> = {};
  SEASON_CARDS.forEach(card => {
    if (!cardsByRank[card.rank]) {
      cardsByRank[card.rank] = [];
    }
    cardsByRank[card.rank].push(card);
  });
  
  // Calculate total win probability and failure probability
  const totalWinProbability = SEASON_CARDS.reduce((sum, card) => 
    sum + parseFloat(card.dropProbability.toString()), 0);
  const failureProbability = Math.max(0, 1 - totalWinProbability);
  
  Object.entries(cardsByRank).forEach(([rank, cards]) => {
    markdown += `### ${rank} Rank

`;
    markdown += `- **Probability per Card**: ${(parseFloat(cards[0].dropProbability.toString()) * 100).toFixed(1)}%
`;
    markdown += `- **Pool Share per Card**: ${parseFloat(cards[0].poolSharePercentage.toString())}%
`;
    markdown += `- **Cards**: ${cards.map(c => c.name).join(', ')}

`;
  });
  
  if (failureProbability > 0) {
    markdown += `### Pack Failure

`;
    markdown += `- **Probability**: ${(failureProbability * 100).toFixed(1)}%
`;
    markdown += `- **Description**: No card won, CATI still spent

`;
  }
  
  markdown += `## Event-by-Event State Table

`;
  
  // Table header
  markdown += `| Index | Player | Pool Amount | Won Card | Card Pool Share | Alice Total | Bob Total | Charlie Total |
`;
  markdown += `|-------|--------|-------------|----------|-----------------|-------------|-----------|---------------|
`;
  
  // Table rows
  gameState.events.forEach(event => {
    markdown += `| ${event.index} | ${event.player} | ${event.poolAmount} | ${event.wonCard} | ${event.cardPoolShare}% | ${event.aliceTotalReward} | ${event.bobTotalReward} | ${event.charlieTotalReward} |
`;
  });
  
  markdown += `

## Final Summary

`;
  
  // Player summaries
  PLAYERS.forEach(player => {
    const playerData = gameState.players[player];
    const totalSpent = PLAYS_PER_PLAYER * PACK_COST;
    const netResult = Number(playerData.totalReward) - totalSpent;
    const cardCount = playerData.cards.length;
    const successRate = ((cardCount / PLAYS_PER_PLAYER) * 100).toFixed(1);
    
    markdown += `### ${player}

`;
    markdown += `- **Final CATI Balance**: ${Number(playerData.catiBalance)} CATI
`;
    markdown += `- **Total CATI Spent**: ${totalSpent} CATI
`;
    markdown += `- **Total Reward**: ${Number(playerData.totalReward)} CATI
`;
    markdown += `- **Net Result**: ${netResult >= 0 ? '+' : ''}${netResult} CATI
`;
    markdown += `- **Cards Won**: ${cardCount}/${PLAYS_PER_PLAYER} (${successRate}% success rate)
`;
    
    if (playerData.cards.length > 0) {
      markdown += `- **Cards Obtained**:

`;
      playerData.cards.forEach((card, index) => {
        markdown += `  ${index + 1}. ${card.rank} - ${card.name} (${parseFloat(card.poolSharePercentage.toString())}% pool share)
`;
      });
    }
    markdown += `

`;
  });
  
  // Overall statistics
  const totalSpentByAll = PLAYERS.length * PLAYS_PER_PLAYER * PACK_COST;
  const totalCardsWon = PLAYERS.reduce((sum, player) => sum + gameState.players[player].cards.length, 0);
  const totalAttempts = PLAYERS.length * PLAYS_PER_PLAYER;
  const overallSuccessRate = ((totalCardsWon / totalAttempts) * 100).toFixed(1);
  
  markdown += `## Overall Statistics

`;
  markdown += `- **Total CATI Spent by All Players**: ${totalSpentByAll} CATI
`;
  markdown += `- **Player Contributions to Pool**: ${Number(gameState.totalPoolAmount)} CATI
`;
  markdown += `- **Sponsor Pool**: ${SPONSOR_POOL} CATI
`;
  markdown += `- **Total Reward Pool**: ${Number(gameState.totalPoolAmount) + SPONSOR_POOL} CATI
`;
  markdown += `- **Total Cards Won**: ${totalCardsWon}/${totalAttempts} attempts
`;
  markdown += `- **Overall Success Rate**: ${overallSuccessRate}%
`;
  markdown += `- **Total Rewards Distributed**: ${PLAYERS.reduce((sum, player) => sum + Number(gameState.players[player].totalReward), 0)} CATI

`;
  
  // Card distribution
  const cardDistribution: Record<string, number> = {};
  PLAYERS.forEach(player => {
    gameState.players[player].cards.forEach(card => {
      const key = `${card.rank} - ${card.name}`;
      cardDistribution[key] = (cardDistribution[key] || 0) + 1;
    });
  });
  
  if (Object.keys(cardDistribution).length > 0) {
    markdown += `## Card Distribution

`;
    Object.entries(cardDistribution)
      .sort((a, b) => b[1] - a[1])
      .forEach(([card, count]) => {
        markdown += `- **${card}**: ${count} copies
`;
      });
  }
  
  return markdown;
}

// Write to file
const reportContent = generateMarkdownReport();
writeFileSync('/Users/thihanaing/Documents/one-terrace/blockchain/opencati/simulation-report.md', reportContent);

console.log('\n🎉 Simulation completed! Report saved to simulation-report.md');
console.log(`\n📊 Quick Summary:`);
console.log(`- Total events: ${gameState.events.length}`);
console.log(`- Final pool: ${Number(gameState.totalPoolAmount)} CATI`);
console.log(`- Total reward pool: ${Number(gameState.totalPoolAmount) + SPONSOR_POOL} CATI`);
PLAYERS.forEach(player => {
  const playerData = gameState.players[player];
  console.log(`- ${player}: ${playerData.cards.length} cards, ${Number(playerData.totalReward)} CATI reward`);
});
