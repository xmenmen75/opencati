import { 
  selectRandomCard, 
  simulateCardDraws,
  createMockCardSet,
  DEFAULT_CARD_SELECTION_CONFIG,
  ORIGINAL_CARD_SELECTION_CONFIG 
} from '../card-selector';

console.log('🎮 Pack Opening Configuration Comparison\n');

const cards = createMockCardSet();

console.log('📦 Available Cards:');
cards.forEach(card => {
  console.log(`  ${card.rank} - ${card.name}`);
});

console.log('\n' + '='.repeat(60));
console.log('🎯 Configuration 1: Always Win (No Pack Failures)');
console.log('='.repeat(60));

const alwaysWinResults = simulateCardDraws(cards, 1000, DEFAULT_CARD_SELECTION_CONFIG);
console.log('Results from 1,000 pack openings:');
Object.entries(alwaysWinResults).forEach(([rank, count]) => {
  const percentage = ((count / 1000) * 100).toFixed(1);
  console.log(`  ${rank}: ${count.toString().padStart(3)} draws (${percentage.padStart(5)}%)`);
});

console.log('\n' + '='.repeat(60));
console.log('💸 Configuration 2: Original (With Pack Failures)');
console.log('='.repeat(60));

const originalResults = simulateCardDraws(cards, 1000, ORIGINAL_CARD_SELECTION_CONFIG);
console.log('Results from 1,000 pack openings:');
Object.entries(originalResults).forEach(([rank, count]) => {
  const percentage = ((count / 1000) * 100).toFixed(1);
  const emoji = rank === 'FAILURE' ? '💸' : '🎴';
  console.log(`  ${emoji} ${rank}: ${count.toString().padStart(3)} draws (${percentage.padStart(5)}%)`);
});

console.log('\n' + '='.repeat(60));
console.log('📊 Economic Impact Analysis');
console.log('='.repeat(60));

const packCost = 500; // CATI per pack
const totalPacks = 1000;
const totalSpent = totalPacks * packCost;

const cardsWonAlways = totalPacks;
const cardsWonOriginal = Object.entries(originalResults)
  .filter(([rank]) => rank !== 'FAILURE')
  .reduce((sum, [, count]) => sum + count, 0);

console.log(`Total CATI spent: ${totalSpent.toLocaleString()} CATI`);
console.log(`\nAlways Win Config:`);
console.log(`  Cards won: ${cardsWonAlways} (100%)`);
console.log(`  CATI per card: ${packCost} CATI`);
console.log(`\nOriginal Config (with failures):`);
console.log(`  Cards won: ${cardsWonOriginal} (~38%)`);
console.log(`  Pack failures: ${originalResults['FAILURE'] || 0} (~62%)`);
console.log(`  Effective CATI per card: ${Math.round(totalSpent / cardsWonOriginal)} CATI`);
console.log(`  "Wasted" CATI on failures: ${(originalResults['FAILURE'] || 0) * packCost} CATI`);

console.log('\n🎯 The original config creates scarcity and excitement but costs more per actual card!');
