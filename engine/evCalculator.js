/**
 * EV Calculator
 * Computes exact Expected Value for all 32 hold combinations
 */

class EVCalculator {
  constructor(evaluator, combinatorics) {
    this.evaluator = evaluator;
    this.combinatorics = combinatorics;
    
    // Default paytable (9/6 Jacks or Better)
    this.defaultPaytable = {
      name: '9/6 Jacks or Better',
      qualifier: { rank: 'PAIR', rankValue: 11 }, // Jack or better to qualify
      payouts: {
        'Royal Flush': 800,
        'Straight Flush': 50,
        'Four of a Kind': 25,
        'Full House': 9,
        'Flush': 6,
        'Straight': 4,
        'Three of a Kind': 3,
        'Two Pair': 2,
        'Pair': 1, // Must be Jacks or better
        'High Card': 0
      }
    };

    this.paytable = JSON.parse(JSON.stringify(this.defaultPaytable));
  }

  /**
   * Set custom paytable
   */
  setPaytable(paytable) {
    this.paytable = paytable;
  }

  /**
   * Calculate EV for a specific hold
   * heldCards: array of cards to hold
   * originalHand: the original 5-card hand
   */
  calculateHoldEV(heldCards, originalHand) {
    // Generate all possible final hands from this hold
    const allDraws = this.combinatorics.generateAllDraws(heldCards);
    
    let totalPayout = 0;

    for (const finalHand of allDraws) {
      const payout = this._getPayout(finalHand);
      totalPayout += payout;
    }

    const numDraws = allDraws.length;
    const ev = totalPayout / numDraws;

    return {
      held: heldCards,
      ev: ev,
      totalPayout: totalPayout,
      numDraws: numDraws,
      averagePayout: totalPayout / numDraws
    };
  }

  /**
   * Get the payout for a specific hand
   */
  _getPayout(hand) {
    const category = this.evaluator.getPaytableCategory(hand);
    
    // Special handling for pair - must meet minimum qualifier
    if (category === 'Pair') {
      const eval = this.evaluator.evaluate(hand);
      // Check if this pair meets the qualifier
      if (eval.kickers[0] < this.paytable.qualifier.rankValue) {
        return 0; // Doesn't qualify
      }
    }

    return this.paytable.payouts[category] || 0;
  }

  /**
   * Analyze all 32 possible holds for a given 5-card hand
   * Returns sorted array with EV for each hold
   */
  analyzeAllHolds(hand) {
    const results = [];

    // Generate all 32 possible holds (bitmask 0-31)
    for (let bitmask = 0; bitmask < 32; bitmask++) {
      const held = this.combinatorics.bitmaskToHeld(bitmask, hand);
      const result = this.calculateHoldEV(held, hand);
      
      results.push({
        bitmask: bitmask,
        held: held,
        ev: result.ev,
        numDraws: result.numDraws,
        totalPayout: result.totalPayout
      });
    }

    // Sort by EV descending
    results.sort((a, b) => b.ev - a.ev);

    // Add penalty calculations
    const bestEV = results[0].ev;
    results.forEach(result => {
      result.penalty = bestEV - result.ev;
    });

    return results;
  }

  /**
   * Calculate house edge for entire paytable
   * Enumerates all 2,598,960 starting hands and calculates optimal EV
   * Runs synchronously - use Web Worker wrapper for UI
   */
  calculateHouseEdge(onProgress = null) {
    const allHands = this.combinatorics.generateAllHands();
    const totalHands = allHands.length;

    let totalEV = 0;
    let processed = 0;

    for (const hand of allHands) {
      // Find the optimal hold for this starting hand
      const holds = this.analyzeAllHolds(hand);
      const bestHold = holds[0]; // Already sorted by EV
      
      totalEV += bestHold.ev;
      processed++;

      // Call progress callback if provided
      if (onProgress && processed % 10000 === 0) {
        onProgress({
          processed: processed,
          total: totalHands,
          percentage: (processed / totalHands) * 100,
          currentEV: totalEV / processed
        });
      }
    }

    const overallReturn = totalEV / totalHands;
    const houseEdge = (1 - overallReturn) * 100;

    return {
      overallReturn: overallReturn,
      overallReturnPercent: overallReturn * 100,
      houseEdge: houseEdge,
      totalHandsAnalyzed: totalHands,
      totalEV: totalEV
    };
  }

  /**
   * Get available preset paytables
   */
  static getPresetPaytables() {
    return [
      {
        name: '9/6 Jacks or Better',
        qualifier: { rank: 'PAIR', rankValue: 11 },
        payouts: {
          'Royal Flush': 800,
          'Straight Flush': 50,
          'Four of a Kind': 25,
          'Full House': 9,
          'Flush': 6,
          'Straight': 4,
          'Three of a Kind': 3,
          'Two Pair': 2,
          'Pair': 1,
          'High Card': 0
        }
      },
      {
        name: '8/5 Jacks or Better',
        qualifier: { rank: 'PAIR', rankValue: 11 },
        payouts: {
          'Royal Flush': 800,
          'Straight Flush': 50,
          'Four of a Kind': 25,
          'Full House': 8,
          'Flush': 5,
          'Straight': 4,
          'Three of a Kind': 3,
          'Two Pair': 2,
          'Pair': 1,
          'High Card': 0
        }
      },
      {
        name: '7/5 Jacks or Better',
        qualifier: { rank: 'PAIR', rankValue: 11 },
        payouts: {
          'Royal Flush': 800,
          'Straight Flush': 50,
          'Four of a Kind': 25,
          'Full House': 7,
          'Flush': 5,
          'Straight': 4,
          'Three of a Kind': 3,
          'Two Pair': 2,
          'Pair': 1,
          'High Card': 0
        }
      },
      {
        name: '6/5 Jacks or Better',
        qualifier: { rank: 'PAIR', rankValue: 11 },
        payouts: {
          'Royal Flush': 800,
          'Straight Flush': 50,
          'Four of a Kind': 25,
          'Full House': 6,
          'Flush': 5,
          'Straight': 4,
          'Three of a Kind': 3,
          'Two Pair': 2,
          'Pair': 1,
          'High Card': 0
        }
      },
      {
        name: 'Deuces Wild',
        qualifier: { rank: 'THREE_OF_A_KIND', rankValue: 2 },
        payouts: {
          'Royal Flush': 800,
          'Four of a Kind': 200,
          'Straight Flush': 50,
          'Full House': 13,
          'Flush': 11,
          'Straight': 4,
          'Three of a Kind': 1,
          'Pair': 0,
          'High Card': 0
        }
      }
    ];
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EVCalculator;
}
