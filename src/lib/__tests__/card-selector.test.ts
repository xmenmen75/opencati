import { 
  selectRandomCard, 
  validateCardSelectionConfig,
  getProbabilityDistribution,
  simulateCardDraws,
  createMockCard,
  createMockCardSet,
  DEFAULT_CARD_SELECTION_CONFIG,
  ORIGINAL_CARD_SELECTION_CONFIG,
  type CardSelectionConfig 
} from '../card-selector';

// Test scenario 1: Test deterministic card selection with controlled randomness
export function testDeterministicCardSelection() {
  console.log('=== Test: Deterministic Card Selection ===');
  
  const cards = createMockCardSet();
  
  // Test specific random values to ensure deterministic outcomes with original config
  const testCases = [
    { randomValue: 0.0005, expectedRank: 'SS', description: '0.05% - Should get SS rank' },
    { randomValue: 0.005, expectedRank: 'S', description: '0.5% - Should get S rank' },
    { randomValue: 0.025, expectedRank: 'AA', description: '2.5% - Should get AA rank' },
    { randomValue: 0.25, expectedRank: 'A', description: '25% - Should get A rank' },
    { randomValue: 0.95, expectedRank: 'FAILURE', description: '95% - Should be pack failure' },
  ];

  console.log('Testing deterministic card selection (with pack failures):');
  testCases.forEach(testCase => {
    const result = selectRandomCard(cards, ORIGINAL_CARD_SELECTION_CONFIG, testCase.randomValue);
    const actualRank = result.success ? result.card!.rank : 'FAILURE';
    const success = actualRank === testCase.expectedRank;
    const cardName = result.success ? result.card!.name : result.failureReason || 'Pack failure';
    console.log(`  ${testCase.description}: ${success ? '✅' : '❌'} Got ${actualRank} (${cardName})`);
  });

  console.log('\n');
}

// Test scenario 2: Test probability distribution
export function testProbabilityDistribution() {
  console.log('=== Test: Probability Distribution ===');
  
  const cards = createMockCardSet();
  const distribution = getProbabilityDistribution(cards);
  
  console.log('Expected probability distribution (no pack failures):');
  Object.entries(distribution).forEach(([rank, info]) => {
    console.log(`  ${rank}: ${(info.probability * 100).toFixed(1)}% chance, ${info.cardCount} cards available`);
    if (info.cards.length <= 5) {
      console.log(`    Cards: ${info.cards.join(', ')}`);
    }
  });

  console.log('\n');
}

// Test scenario 2b: Test probability distribution with pack failures
export function testProbabilityDistributionWithFailures() {
  console.log('=== Test: Probability Distribution with Pack Failures ===');
  
  const cards = createMockCardSet();
  const distribution = getProbabilityDistribution(cards, ORIGINAL_CARD_SELECTION_CONFIG);
  
  console.log('Expected probability distribution (with pack failures):');
  Object.entries(distribution).forEach(([rank, info]) => {
    console.log(`  ${rank}: ${(info.probability * 100).toFixed(1)}% chance, ${info.cardCount} cards available`);
    if (info.cards.length <= 5) {
      console.log(`    Cards: ${info.cards.join(', ')}`);
    }
  });

  console.log('\n');
}

