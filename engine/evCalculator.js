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
      qualifier: { rank: 'PAIR', rankValue: 9 }, // Jack or better to qualify
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
    const breakdown = {}; // Track frequency of each hand type

    for (const finalHand of allDraws) {
      const payout = this._getPayout(finalHand);
      totalPayout += payout;
      
      // Get the hand category for breakdown
      const category = this.paytable.name === 'Deuces Wild'
        ? this.evaluator.evaluateWithWilds(finalHand).category
        : this.evaluator.getPaytableCategory(finalHand);
      
      if (!breakdown[category]) {
        breakdown[category] = { count: 0, totalPayout: 0 };
      }
      breakdown[category].count++;
      breakdown[category].totalPayout += payout;
    }

    const numDraws = allDraws.length;
    const ev = totalPayout / numDraws;

    return {
      held: heldCards,
      ev: ev,
      totalPayout: totalPayout,
      numDraws: numDraws,
      averagePayout: totalPayout / numDraws,
      breakdown: breakdown,
      totalOutcomes: numDraws
    };
  }

  /**
   * Get the payout for a specific hand
   */
  _getPayout(hand) {
    // Use wild card evaluation for Deuces Wild
    const category = this.paytable.name === 'Deuces Wild' 
      ? this.evaluator.evaluateWithWilds(hand).category
      : this.evaluator.getPaytableCategory(hand);
    
    let payout = this.paytable.payouts[category];
    
    // Handle complex payout structures (e.g., bonus quads in Double Double Bonus)
    if (typeof payout === 'object') {
      const evaluation = this.paytable.name === 'Deuces Wild'
        ? this.evaluator.evaluateWithWilds(hand)
        : this.evaluator.evaluate(hand);
        
      if (this.paytable.name === 'Double Double Bonus') {
        payout = this._getBonusQuadPayout(evaluation);
      } else if (this.paytable.name === 'Deuces Wild') {
        payout = this._getDeucesWildPayout(hand, category, evaluation);
      }
    }
    
    // Special handling for pair - must meet minimum qualifier
    if (category === 'Pair') {
      const evaluation = this.evaluator.evaluate(hand);
      // Check if this pair meets the qualifier
      if (evaluation.kickers[0] < this.paytable.qualifier.rankValue) {
        return 0; // Doesn't qualify
      }
    }

    return payout || 0;
  }

  /**
   * Get payout for bonus quad structure (Double Double Bonus 10/6)
   * 4 Aces + 2-4 kicker = 400
   * 4 Aces + 5-K kicker = 160
   * 4 2-4 + A/2/3/4 kicker = 160
   * 4 2-4 + 5-K kicker = 80
   * 4 5-K = 50
   */
  _getBonusQuadPayout(evaluation) {
    const quadRank = evaluation.kickers[0];  // Rank of the quad (0-12 for 2-A)
    const kickerRank = evaluation.kickers[1];  // Rank of the single kicker

    // Quad Aces (rank 12)
    if (quadRank === 12) {
      // 2-4 kickers (rank 0-2)
      if (kickerRank <= 2) {
        return 400;
      } else {
        // 5-K kickers (rank 3-11)
        return 160;
      }
    }

    // Quad 2-4 (rank 0-2)
    if (quadRank <= 2) {
      // A/2/3/4 kickers: A=12, 2=0, 3=1, 4=2
      if (kickerRank === 12 || kickerRank === 0 || kickerRank === 1 || kickerRank === 2) {
        return 160;
      } else {
        // 5-K kickers (rank 3-11)
        return 80;
      }
    }

    // Quad 5-K (rank 3-11)
    return 50;
  }

  /**
   * Get payout for Deuces Wild "Full Pay" where:
   * - Natural Royal (no deuces): 800
   * - Four Deuces: 200
   * - Wild Royal (with deuces): 25
   * - Five of a Kind: 15
   * - Straight Flush: 9
   * - Four of a Kind: 5
   * - Full House: 3
   * - Flush: 2
   * - Straight: 2
   * - Three of a Kind: 1
   */
  _getDeucesWildPayout(hand, category, evaluation) {
    const numDeuces = hand.filter(card => card.charAt(0) === '2').length;

    // Four Deuces - special category
    if (category === 'Four Deuces') {
      return 200;
    }

    // Natural Royal Flush (no deuces)
    if (category === 'Royal Flush') {
      return 800;
    }

    // Wild Royal Flush (with deuces)
    if (category === 'Wild Royal Flush') {
      return 25;
    }

    // Five of a Kind
    if (category === 'Five of a Kind') {
      return 15;
    }

    // Standard Four of a Kind (no deuces, or natural quad with a deuce kicker)
    if (category === 'Four of a Kind') {
      return 5;
    }

    // Straight Flush
    if (category === 'Straight Flush') {
      return 9;
    }

    // All other hands use standard payout from paytable
    return this.paytable.payouts[category] || 0;
  }
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
        name: 'Jacks or Better',
        qualifier: { rank: 'PAIR', rankValue: 9 },
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
        name: 'Deuces Wild',
        qualifier: { rank: 'THREE_OF_A_KIND', rankValue: 2 },
        payouts: {
          'Royal Flush': 800,           // Natural Royal Flush
          'Four Deuces': 200,           // Four Deuces
          'Wild Royal Flush': 25,       // Wild Royal Flush (with deuces)
          'Five of a Kind': 15,         // 5-of-a-kind
          'Straight Flush': 9,          // Straight Flush
          'Four of a Kind': 5,          // 4-of-a-kind
          'Full House': 3,              // Full House
          'Flush': 2,                   // Flush
          'Straight': 2,                // Straight
          'Three of a Kind': 1,         // 3-of-a-kind
          'Pair': 0,
          'Two Pair': 0,
          'High Card': 0
        }
      },
      {
        name: 'Double Double Bonus',
        qualifier: { rank: 'PAIR', rankValue: 9 },
        payouts: {
          'Royal Flush': 800,
          'Straight Flush': 50,
          'Four of a Kind': {  // Bonus quad structure
            '4 Aces + 2-4': 400,
            '4 Aces + 5-K': 160,
            '4 2-4 + A-4': 160,
            '4 2-4 + 5-K': 80,
            '4 5-K': 50
          },
          'Full House': 10,
          'Flush': 6,
          'Straight': 4,
          'Three of a Kind': 3,
          'Two Pair': 1,
          'Pair': 1,
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
