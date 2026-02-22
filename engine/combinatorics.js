/**
 * Combinatorics Module
 * Handles efficient generation of draw combinations and card enumeration
 */

class Combinatorics {
  constructor() {
    // All 52 cards in the deck
    this.SUITS = ['H', 'D', 'C', 'S'];
    this.RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
    this.DECK = this._generateDeck();

    // Cache for combinations to avoid recomputing
    this.combCache = {};
  }

  /**
   * Generate all 52 cards
   */
  _generateDeck() {
    const deck = [];
    for (const suit of this.SUITS) {
      for (const rank of this.RANKS) {
        deck.push(rank + suit);
      }
    }
    return deck;
  }

  /**
   * Get remaining cards in deck after removing held cards
   */
  getAvailableCards(heldCards) {
    const heldSet = new Set(heldCards);
    return this.DECK.filter(card => !heldSet.has(card));
  }

  /**
   * Generate all C(n, k) combinations
   * Used to enumerate all possible draws
   */
  combinations(items, k) {
    const cacheKey = `${items.length}_${k}`;
    if (this.combCache[cacheKey]) {
      // Return combinations from available items
      const cached = this.combCache[cacheKey];
      return cached.map(indices => indices.map(i => items[i]));
    }

    if (k === 0) return [[]];
    if (k > items.length) return [];
    if (k === 1) return items.map(item => [item]);

    const result = [];
    
    const recurse = (start, currentCombo) => {
      if (currentCombo.length === k) {
        result.push([...currentCombo]);
        return;
      }

      for (let i = start; i < items.length; i++) {
        currentCombo.push(items[i]);
        recurse(i + 1, currentCombo);
        currentCombo.pop();
      }
    };

    recurse(0, []);
    return result;
  }

  /**
   * Generate all possible draw combinations
   * Returns all ways to draw (5 - numHeld) cards from remaining deck
   */
  generateAllDraws(heldCards) {
    const available = this.getAvailableCards(heldCards);
    const numToDraw = 5 - heldCards.length;
    
    if (numToDraw === 0) {
      return [[...heldCards]];
    }

    const draws = this.combinations(available, numToDraw);
    
    // Combine held cards with each draw combination
    return draws.map(draw => {
      const finalHand = [...heldCards, ...draw];
      // Sort for consistency
      return finalHand.sort();
    });
  }

  /**
   * Convert bitmask to held cards array
   * bitmask: 0-31, where each bit represents a card position (0-4)
   * cards: original 5-card hand
   */
  bitmaskToHeld(bitmask, cards) {
    const held = [];
    for (let i = 0; i < 5; i++) {
      if (bitmask & (1 << i)) {
        held.push(cards[i]);
      }
    }
    return held;
  }

  /**
   * Convert held cards to bitmask
   */
  heldToBitmask(held, cards) {
    let bitmask = 0;
    const heldSet = new Set(held);
    for (let i = 0; i < 5; i++) {
      if (heldSet.has(cards[i])) {
        bitmask |= (1 << i);
      }
    }
    return bitmask;
  }

  /**
   * Get the number of combinations C(n, k)
   * Used for exact EV calculation
   */
  choose(n, k) {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    if (k > n - k) k = n - k; // Optimize

    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i);
      result /= (i + 1);
    }
    return Math.round(result);
  }

  /**
   * Count the number of possible draws without generating them
   */
  countDraws(numHeld) {
    const numToDraw = 5 - numHeld;
    const remaining = 52 - numHeld;
    return this.choose(remaining, numToDraw);
  }

  /**
   * Generate all possible 5-card hands from the deck
   * Used for house edge calculation
   */
  generateAllHands() {
    return this.combinations(this.DECK, 5);
  }

  /**
   * Count total possible 5-card hands (2,598,960)
   */
  getTotalHandCount() {
    return this.choose(52, 5);
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Combinatorics;
}
