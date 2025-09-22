const { selectRandomCard, createMockSeasonCardSet } = require('../src/lib/card-selector');

console.log('Testing the new pack opening logic...');

// Create mock season cards
const mockSeasonCards = createMockSeasonCardSet();
console.log(`Created ${mockSeasonCards.length} mock season cards`);

// Test pack opening multiple times
console.log('\nTesting pack opening 10 times:');
for (let i = 0; i < 10; i++) {
  const result = selectRandomCard(mockSeasonCards);
  if (result.success && result.card) {
    console.log(`Pack ${i + 1}: Got ${result.card.name} (${result.card.rank}) - Drop rate: ${(parseFloat(result.card.dropProbability.toString()) * 100).toFixed(2)}%`);
  } else {
    console.log(`Pack ${i + 1}: Pack failed - ${result.failureReason}`);
  }
}

// Test probability distribution
console.log('\nTesting probability distribution over 1000 draws:');
const results = {};
for (let i = 0; i < 1000; i++) {
  const result = selectRandomCard(mockSeasonCards);
  if (result.success && result.card) {
    const rank = result.card.rank;
    results[rank] = (results[rank] || 0) + 1;
  } else {
    results['FAILURE'] = (results['FAILURE'] || 0) + 1;
  }
}

console.log('Results:');
for (const [rank, count] of Object.entries(results)) {
  console.log(`${rank}: ${count} times (${(count / 1000 * 100).toFixed(1)}%)`);
}
