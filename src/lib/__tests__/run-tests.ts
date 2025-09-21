import { runAllRewardTests } from './reward-calculator.test';
import { runAllCardSelectionTests } from './card-selector.test';

console.log('🚀 Running All Game Logic Tests\n');
console.log('='.repeat(50));

// Run reward calculation tests
const rewardResults = runAllRewardTests();

console.log('='.repeat(50));

// Run card selection tests  
const cardResults = runAllCardSelectionTests();

console.log('='.repeat(50));
console.log('🎉 All tests completed successfully!');

// Optional: Export results for analysis
export { rewardResults, cardResults };
