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
        'Royal Flush': 4000,
        'Straight Flush': 250,
        'Four of a Kind': 125,
        'Full House': 45,
        'Flush': 30,
        'Straight': 20,
        'Three of a Kind': 15,
        'Two Pair': 10,
        'Pair': 5, // Must be Jacks or better
        'High Card': 0
      }
    };

    this.paytable = JSON.parse(JSON.stringify(this.defaultPaytable));
    
    // Ultimate X settings
    this.ultimateXEnabled = false;
    this.creditsPerHand = 5; // Base credits per hand (5 for normal, 10 for Ultimate X)
  }

  /**
   * Set custom paytable
   */
  setPaytable(paytable) {
    this.paytable = paytable;
  }

  /**
   * Set Ultimate X settings
   */
  setUltimateXSettings(enabled, creditsPerHand = 5) {
    this.ultimateXEnabled = enabled;
    this.creditsPerHand = creditsPerHand;
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
    
    // NOTE: EV is kept as raw average payout (in credits)
    // RTP% calculation at display time handles the creditsPerHand normalization

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
        
      if (this.paytable.name === 'Double Double Bonus' || this.paytable.name === 'Triple Double Bonus') {
        payout = this._getBonusQuadPayout(evaluation, this.paytable);
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
   * Get payout for bonus quad structure (Double/Triple Double Bonus)
   * Uses the current paytable values for the matching quad sub-category.
   */
  _getBonusQuadPayout(evaluation, paytable) {
    const quadRank = evaluation.kickers[0];  // Rank of the quad (0-12 for 2-A)
    const kickerRank = evaluation.kickers[1];  // Rank of the single kicker
    const quadPayouts = paytable?.payouts?.['Four of a Kind'] || {};

    let payoutKey = null;

    // Quad Aces (rank 12)
    if (quadRank === 12) {
      // 2-4 kickers (rank 0-2)
      payoutKey = (kickerRank <= 2) ? '4 Aces + 2-4' : '4 Aces + 5-K';
    }

    // Quad 2-4 (rank 0-2)
    if (quadRank <= 2) {
      // A/2/3/4 kickers: A=12, 2=0, 3=1, 4=2
      payoutKey = (kickerRank === 12 || kickerRank === 0 || kickerRank === 1 || kickerRank === 2)
        ? '4 2-4 + A-4'
        : '4 2-4 + 5-K';
    }

    // Quad 5-K (rank 3-11)
    if (!payoutKey) {
      payoutKey = '4 5-K';
    }

    return quadPayouts[payoutKey] || 0;
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
      return 1000;
    }

    // Natural Royal Flush (no deuces)
    if (category === 'Royal Flush') {
      return 4000;
    }

    // Wild Royal Flush (with deuces)
    if (category === 'Wild Royal Flush') {
      return 125;
    }

    // Five of a Kind
    if (category === 'Five of a Kind') {
      return 75;
    }

    // Standard Four of a Kind (no deuces, or natural quad with a deuce kicker)
    if (category === 'Four of a Kind') {
      return 25;
    }

    // Straight Flush
    if (category === 'Straight Flush') {
      return 45;
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
          'Royal Flush': 4000,
          'Straight Flush': 250,
          'Four of a Kind': 125,
          'Full House': 45,
          'Flush': 30,
          'Straight': 20,
          'Three of a Kind': 15,
          'Two Pair': 10,
          'Pair': 5,
          'High Card': 0
        }
      },
      {
        name: 'Deuces Wild',
        qualifier: { rank: 'THREE_OF_A_KIND', rankValue: 2 },
        payouts: {
          'Royal Flush': 4000,           // Natural Royal Flush
          'Four Deuces': 1000,           // Four Deuces
          'Wild Royal Flush': 125,       // Wild Royal Flush (with deuces)
          'Five of a Kind': 75,         // 5-of-a-kind
          'Straight Flush': 45,          // Straight Flush
          'Four of a Kind': 25,          // 4-of-a-kind
          'Full House': 15,              // Full House
          'Flush': 10,                   // Flush
          'Straight': 10,                // Straight
          'Three of a Kind': 5,         // 3-of-a-kind
          'Pair': 0,
          'Two Pair': 0,
          'High Card': 0
        }
      },
      {
        name: 'Double Double Bonus',
        qualifier: { rank: 'PAIR', rankValue: 9 },
        payouts: {
          'Royal Flush': 4000,
          'Straight Flush': 250,
          'Four of a Kind': {  // Bonus quad structure
            '4 Aces + 2-4': 2000,
            '4 Aces + 5-K': 800,
            '4 2-4 + A-4': 800,
            '4 2-4 + 5-K': 400,
            '4 5-K': 250
          },
          'Full House': 45,
          'Flush': 30,
          'Straight': 20,
          'Three of a Kind': 15,
          'Two Pair': 5,
          'Pair': 5,
          'High Card': 0
        }
      },
      {
        name: 'Triple Double Bonus',
        qualifier: { rank: 'PAIR', rankValue: 9 },
        payouts: {
          'Royal Flush': 4000,
          'Straight Flush': 250,
          'Four of a Kind': {  // Bonus quad structure
            '4 Aces + 2-4': 4000,
            '4 Aces + 5-K': 800,
            '4 2-4 + A-4': 2000,
            '4 2-4 + 5-K': 400,
            '4 5-K': 250
          },
          'Full House': 45,
          'Flush': 35,
          'Straight': 20,
          'Three of a Kind': 10,
          'Two Pair': 5,
          'Pair': 5,
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
