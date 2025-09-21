# Game Logic Testing Guide

This document explains how to test the reward calculation and card selection logic independently of the database and API.

## Overview

The original API route has been refactored to extract the core business logic into separate, testable modules:

1. **`src/lib/reward-calculator.ts`** - Pure functions for calculating season rewards
2. **`src/lib/card-selector.ts`** - Pure functions for random card selection
3. **`src/lib/__tests__/`** - Comprehensive test suites for both modules

## Quick Start

### Run All Tests
```bash
npm run test:game-logic
```

### Run Individual Test Suites
```bash
# Test only reward calculation logic
npm run test:rewards

# Test only card selection logic
npm run test:cards
```

## Reward Calculation Testing

### Test Scenarios Covered

1. **Single User Multiple Cards** - One user with different rank cards
2. **Multiple Users Competing** - Multiple users competing for rank-based rewards
3. **No Sponsor Amount** - Edge case with zero additional pool
4. **Large Scale** - Performance and accuracy with many users and cards

### Key Features

- **Pure Functions**: No database dependencies
- **Deterministic**: Same inputs always produce same outputs
- **Configurable**: Easy to create custom test scenarios
- **Detailed Output**: Shows pool distributions, reward calculations, and user rankings

### Example Test Usage

```typescript
import { 
  calculateSeasonRewards, 
  createMockSeasonData, 
  createMockCardData, 
  createMockUserCardData 
} from '@/lib/reward-calculator';

// Create test data
const season = createMockSeasonData({
  additionalTotalPool: BigInt('10000'), // 10,000 CATI sponsor
});

const cardA = createMockCardData({ rank: 'A', name: 'Common Card' });
const cardS = createMockCardData({ rank: 'S', name: 'Rare Card' });

const userCards = [
  createMockUserCardData(BigInt(1), cardA, season.id, BigInt('500')),
  createMockUserCardData(BigInt(1), cardS, season.id, BigInt('500')),
];

// Calculate rewards
const result = calculateSeasonRewards(userCards, season);

console.log('Pool Info:', result.poolInfo);
console.log('User Rewards:', result.seasonRewards);
```

### Reward Distribution Rules

The system distributes rewards based on card ranks:
- **A Rank**: 4% of total pool
- **AA Rank**: 10% of total pool  
- **S Rank**: 12% of total pool
- **SS Rank**: 70% of total pool

Total pool = User spending + Sponsor contribution

## Card Selection Testing

### Test Scenarios Covered

1. **Deterministic Selection** - Controlled randomness for predictable outcomes
2. **Probability Distribution** - Verify correct probabilities per rank
3. **Custom Configuration** - Test with different probability settings
4. **Large Scale Simulation** - Statistical validation with thousands of draws
5. **Edge Cases** - Empty arrays, invalid configs, missing ranks
6. **Performance** - Speed testing with high iteration counts

### Key Features

- **Controlled Randomness**: Pass specific random values for deterministic testing
- **Statistical Validation**: Simulate thousands of draws to verify probability accuracy
- **Flexible Configuration**: Easily test different probability distributions
- **Performance Metrics**: Measure operations per second

### Example Test Usage

```typescript
import { 
  selectRandomCard, 
  createMockCardSet,
  simulateCardDraws,
  DEFAULT_CARD_SELECTION_CONFIG 
} from '@/lib/card-selector';

// Test deterministic selection
const cards = createMockCardSet();
const selectedCard = selectRandomCard(cards, DEFAULT_CARD_SELECTION_CONFIG, 0.1); // 10% random value
console.log('Selected:', selectedCard); // Should be A rank

// Test probability distribution
const results = simulateCardDraws(cards, 10000);
console.log('10,000 draw results:', results);
```

### Card Probability Rules

**Original Config (with pack failures):**
- **A Rank**: 30% chance
- **AA Rank**: 6% chance
- **S Rank**: 2% chance  
- **SS Rank**: 0.1% chance
- **Pack Failure**: 61.9% chance (no card won, but CATI is still spent)

**Alternative Config (always win):**
- **A Rank**: 91.9% chance
- **AA Rank**: 6% chance
- **S Rank**: 2% chance
- **SS Rank**: 0.1% chance
- **Pack Failure**: 0% chance (always get a card)

## Test Data Creation

### Mock Data Helpers

Both modules provide helper functions to create test data:

```typescript
// Season data
const season = createMockSeasonData({
  name: 'Test Season',
  additionalTotalPool: BigInt('50000'),
});

// Card data
const card = createMockCardData({
  rank: 'S',
  name: 'Legendary Card',
  poolSharePercentage: new Decimal('10.0'),
});

// User card data
const userCard = createMockUserCardData(
  BigInt(1), // userId
  card, 
  season.id, 
  BigInt('500') // CATI spent
);
```

### Custom Test Scenarios

You can easily create custom scenarios by modifying the mock data:

```typescript
// High value season with lots of sponsor money
const richSeason = createMockSeasonData({
  additionalTotalPool: BigInt('1000000'), // 1M CATI sponsor
});

// Custom card probabilities favoring rare cards
const customConfig = {
  winningProbabilities: {
    'A': 0.10,   // 10%
    'AA': 0.20,  // 20%  
    'S': 0.30,   // 30%
    'SS': 0.40,  // 40%
  }
};
```

## Pack Failure System

The system now supports two pack opening modes:

### Original Mode (ORIGINAL_CARD_SELECTION_CONFIG)
- **Total Win Probability**: 38.1%
- **Pack Failure Rate**: 61.9%
- **Economic Impact**: Players pay for every attempt, even failures
- **Scarcity**: Creates card scarcity and excitement
- **Cost**: Approximately 1,300 CATI per actual card won

### Always Win Mode (DEFAULT_CARD_SELECTION_CONFIG)  
- **Total Win Probability**: 100%
- **Pack Failure Rate**: 0%
- **Economic Impact**: Every pack guarantees a card
- **Accessibility**: More predictable for players
- **Cost**: 500 CATI per card guaranteed

## Benefits of This Approach

1. **Fast Testing**: No database setup required
2. **Isolation**: Test logic without external dependencies
3. **Reproducible**: Same inputs always give same outputs
4. **Comprehensive**: Test edge cases and error conditions easily
5. **Performance**: Validate calculations under load
6. **Documentation**: Test cases serve as usage examples

## Integration with API

The refactored API route (`src/app/api/cards/open-pack/route.ts`) now uses these pure functions:

- Uses `selectRandomCard()` for card selection
- Uses `calculateSeasonRewards()` for reward distribution
- Database operations are separate from business logic
- Easy to test API behavior by testing the underlying functions

## Running Tests

The test files can be run directly with Node.js or through the npm scripts:

```bash
# All tests
npm run test:game-logic

# Individual suites  
npm run test:rewards
npm run test:cards

# Pack configuration comparison
npx tsx src/lib/__tests__/pack-comparison.ts

# Direct execution
npx tsx src/lib/__tests__/reward-calculator.test.ts
npx tsx src/lib/__tests__/card-selector.test.ts
```

Tests output detailed information about:
- Pool calculations and distributions
- User reward breakdowns
- Probability verification
- Performance metrics
- Edge case handling

This testing setup allows you to validate the core game mechanics thoroughly before deploying to production.
