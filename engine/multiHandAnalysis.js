/**
 * Multi-Hand Analysis
 * Calculates expected outcomes over multiple hands with statistical context
 */

class MultiHandAnalysis {
  /**
   * Calculate multi-hand statistics
   * @param {number} evPerHand - Expected value per hand
   * @param {number} numHands - Number of hands to analyze
   * @param {number} betPerHand - Bet amount per hand (default 5 for standard video poker)
   * @returns {object} Statistics for multiple hands
   */
  static calculateExpectations(evPerHand, numHands = 10, betPerHand = 5) {
    const totalExpectedValue = evPerHand * numHands;
    const expectedReturn = (totalExpectedValue / (betPerHand * numHands)) * 100;
    
    // Calculate statistical spread using standard deviation
    // For video poker, we estimate variance from the EV
    const variance = this._estimateVariance(evPerHand, betPerHand);
    const stdDev = Math.sqrt(variance * numHands);
    
    // Confidence intervals (approximate)
    const ci95Lower = totalExpectedValue - (1.96 * stdDev);
    const ci95Upper = totalExpectedValue + (1.96 * stdDev);
    
    return {
      numHands: numHands,
      betPerHand: betPerHand,
      totalBet: betPerHand * numHands,
      evPerHand: evPerHand,
      totalExpectedValue: totalExpectedValue,
      expectedReturn: expectedReturn,
      expectedReturnPercent: expectedReturn,
      
      // Confidence intervals (95%)
      ci95Lower: ci95Lower,
      ci95Upper: ci95Upper,
      ci95Range: ci95Upper - ci95Lower,
      
      // Standard deviation
      stdDev: stdDev,
      
      // Common outcome probabilities (approximate using normal distribution)
      probabilities: {
        breakEven: this._normalCDF(stdDev, 0, stdDev) - this._normalCDF(-stdDev, 0, stdDev),
        winning: this._normalCDF(Infinity, totalExpectedValue, stdDev),
        losing: this._normalCDF(0, totalExpectedValue, stdDev)
      }
    };
  }

  /**
   * Estimate variance from expected value
   * This uses a heuristic approach since we don't have full distribution
   */
  static _estimateVariance(evPerHand, betPerHand) {
    // Typical video poker variance is roughly 20-30 times the bet
    // Adjusted based on EV
    const baseVariance = Math.pow(betPerHand, 2) * 25;
    return baseVariance;
  }

  /**
   * Cumulative distribution function for normal distribution
   * Approximate using error function
   */
  static _normalCDF(x, mean = 0, stdDev = 1) {
    if (stdDev === 0) return x >= mean ? 1 : 0;
    const z = (x - mean) / stdDev;
    // Approximation of error function
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z >= 0 ? 1 : -1;
    const absZ = Math.abs(z);
    const t = 1 / (1 + p * absZ);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;

    const erf = 1 - (((((a5 * t5) + (a4 * t4)) + (a3 * t3)) + (a2 * t2)) + (a1 * t)) * 
                Math.exp(-z * z);
    const cdf = 0.5 * (1 + sign * erf);
    return cdf;
  }

  /**
   * Format statistics for display
   */
  static formatForDisplay(stats) {
    return {
      summary: {
        hands: stats.numHands,
        totalBet: stats.totalBet.toFixed(2),
        expectedValue: stats.totalExpectedValue.toFixed(2),
        expectedReturnPercent: stats.expectedReturnPercent.toFixed(2)
      },
      confidence: {
        lower: stats.ci95Lower.toFixed(2),
        upper: stats.ci95Upper.toFixed(2),
        range: stats.ci95Range.toFixed(2)
      },
      probabilities: {
        winning: (stats.probabilities.winning * 100).toFixed(1),
        losing: (stats.probabilities.losing * 100).toFixed(1)
      }
    };
  }

  /**
   * Get a human-readable description of the outcome
   */
  static getOutcomeDescription(stats) {
    const ev = stats.totalExpectedValue;
    const returnPct = stats.expectedReturnPercent;

    if (returnPct > 100) {
      return `Favorable! Over ${stats.numHands} hands, you expect to gain about ${ev.toFixed(2)} credits (${returnPct.toFixed(1)}% return).`;
    } else if (returnPct === 100) {
      return `Break-even game. Over ${stats.numHands} hands, expected value is approximately 0 credits.`;
    } else if (returnPct > 95) {
      return `Slightly unfavorable. Over ${stats.numHands} hands, you expect to lose about ${Math.abs(ev).toFixed(2)} credits (${returnPct.toFixed(1)}% return).`;
    } else {
      return `Unfavorable. Over ${stats.numHands} hands, you expect to lose about ${Math.abs(ev).toFixed(2)} credits (${returnPct.toFixed(1)}% return).`;
    }
  }
}

// Export for Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiHandAnalysis;
}
