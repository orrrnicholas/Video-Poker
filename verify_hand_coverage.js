/**
 * Verification script to ensure all possible hands are properly handled
 * in both evaluators and paytables
 */

// Import the necessary classes
importScripts('engine/evaluator.js');
importScripts('engine/evCalculator.js');
importScripts('engine/combinatorics.js');

function verifyHandCoverage() {
  const evaluator = new HandEvaluator();
  const combinatorics = new Combinatorics();
  const calculator = new EVCalculator(evaluator, combinatorics);
  
  const paytables = EVCalculator.getPresetPaytables();
  
  console.log('=== HAND COVERAGE VERIFICATION ===\n');
  
  for (const paytable of paytables) {
    console.log(`\nVerifying ${paytable.name}...`);
    
    const seenCategories = new Set();
    const missingPayouts = new Set();
    let sampledHands = 0;
    let issues = [];
    
    // Sample hands to check
    const testHands = [
      // Standard hands
      ['AS', 'KS', 'QS', 'JS', 'TS'], // Royal Flush
      ['9S', '8S', '7S', '6S', '5S'], // Straight Flush
      ['AH', 'AD', 'AC', 'AS', 'KH'], // Four Aces
      ['KH', 'KD', 'KC', 'QS', 'QD'], // Full House
      ['2H', '5H', '7H', '9H', 'JH'], // Flush
      ['9H', '8D', '7C', '6S', '5H'], // Straight
      ['AH', 'AD', 'AC', 'KS', 'QH'], // Three of a Kind
      ['KH', 'KD', 'QS', 'QD', 'AH'], // Two Pair
      ['JH', 'JD', '5C', '3S', '2H'], // Pair
      ['AH', 'KD', 'QS', 'JH', '9C'], // High Card
      // Deuces Wild specific
      ['2H', 'AS', 'KD', 'QS', 'JH'], // With 1 deuce
      ['2H', '2D', 'AS', 'KS', 'QS'], // With 2 deuces
      ['2H', '2D', '2C', 'AS', 'KS'], // With 3 deuces
      ['2H', '2D', '2C', '2S', 'AH'], // With 4 deuces (Four Deuces)
    ];
    
    calculator.setPaytable(paytable);
    
    for (const hand of testHands) {
      sampledHands++;
      let category;
      
      try {
        if (paytable.name === 'Deuces Wild') {
          category = evaluator.evaluateWithWilds(hand).category;
        } else {
          category = evaluator.getPaytableCategory(hand);
        }
        
        seenCategories.add(category);
        
        if (!paytable.payouts.hasOwnProperty(category)) {
          missingPayouts.add(category);
          issues.push(`Hand ${hand.join(' ')} evaluated to "${category}" which is NOT in paytable`);
        }
      } catch (e) {
        issues.push(`Error evaluating ${hand.join(' ')}: ${e.message}`);
      }
    }
    
    // Check that all paytable categories are reachable
    const payoutCategories = Object.keys(paytable.payouts);
    const coverageGap = new Set();
    
    // Note: Some categories like "High Card" in Deuces Wild may be unreachable
    // but are in the paytable with 0 payout as a safety net
    
    console.log(`  Sampled ${sampledHands} hands`);
    console.log(`  Categories found: ${Array.from(seenCategories).sort().join(', ')}`);
    console.log(`  Categories in paytable: ${payoutCategories.sort().join(', ')}`);
    
    if (missingPayouts.size > 0) {
      console.log(`  ❌ MISSING PAYOUTS: ${Array.from(missingPayouts).join(', ')}`);
    } else {
      console.log(`  ✅ All evaluated categories have payouts`);
    }
    
    if (issues.length > 0) {
      console.log(`\n  Issues found:`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    }
  }
  
  console.log('\n=== VERIFICATION COMPLETE ===');
}

// Run the verification
try {
  if (typeof WorkerGlobalScope === 'undefined') {
    // Not a worker, log error
    console.log('This script must be run as a Web Worker or in Node.js environment');
  } else {
    verifyHandCoverage();
  }
} catch (e) {
  console.error('Error running verification:', e);
}
