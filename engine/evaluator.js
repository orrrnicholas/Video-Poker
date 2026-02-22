/**
 * Poker Hand Evaluator
 * Optimized for performance using rank/suit frequencies and bitmask detection
 * Identifies hand categories and returns canonical evaluation
 */

class HandEvaluator {
  constructor() {
    // Hand rankings from worst to best
    this.RANKS = {
      HIGH_CARD: 0,
      PAIR: 1,
      TWO_PAIR: 2,
      THREE_OF_A_KIND: 3,
      STRAIGHT: 4,
      FLUSH: 5,
      FULL_HOUSE: 6,
      FOUR_OF_A_KIND: 7,
      STRAIGHT_FLUSH: 8,
      ROYAL_FLUSH: 9
    };

    // Card rank values (for straight detection)
    this.RANK_VALUES = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };

    // Rank indices for internal use
    this.RANK_INDEX = {
      '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5, '8': 6,
      '9': 7, 'T': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
    };

    // Suit indices
    this.SUIT_INDEX = {
      'H': 0, 'D': 1, 'C': 2, 'S': 3
    };

    // Kicker ordering for hand comparison
    this.kickers = [];
  }

  /**
   * Evaluates a 5-card hand
   * Hand format: array of strings like ['AS', 'KD', 'QC', 'JH', 'TH']
   * Returns: { rank: number, category: string, kickers: array }
   */
  evaluate(hand) {
    const cards = this._parseCards(hand);
    
    // Build frequency arrays
    const rankFreq = new Array(13).fill(0);
    const suitFreq = new Array(4).fill(0);
    
    for (const card of cards) {
      rankFreq[card.rankIndex]++;
      suitFreq[card.suitIndex]++;
    }

    // Check for flush
    const isFlush = suitFreq.some(freq => freq === 5);

    // Check for straight (including Ace-low)
    const straightValue = this._checkStraight(rankFreq);
    const isStraight = straightValue !== null;

    // Detect hand category
    const freqCounts = rankFreq.filter(f => f > 0).sort((a, b) => b - a);

    // Royal Flush (A-K-Q-J-T straight flush)
    if (isFlush && isStraight && straightValue === 14) {
      return {
        rank: this.RANKS.ROYAL_FLUSH,
        category: 'Royal Flush',
        kickers: [14, 13, 12, 11, 10]
      };
    }

    // Straight Flush
    if (isFlush && isStraight) {
      const kickers = straightValue === 5 ? [5, 4, 3, 2, 1] : this._getStraightKickers(straightValue);
      return {
        rank: this.RANKS.STRAIGHT_FLUSH,
        category: 'Straight Flush',
        kickers
      };
    }

    // Four of a Kind
    if (freqCounts[0] === 4) {
      const quadsRank = rankFreq.indexOf(4);
      const kicker = rankFreq.findIndex((f, i) => f === 1);
      return {
        rank: this.RANKS.FOUR_OF_A_KIND,
        category: 'Four of a Kind',
        kickers: [quadsRank, kicker]
      };
    }

    // Full House
    if (freqCounts[0] === 3 && freqCounts[1] === 2) {
      const tripsRank = rankFreq.indexOf(3);
      const pairRank = rankFreq.indexOf(2);
      return {
        rank: this.RANKS.FULL_HOUSE,
        category: 'Full House',
        kickers: [tripsRank, pairRank]
      };
    }

    // Flush
    if (isFlush) {
      const flushKickers = rankFreq
        .map((freq, idx) => freq > 0 ? idx : -1)
        .filter(idx => idx >= 0)
        .sort((a, b) => b - a);
      return {
        rank: this.RANKS.FLUSH,
        category: 'Flush',
        kickers: flushKickers
      };
    }

    // Straight
    if (isStraight) {
      const kickers = straightValue === 5 ? [5, 4, 3, 2, 1] : this._getStraightKickers(straightValue);
      return {
        rank: this.RANKS.STRAIGHT,
        category: 'Straight',
        kickers
      };
    }

    // Three of a Kind
    if (freqCounts[0] === 3) {
      const tripsRank = rankFreq.indexOf(3);
      const kickers = rankFreq
        .map((freq, idx) => freq === 1 ? idx : -1)
        .filter(idx => idx >= 0)
        .sort((a, b) => b - a);
      return {
        rank: this.RANKS.THREE_OF_A_KIND,
        category: 'Three of a Kind',
        kickers: [tripsRank, ...kickers]
      };
    }

    // Two Pair
    if (freqCounts[0] === 2 && freqCounts[1] === 2) {
      const pairs = rankFreq
        .map((freq, idx) => freq === 2 ? idx : -1)
        .filter(idx => idx >= 0)
        .sort((a, b) => b - a);
      const kicker = rankFreq.findIndex(f => f === 1);
      return {
        rank: this.RANKS.TWO_PAIR,
        category: 'Two Pair',
        kickers: [pairs[0], pairs[1], kicker]
      };
    }

    // One Pair
    if (freqCounts[0] === 2) {
      const pairRank = rankFreq.indexOf(2);
      const kickers = rankFreq
        .map((freq, idx) => freq === 1 ? idx : -1)
        .filter(idx => idx >= 0)
        .sort((a, b) => b - a);
      return {
        rank: this.RANKS.PAIR,
        category: 'Pair',
        kickers: [pairRank, ...kickers]
      };
    }

    // High Card
    const kickers = rankFreq
      .map((freq, idx) => freq > 0 ? idx : -1)
      .filter(idx => idx >= 0)
      .sort((a, b) => b - a);
    return {
      rank: this.RANKS.HIGH_CARD,
      category: 'High Card',
      kickers
    };
  }

  /**
   * Check if hand contains a straight
   * Returns the high card value of the straight, or null if no straight
   */
  _checkStraight(rankFreq) {
    // Each rank must appear exactly once for a straight
    if (rankFreq.some(freq => freq > 1)) {
      return null;
    }

    // Check for regular straights (Ace-high down to 5-high)
    for (let high = 12; high >= 4; high--) {
      if (rankFreq[high] && rankFreq[high - 1] && rankFreq[high - 2] && rankFreq[high - 3] && rankFreq[high - 4]) {
        return high + 1; // Return the actual rank value (13 for K, 14 for A)
      }
    }

    // Check for Ace-low straight (A-2-3-4-5, treated as 5-high)
    if (rankFreq[12] && rankFreq[0] && rankFreq[1] && rankFreq[2] && rankFreq[3]) {
      return 5; // Ace-low straight, treated as 5-high
    }

    return null;
  }

  /**
   * Get kickers for a straight given high card value
   */
  _getStraightKickers(highValue) {
    if (highValue === 5) {
      // Ace-low: A-2-3-4-5 (Ace counts as 1)
      return [5, 4, 3, 2, 1];
    }
    // Regular straight
    return [highValue, highValue - 1, highValue - 2, highValue - 3, highValue - 4];
  }

  /**
   * Parse card strings to internal format
   */
  _parseCards(cards) {
    return cards.map(card => {
      const rank = card[0];
      const suit = card[1];
      return {
        rankIndex: this.RANK_INDEX[rank],
        rankValue: this.RANK_VALUES[rank],
        suitIndex: this.SUIT_INDEX[suit]
      };
    });
  }

  /**
   * Compare two hands
   * Returns: negative if hand1 is worse, positive if hand1 is better, 0 if equal
   */
  compare(hand1, hand2) {
    const eval1 = this.evaluate(hand1);
    const eval2 = this.evaluate(hand2);

    if (eval1.rank !== eval2.rank) {
      return eval1.rank - eval2.rank;
    }

    // Same rank, compare kickers
    for (let i = 0; i < Math.max(eval1.kickers.length, eval2.kickers.length); i++) {
      const k1 = eval1.kickers[i] || 0;
      const k2 = eval2.kickers[i] || 0;
      if (k1 !== k2) return k1 - k2;
    }

    return 0;
  }

  /**
   * Check if hand qualifies for a paytable minimum
   * qualifier: { rank: 'PAIR', rankValue: 11 } means Jacks or better
   */
  qualifies(hand, qualifier) {
    const eval = this.evaluate(hand);

    if (qualifier.rank === 'PAIR') {
      if (eval.rank < this.RANKS.PAIR) return false;
      if (eval.rank === this.RANKS.PAIR) {
        return eval.kickers[0] >= qualifier.rankValue;
      }
      if (eval.rank === this.RANKS.TWO_PAIR) {
        return eval.kickers[0] >= qualifier.rankValue || eval.kickers[1] >= qualifier.rankValue;
      }
      // Higher hands always qualify
      return true;
    }

    return eval.rank >= this.RANKS[qualifier.rank];
  }

  /**
   * Get the paytable category for a given hand
   */
  getPaytableCategory(hand) {
    const eval = this.evaluate(hand);
    return eval.category;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandEvaluator;
}