// Test scenario 3: Test custom probability configuration
export function testCustomProbabilityConfig() {
  console.log('=== Test: Custom Probability Config ===');
  
  const cards = createMockCardSet();
  
  // Create a custom config that favors higher rarity cards
  const customConfig: CardSelectionConfig = {
    winningProbabilities: {
      'A': 0.10,    // 10%
      'AA': 0.20,   // 20%
      'S': 0.30,    // 30%
      'SS': 0.40,   // 40%
    }
  };

  // Validate the config
  const isValid = validateCardSelectionConfig(customConfig);
  console.log(`Custom config validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

  if (isValid) {
    console.log('Testing with custom high-rarity config:');
    
    // Test a few selections
    const testRandomValues = [0.05, 0.15, 0.35, 0.70];
    testRandomValues.forEach((randomValue, index) => {
      const result = selectRandomCard(cards, customConfig, randomValue);
      const display = result.success ? `${result.card!.rank} - ${result.card!.name}` : `FAILURE - ${result.failureReason}`;
      console.log(`  Test ${index + 1} (${(randomValue * 100).toFixed(0)}%): ${display}`);
    });
  }

  console.log('\n');
}

// Test scenario 4: Test large scale simulation with pack failures
export function testLargeScaleSimulationWithFailures() {
  console.log('=== Test: Large Scale Simulation with Pack Failures ===');
  
  const cards = createMockCardSet();
  const drawCount = 10000;
  
  console.log(`Simulating ${drawCount.toLocaleString()} card draws with original config (pack failures enabled)...`);
  
  const results = simulateCardDraws(cards, drawCount, ORIGINAL_CARD_SELECTION_CONFIG);
  const expectedProbabilities = ORIGINAL_CARD_SELECTION_CONFIG.winningProbabilities;
  
  console.log('Results vs Expected:');
  Object.entries(expectedProbabilities).forEach(([rank, expectedProb]) => {
    const actualCount = results[rank] || 0;
    const actualProb = actualCount / drawCount;
    const deviation = Math.abs(actualProb - expectedProb);
    const deviationPercent = (deviation / expectedProb) * 100;
    
    console.log(`  ${rank}: ${actualCount.toLocaleString()} draws (${(actualProb * 100).toFixed(2)}%) vs expected ${(expectedProb * 100).toFixed(2)}% - Deviation: ${deviationPercent.toFixed(1)}%`);
  });

  // Show pack failures
  const failureCount = results['FAILURE'] || 0;
  const failureProb = failureCount / drawCount;
  const expectedFailureProb = 1 - Object.values(expectedProbabilities).reduce((sum, prob) => sum + prob, 0);
  console.log(`  FAILURE: ${failureCount.toLocaleString()} draws (${(failureProb * 100).toFixed(2)}%) vs expected ${(expectedFailureProb * 100).toFixed(2)}%`);

  console.log('\n');
  return results;
}

// Test scenario 5: Test edge cases
export function testEdgeCases() {
  console.log('=== Test: Edge Cases ===');
  
  // Test with empty card array
  try {
    selectRandomCard([]);
    console.log('❌ Empty array should throw error');
  } catch (error) {
    console.log('✅ Empty array correctly throws error:', (error as Error).message);
  }

  // Test with invalid probability config
  const invalidConfig: CardSelectionConfig = {
    winningProbabilities: {
      'A': 0.50,
      'AA': 0.30,
      'S': 0.25,  // Total > 1.0
      'SS': 0.10,
    }
  };
  
  const isValidConfig = validateCardSelectionConfig(invalidConfig);
  console.log(`Invalid config validation: ${isValidConfig ? '❌ Should be invalid' : '✅ Correctly identified as invalid'}`);

  // Test with cards missing certain ranks
  const limitedCards = [
    createMockCard(1, 'A', 'Only A Card 1'),
    createMockCard(2, 'A', 'Only A Card 2'),
    // No AA, S, or SS cards
  ];

  console.log('Testing with limited ranks (only A cards):');
  for (let i = 0; i < 5; i++) {
    const result = selectRandomCard(limitedCards);
    const display = result.success ? `${result.card!.rank} - ${result.card!.name}` : `FAILURE - ${result.failureReason}`;
    console.log(`  Draw ${i + 1}: ${display}`);
  }

  console.log('\n');
}

// Test scenario 6: Test different card compositions
export function testDifferentCardCompositions() {
  console.log('=== Test: Different Card Compositions ===');
  
  // Scenario 1: Lots of common cards, few rare cards
  const heavyCommonCards = [
    ...Array.from({ length: 10 }, (_, i) => createMockCard(i + 1, 'A', `Common ${i + 1}`)),
    createMockCard(11, 'AA', 'Single Uncommon'),
    createMockCard(12, 'S', 'Single Rare'),
  ];

  console.log('Testing with heavy common composition:');
  const heavyCommonResults = simulateCardDraws(heavyCommonCards, 1000);
  Object.entries(heavyCommonResults).forEach(([rank, count]) => {
    console.log(`  ${rank}: ${count} draws (${((count / 1000) * 100).toFixed(1)}%)`);
  });

  // Scenario 2: Only rare cards
  const onlyRareCards = [
    createMockCard(1, 'S', 'Rare 1'),
    createMockCard(2, 'S', 'Rare 2'),
    createMockCard(3, 'SS', 'Ultra Rare 1'),
  ];

  console.log('Testing with only rare cards:');
  for (let i = 0; i < 5; i++) {
    const result = selectRandomCard(onlyRareCards);
    const display = result.success ? `${result.card!.rank} - ${result.card!.name}` : `FAILURE - ${result.failureReason}`;
    console.log(`  Draw ${i + 1}: ${display}`);
  }

  console.log('\n');
}

// Test scenario 7: Performance test
export function testPerformance() {
  console.log('=== Test: Performance ===');
  
  const cards = createMockCardSet();
  const iterations = 100000;
  
  console.log(`Testing performance with ${iterations.toLocaleString()} iterations...`);
  
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    selectRandomCard(cards);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  const operationsPerSecond = Math.floor(iterations / (duration / 1000));
  
  console.log(`Completed in ${duration}ms`);
  console.log(`Performance: ${operationsPerSecond.toLocaleString()} operations/second`);
  
  console.log('\n');
}

// Run all tests
export function runAllCardSelectionTests() {
  console.log('🃏 Running Card Selection Tests\n');
  
  testDeterministicCardSelection();
  testProbabilityDistribution();
  testProbabilityDistributionWithFailures();
  testCustomProbabilityConfig();
  const simulationResults = testLargeScaleSimulationWithFailures();
  testEdgeCases();
  testDifferentCardCompositions();
  testPerformance();

  console.log('✅ All card selection tests completed!');
  return { simulationResults };
}

// Export for use in other test files or direct execution
if (require.main === module) {
  runAllCardSelectionTests();
}
