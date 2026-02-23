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
        return high + 2; // Return the actual rank value (13 for K, 14 for A)
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
    const evaluation = this.evaluate(hand);

    if (qualifier.rank === 'PAIR') {
      if (evaluation.rank < this.RANKS.PAIR) return false;
      if (evaluation.rank === this.RANKS.PAIR) {
        return evaluation.kickers[0] >= qualifier.rankValue;
      }
      if (evaluation.rank === this.RANKS.TWO_PAIR) {
        return evaluation.kickers[0] >= qualifier.rankValue || evaluation.kickers[1] >= qualifier.rankValue;
      }
      // Higher hands always qualify
      return true;
    }

    return evaluation.rank >= this.RANKS[qualifier.rank];
  }

  /**
   * Get the paytable category for a given hand
   */
  getPaytableCategory(hand) {
    const evaluation = this.evaluate(hand);
    return evaluation.category;
  }

  /**
   * Evaluate a hand with wild cards (deuces wild)
   * Returns the best possible hand using optimized heuristics
   */
  evaluateWithWilds(hand, wildRank = '2') {
    // Count wilds and non-wilds
    const wilds = hand.filter(card => card.charAt(0) === wildRank);
    const nonWilds = hand.filter(card => card.charAt(0) !== wildRank);
    const numWilds = wilds.length;

    // Special case: Four deuces
    if (numWilds === 4) {
      return {
        rank: this.RANKS.FOUR_OF_A_KIND + 2,
        category: 'Four Deuces',
        kickers: [0]
      };
    }

    // If no wilds, evaluate normally
    if (numWilds === 0) {
      return this.evaluate(hand);
    }

    // Use optimized heuristic evaluation instead of brute force
    return this._evaluateWithWildsOptimized(nonWilds, numWilds);
  }

  /**
   * Optimized wild card evaluation using heuristics
   * Much faster than brute force - checks specific patterns
   */
  _evaluateWithWildsOptimized(nonWilds, numWilds) {
    const nonWildRanks = nonWilds.map(c => c.charAt(0));
    const nonWildSuits = nonWilds.map(c => c.charAt(1));
    
    // Build frequency map of non-wild cards
    const rankFreq = {};
    const suitFreq = {};
    for (const card of nonWilds) {
      const rank = card.charAt(0);
      const suit = card.charAt(1);
      rankFreq[rank] = (rankFreq[rank] || 0) + 1;
      suitFreq[suit] = (suitFreq[suit] || 0) + 1;
    }

    // Check for Royal Flush (A-K-Q-J-T of same suit)
    const royalResult = this._checkWildRoyal(nonWilds, numWilds, suitFreq);
    if (royalResult) return royalResult;

    // Check for Five of a Kind
    const fiveKindResult = this._checkWildFiveOfKind(rankFreq, numWilds);
    if (fiveKindResult) return fiveKindResult;

    // Check for Straight Flush
    const straightFlushResult = this._checkWildStraightFlush(nonWilds, numWilds);
    if (straightFlushResult) return straightFlushResult;

    // Check for Four of a Kind
    const fourKindResult = this._checkWildFourOfKind(rankFreq, numWilds);
    if (fourKindResult) return fourKindResult;

    // Check for Full House
    const fullHouseResult = this._checkWildFullHouse(rankFreq, numWilds);
    if (fullHouseResult) return fullHouseResult;

    // Check for Flush
    const flushResult = this._checkWildFlush(suitFreq, numWilds);
    if (flushResult) return flushResult;

    // Check for Straight
    const straightResult = this._checkWildStraight(nonWildRanks, numWilds);
    if (straightResult) return straightResult;

    // Check for Three of a Kind
    const threeKindResult = this._checkWildThreeOfKind(rankFreq, numWilds);
    if (threeKindResult) return threeKindResult;

    // Default to whatever we can make with wilds
    if (numWilds >= 2) {
      return { rank: this.RANKS.THREE_OF_A_KIND, category: 'Three of a Kind', kickers: [12] }; // Three Aces
    }
    if (numWilds === 1 && Object.keys(rankFreq).length > 0) {
      const bestRank = Math.max(...Object.keys(rankFreq).map(r => this.RANK_INDEX[r]));
      return { rank: this.RANKS.PAIR, category: 'Pair', kickers: [bestRank] };
    }
    
    return { rank: this.RANKS.HIGH_CARD, category: 'High Card', kickers: [12] };
  }

  _checkWildRoyal(nonWilds, numWilds, suitFreq) {
    const royalRanks = ['A', 'K', 'Q', 'J', 'T'];
    
    // Find suit with most cards
    const maxSuit = Object.keys(suitFreq).reduce((a, b) => suitFreq[a] > suitFreq[b] ? a : b, 'H');
    const cardsInSuit = nonWilds.filter(c => c.charAt(1) === maxSuit);
    const ranksInSuit = cardsInSuit.map(c => c.charAt(0));
    
    // Count how many royal ranks we have in that suit
    const royalMatches = royalRanks.filter(r => ranksInSuit.includes(r)).length;
    
    // Can we make a royal with wilds?
    if (royalMatches + numWilds >= 5) {
      // If all 5 royal ranks are natural (none of the royals are deuces), it's a natural royal
      const isNaturalRoyal = royalMatches === 5;
      
      return {
        rank: this.RANKS.ROYAL_FLUSH,
        category: isNaturalRoyal ? 'Royal Flush' : 'Wild Royal Flush',
        kickers: [14, 13, 12, 11, 10]
      };
    }
    return null;
  }

  _checkWildFiveOfKind(rankFreq, numWilds) {
    // Find the highest rank that can make five of a kind
    let bestRank = null;
    for (const [rank, count] of Object.entries(rankFreq)) {
      if (count + numWilds >= 5) {
        const rankIdx = this.RANK_INDEX[rank];
        if (bestRank === null || rankIdx > bestRank) {
          bestRank = rankIdx;
        }
      }
    }
    if (bestRank !== null) {
      return {
        rank: this.RANKS.FOUR_OF_A_KIND + 1,
        category: 'Five of a Kind',
        kickers: [bestRank]
      };
    }
    return null;
  }

  _checkWildStraightFlush(nonWilds, numWilds) {
    // For each suit, check if we can make a straight flush
    const suits = ['H', 'D', 'C', 'S'];
    for (const suit of suits) {
      const cardsInSuit = nonWilds.filter(c => c.charAt(1) === suit);
      const ranksInSuit = cardsInSuit.map(c => this.RANK_INDEX[c.charAt(0)]);
      
      // Can we form a straight with these ranks + wilds?
      const straightRank = this._findBestStraight(ranksInSuit, numWilds);
      if (straightRank !== null) {
        return {
          rank: this.RANKS.STRAIGHT_FLUSH,
          category: 'Straight Flush',
          kickers: straightRank === 5 ? [5, 4, 3, 2, 1] : this._getStraightKickers(straightRank)
        };
      }
    }
    return null;
  }

  _checkWildFourOfKind(rankFreq, numWilds) {
    // Find the highest rank that can make four of a kind
    let bestRank = null;
    for (const [rank, count] of Object.entries(rankFreq)) {
      if (count + numWilds >= 4) {
        const rankIdx = this.RANK_INDEX[rank];
        if (bestRank === null || rankIdx > bestRank) {
          bestRank = rankIdx;
        }
      }
    }
    if (bestRank !== null) {
      return {
        rank: this.RANKS.FOUR_OF_A_KIND,
        category: 'Four of a Kind',
        kickers: [bestRank]
      };
    }
    return null;
  }

  _checkWildFullHouse(rankFreq, numWilds) {
    const ranks = Object.keys(rankFreq);
    if (ranks.length < 2) {
      return null; // Need at least 2 different ranks
    }

    // Check all possible ways to make full house
    const entries = ranks.map(r => [r, rankFreq[r]]);
    
    // Try each rank as the three-of-a-kind
    for (let i = 0; i < entries.length; i++) {
      const trips = entries[i];
      const tripsRank = trips[0];
      const tripsCount = trips[1];
      const wildUsedForTrips = Math.max(0, 3 - tripsCount);
      
      // Check if we have enough wilds for trips
      if (wildUsedForTrips > numWilds) {
        continue;
      }
      
      // Remaining wilds after making trips
      const remainingWilds = numWilds - wildUsedForTrips;
      
      // Try each other rank as the pair
      for (let j = 0; j < entries.length; j++) {
        if (i === j) continue;
        
        const pair = entries[j];
        const pairRank = pair[0];
        const pairCount = pair[1];
        const wildUsedForPair = Math.max(0, 2 - pairCount);
        
        // Check if we have enough wilds for pair
        if (wildUsedForPair <= remainingWilds) {
          // Found a valid full house - return the best combination
          return {
            rank: this.RANKS.FULL_HOUSE,
            category: 'Full House',
            kickers: [this.RANK_INDEX[tripsRank], this.RANK_INDEX[pairRank]]
          };
        }
      }
    }
    
    return null;
  }

  _checkWildFlush(suitFreq, numWilds) {
    for (const count of Object.values(suitFreq)) {
      if (count + numWilds >= 5) {
        return {
          rank: this.RANKS.FLUSH,
          category: 'Flush',
          kickers: [12, 11, 10, 9, 8] // Ace high kickers
        };
      }
    }
    return null;
  }

  _checkWildStraight(nonWildRanks, numWilds) {
    const rankIndices = nonWildRanks.map(r => this.RANK_INDEX[r]);
    const straightRank = this._findBestStraight(rankIndices, numWilds);
    
    if (straightRank !== null) {
      return {
        rank: this.RANKS.STRAIGHT,
        category: 'Straight',
        kickers: straightRank === 5 ? [5, 4, 3, 2, 1] : this._getStraightKickers(straightRank)
      };
    }
    return null;
  }

  _checkWildThreeOfKind(rankFreq, numWilds) {
    // Find the highest rank that can make three of a kind
    let bestRank = null;
    for (const [rank, count] of Object.entries(rankFreq)) {
      if (count + numWilds >= 3) {
        const rankIdx = this.RANK_INDEX[rank];
        if (bestRank === null || rankIdx > bestRank) {
          bestRank = rankIdx;
        }
      }
    }
    if (bestRank !== null) {
      return {
        rank: this.RANKS.THREE_OF_A_KIND,
        category: 'Three of a Kind',
        kickers: [bestRank]
      };
    }
    return null;
  }

  _findBestStraight(rankIndices, numWilds) {
    // Try to find best straight from high to low
    // Check A-K-Q-J-T (14-high) down to 5-4-3-2-A (5-high)
    
    for (let high = 12; high >= 4; high--) {
      const needed = [high, high - 1, high - 2, high - 3, high - 4];
      const matches = needed.filter(r => rankIndices.includes(r)).length;
      if (matches + numWilds >= 5) {
        return high + 2; // Return actual rank value
      }
    }
    
    // Check for A-2-3-4-5 (wheel)
    const wheelNeeded = [12, 0, 1, 2, 3]; // A, 2, 3, 4, 5
    const wheelMatches = wheelNeeded.filter(r => rankIndices.includes(r)).length;
    if (wheelMatches + numWilds >= 5) {
      return 5; // 5-high straight
    }
    
    return null;
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandEvaluator;
}
