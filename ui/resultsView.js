/**
 * Results View Component
 * Displays all 32 hold combinations sorted by EV
 */

class ResultsView {
  constructor(containerId, cardInput = null, paytableEditor = null, evaluator = null, combinatorics = null) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.cardInput = cardInput;
    this.paytableEditor = paytableEditor;
    this.evaluator = evaluator;
    this.combinatorics = combinatorics;
    this.results = [];
    this.hidden = true;
    this.currentBestHold = null;  // Store the best hold for current hand
    
    // Session calculator settings
    this.numHands = 1;
    this.creditsPerHand = 5;
    this.currentEV = null;
    this.hasSetEV = false;

    // Hand probabilities (per 5-card draw)
    this.handProbabilities = {
      'Royal Flush': 1 / 649740,
      'Straight Flush': 1 / 72193,
      'Four of a Kind': 1 / 4165,
      'Full House': 1 / 694,
      'Flush': 1 / 509,
      'Straight': 1 / 255,
      'Three of a Kind': 1 / 47,
      'Two Pair': 1 / 21,
      'Pair': 1 / 2.37,
      'High Card': 1 / 1.99
    };
  }

  /**
   * Helper method to evaluate hands based on current game type
   * Uses wild card evaluation for Deuces Wild, standard evaluation otherwise
   */
  _evaluateHand(hand) {
    if (!this.evaluator) return null;
    
    const isDeucesWild = this.paytableEditor?.currentPaytable?.name === 'Deuces Wild';
    return isDeucesWild ? this.evaluator.evaluateWithWilds(hand) : this.evaluator.evaluate(hand);
  }

  /**
   * Helper method to get paytable category based on current game type
   */
  _getHandCategory(hand) {
    const evaluation = this._evaluateHand(hand);
    return evaluation ? evaluation.category : 'High Card';
  }

  display(hand, analyses) {
    this.results = analyses;
    this.hidden = false;
    this.currentBestHold = analyses[0]; // Store for hand probability calculation

    this.container.innerHTML = '';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Analysis Results';
    title.className = 'results-title';
    this.container.appendChild(title);

    // Input hand display
    const handDiv = document.createElement('div');
    handDiv.className = 'results-hand-display';
    const suitMap = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };
    const handDisplay = hand.map(card => {
      const color = (card[1] === 'H' || card[1] === 'D') ? '#ff4444' : '#000';
      return `<span style="color: ${color}; font-weight: bold; font-size: 18px;">${card[0]}${suitMap[card[1]]}</span>`;
    }).join(' ');
    handDiv.innerHTML = `<strong>Starting Hand:</strong> ${handDisplay}`;
    this.container.appendChild(handDiv);

    // Best hold highlight
    const bestHold = analyses[0];
    const bestDiv = document.createElement('div');
    bestDiv.className = 'best-hold-highlight';

    const bestTitle = document.createElement('div');
    bestTitle.className = 'best-hold-title';
    bestTitle.textContent = '🎯 Optimal Hold';

    const bestContent = document.createElement('div');
    bestContent.className = 'best-hold-content';

    const bestCards = bestHold.held.map(card => {
      const color = (card[1] === 'H' || card[1] === 'D') ? '#ff4444' : '#000';
      return `<span style="color: ${color}; font-weight: bold; font-size: 20px;">${card[0]}${suitMap[card[1]]}</span>`;
    }).join(' ');

    const bestEVText = document.createElement('div');
    bestEVText.innerHTML = `<div><strong>Hold:</strong> ${bestCards}</div>` +
                           `<div style="margin-top: 8px;"><strong>EV Per Hand:</strong> ${bestHold.ev.toFixed(5)}</div>`;

    bestContent.appendChild(bestEVText);
    bestDiv.appendChild(bestTitle);
    bestDiv.appendChild(bestContent);
    this.container.appendChild(bestDiv);

    // Multi-hand expectations (10 hands)
    this.displayMultiHandExpectations(bestHold.ev);

    // Results as collapsible cards
    const resultsCardsContainer = document.createElement('div');
    resultsCardsContainer.className = 'results-cards-container';

    // Show top 5 by default, rest are "show more"
    const showLimit = 10;
    
    analyses.forEach((result, idx) => {
      const isBest = idx === 0;
      
      // Create result card
      const card = document.createElement('div');
      card.className = `result-card${isBest ? ' best-result' : ''}`;
      
      // Card header (always visible)
      const cardHeader = document.createElement('div');
      cardHeader.className = 'result-card-header';
      
      const cardMain = document.createElement('div');
      cardMain.className = 'result-card-main';
      
      const rank = document.createElement('div');
      rank.className = 'result-rank';
      rank.textContent = `#${idx + 1}`;
      
      const heldCards = document.createElement('div');
      heldCards.className = 'result-held-cards';
      if (result.held.length === 0) {
        heldCards.innerHTML = '<em style="color: #888;">Draw All</em>';
      } else {
        heldCards.innerHTML = result.held.map(card => {
          const color = (card[1] === 'H' || card[1] === 'D') ? '#ff4444' : '#fff';
          return `<span style="color: ${color};">${card[0]}${suitMap[card[1]]}</span>`;
        }).join(' ');
      }
      
      const evBadge = document.createElement('div');
      evBadge.className = 'result-ev-badge';
      evBadge.textContent = result.ev.toFixed(5);
      
      const expandIcon = document.createElement('div');
      expandIcon.className = 'result-expand-icon';
      expandIcon.textContent = '▼';
      
      cardMain.appendChild(rank);
      cardMain.appendChild(heldCards);
      cardHeader.appendChild(cardMain);
      cardHeader.appendChild(evBadge);
      cardHeader.appendChild(expandIcon);
      
      // Card details (collapsible)
      const cardDetails = document.createElement('div');
      cardDetails.className = 'result-card-details';
      
      const detailsContent = document.createElement('div');
      detailsContent.className = 'result-card-details-content';
      
      // Basic details
      const detailsHTML = `
        <div class="result-detail-row">
          <span class="result-detail-label">EV Penalty:</span>
          <span class="result-detail-value">${result.penalty.toFixed(5)}</span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-label">Cards Drawn:</span>
          <span class="result-detail-value">${result.numDraws}</span>
        </div>
        <div class="result-detail-row">
          <span class="result-detail-label">Possible Outcomes:</span>
          <span class="result-detail-value">${result.totalOutcomes?.toLocaleString() || 'N/A'}</span>
        </div>
      `;
      
      detailsContent.innerHTML = detailsHTML;
      
      // Breakdown of hand outcomes
      if (result.breakdown && Object.keys(result.breakdown).length > 0) {
        const breakdown = document.createElement('div');
        breakdown.className = 'result-breakdown';
        
        const breakdownTitle = document.createElement('div');
        breakdownTitle.className = 'result-breakdown-title';
        breakdownTitle.textContent = 'Outcome Breakdown';
        breakdown.appendChild(breakdownTitle);
        
        Object.entries(result.breakdown)
          .sort((a, b) => b[1].count - a[1].count)
          .forEach(([hand, data]) => {
            if (data.count > 0) {
              const item = document.createElement('div');
              item.className = 'result-breakdown-item';
              const percent = ((data.count / result.totalOutcomes) * 100).toFixed(2);
              item.innerHTML = `
                <span>${hand}</span>
                <span style="color: var(--accent-primary);">${data.count.toLocaleString()} (${percent}%)</span>
              `;
              breakdown.appendChild(item);
            }
          });
        
        detailsContent.appendChild(breakdown);
      }
      
      cardDetails.appendChild(detailsContent);
      
      // Toggle expand/collapse
      cardHeader.onclick = () => {
        const isExpanded = cardDetails.classList.contains('expanded');
        cardDetails.classList.toggle('expanded');
        expandIcon.classList.toggle('expanded');
      };
      
      card.appendChild(cardHeader);
      card.appendChild(cardDetails);
      
      // Only show first showLimit, hide rest initially
      if (idx >= showLimit) {
        card.style.display = 'none';
        card.dataset.hidden = 'true';
      }
      
      resultsCardsContainer.appendChild(card);
    });

    this.container.appendChild(resultsCardsContainer);

    // Show more button if there are hidden results
    if (analyses.length > showLimit) {
      const showMoreBtn = document.createElement('button');
      showMoreBtn.className = 'btn btn-secondary';
      showMoreBtn.textContent = `Show ${analyses.length - showLimit} More Results`;
      showMoreBtn.style.cssText = 'margin: 20px auto; display: block; width: 100%; max-width: 400px;';
      showMoreBtn.onclick = () => {
        const hiddenCards = resultsCardsContainer.querySelectorAll('[data-hidden="true"]');
        hiddenCards.forEach(card => {
          card.style.display = 'block';
          card.removeAttribute('data-hidden');
        });
        showMoreBtn.remove();
      };
      this.container.appendChild(showMoreBtn);
    }

    // Table of all holds (for desktop/reference)
    const tableDiv = document.createElement('div');
    tableDiv.className = 'results-table-container';
    tableDiv.style.display = 'none'; // Hidden by default, can be toggled

    const table = document.createElement('table');
    table.className = 'results-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Rank', 'Held Cards', 'EV', 'Penalty', 'Draws'];
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    analyses.forEach((result, idx) => {
      const row = document.createElement('tr');
      if (idx === 0) row.className = 'best-row';
      if (result.penalty > 1) row.className = 'penalty-severe';
      else if (result.penalty > 0.5) row.className = 'penalty-moderate';
      else if (result.penalty > 0) row.className = 'penalty-minor';

      // Rank
      const cellRank = document.createElement('td');
      cellRank.textContent = `#${idx + 1}`;
      cellRank.className = 'rank-col';
      row.appendChild(cellRank);

      // Held cards
      const cellHeld = document.createElement('td');
      const heldText = result.held.length === 0 ?
        '<em style="color: #888;">Draw all</em>' :
        result.held.map(card => {
          const color = (card[1] === 'H' || card[1] === 'D') ? '#ff4444' : '#000';
          return `<span style="color: ${color}; font-weight: bold;">${card[0]}${suitMap[card[1]]}</span>`;
        }).join(' ');
      cellHeld.innerHTML = heldText;
      cellHeld.className = 'held-col';
      row.appendChild(cellHeld);

      // EV
      const cellEV = document.createElement('td');
      cellEV.textContent = result.ev.toFixed(5);
      cellEV.className = 'ev-col';
      row.appendChild(cellEV);

      // Penalty
      const cellPenalty = document.createElement('td');
      cellPenalty.textContent = result.penalty.toFixed(5);
      cellPenalty.className = 'penalty-col';
      row.appendChild(cellPenalty);

      // Draws
      const cellDraws = document.createElement('td');
      cellDraws.textContent = result.numDraws;
      cellDraws.className = 'draws-col';
      row.appendChild(cellDraws);

      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableDiv.appendChild(table);
    this.container.appendChild(tableDiv);

    // Summary stats
    const statsDiv = document.createElement('div');
    statsDiv.className = 'results-summary-stats';

    const worstHold = analyses[analyses.length - 1];
    statsDiv.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Best EV:</span>
        <span class="stat-value">${bestHold.ev.toFixed(5)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Worst EV:</span>
        <span class="stat-value">${worstHold.ev.toFixed(5)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">EV Range:</span>
        <span class="stat-value">${(bestHold.ev - worstHold.ev).toFixed(5)}</span>
      </div>
    `;

    this.container.appendChild(statsDiv);
  }

  displaySessionCalculator() {
    const calcDiv = document.createElement('div');
    calcDiv.className = 'session-calculator';
    calcDiv.style.cssText = `
      background: linear-gradient(135deg, #3a5a7a 0%, #2a4a5a 100%);
      border: 2px solid #5a9aba;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      color: #fff;
    `;

    const calcTitle = document.createElement('h3');
    calcTitle.textContent = '💰 Session Expected Return';
    calcTitle.style.cssText = 'margin-top: 0; margin-bottom: 12px; color: #4addff;';
    calcDiv.appendChild(calcTitle);

    // Display area
    const displayDiv = document.createElement('div');
    displayDiv.id = 'sessionCalculatorDisplay';
    displayDiv.style.cssText = `
      background: rgba(74, 221, 255, 0.1);
      border: 1px solid rgba(74, 221, 255, 0.3);
      border-radius: 4px;
      padding: 12px;
    `;
    calcDiv.appendChild(displayDiv);

    this.container.insertBefore(calcDiv, this.container.querySelector('.best-hold-highlight'));
  }

  updateSessionCalculator() {
    if (!this.hasSetEV) return; // Wait for EV to be set initially

    // Get settings from card input if available, otherwise use local values
    let hands = this.numHands;
    let credits = this.creditsPerHand;
    let currentMultiplier = 1;
    let multipliers = {};
    let ultimateXEnabled = false;
    
    if (this.cardInput) {
      const settings = this.cardInput.getSettings();
      hands = settings.hands;
      credits = settings.credits;
      currentMultiplier = settings.currentMultiplier || 1;
      multipliers = settings.multipliers || {};
      ultimateXEnabled = settings.ultimateXEnabled || false;
    }

    // Calculate base stats
    let baseEV = this.currentEV;
    let multipliedEV = baseEV * currentMultiplier;

    // Calculate weighted session EV if multipliers are provided and enabled
    let sessionEV = multipliedEV; // Current hand contribution
    let remainingHands = hands - 1;
    
    if (ultimateXEnabled && multipliers && Object.keys(multipliers).length > 0) {
      // For Ultimate X: the current hand multiplier doesn't apply to remaining hands
      // Calculate expected value for remaining hands using the multiplier distribution
      
      let totalRemainingCount = 0;
      let remainingMultiplierTotal = 0;

      // Sum up all remaining hands and their multipliers
      for (const [key, count] of Object.entries(multipliers)) {
        const multValue = parseFloat(key.replace('x', ''));
        totalRemainingCount += count;
        remainingMultiplierTotal += count * multValue;
      }

      // Ensure we have exactly the right number of remaining hands
      if (totalRemainingCount !== remainingHands) {
        // Warn user but continue with calculated values
        console.warn(`Multiplier distribution total (${totalRemainingCount}) doesn't match remaining hands (${remainingHands})`);
      }

      // Add contribution from remaining hands with their multipliers
      if (totalRemainingCount > 0) {
        const avgRemainingMultiplier = remainingMultiplierTotal / totalRemainingCount;
        sessionEV += (baseEV * avgRemainingMultiplier * remainingHands);
      }
    } else {
      // No multipliers or disabled, just base session EV
      sessionEV = baseEV * hands;
    }

    const totalBet = credits * hands;
    const totalPayout = sessionEV;  // sessionEV already accounts for multipliers if Ultimate X enabled
    const returnPercent = (totalPayout / totalBet) * 100;
    const expectedProfit = totalPayout - totalBet;  // Net profit (can be negative)

    // Calculate hand probability info
    let handProbabilityInfo = '';
    if (this.paytableEditor && this.currentBestHold) {
      const paytable = this.paytableEditor.currentPaytable;
      const highestHand = this._getBestAchievableHand(paytable);
      if (highestHand) {
        const payout = paytable.payouts[highestHand.category];

        if (typeof payout === 'object') {
          const variants = this._getAchievableHandVariants(highestHand.category)
            .map(name => ({ name, payout: payout[name] || 0 }))
            .sort((a, b) => b.payout - a.payout || a.name.localeCompare(b.name));

          const baseProbability = this._getActualHandProbability(highestHand.category);
          const baseLine = baseProbability > 0
            ? `<div style="margin-top: 4px;">Expected: <strong style="color: #fff;">1 ${highestHand.category}</strong> <strong style="color: #4addff;">${this._formatFrequency(baseProbability)}</strong></div>`
            : '';

          const variantLines = variants
            .map(variant => {
              const probability = this._getActualHandProbability(highestHand.category, variant.name);
              if (probability <= 0) return '';
              const frequencyText = this._formatFrequency(probability);
              return `<div style="margin-top: 4px;">Expected: <strong style="color: #fff;">1 ${variant.name}</strong> <strong style="color: #4addff;">${frequencyText}</strong></div>`;
            })
            .filter(Boolean)
            .join('');

          const allLines = `${baseLine}${variantLines}`;

          if (allLines) {
            const headerLabel = `${highestHand.category} Variants`;
            handProbabilityInfo = `<div style="margin-top: 12px; padding: 10px; background: rgba(100, 180, 220, 0.15); border-radius: 4px; font-size: 11px; border-left: 3px solid #4addff;">
              <strong style="color: #4addff;">📊 Hand Frequency</strong><br/>
              <div style="color: #9ccae0; font-weight: bold; margin-top: 4px;">${headerLabel}</div>
              <span style="color: #ccc;">${allLines}</span>
            </div>`;
          }
        } else {
          // Get actual probability based on optimal hold (with kickers)
          const probability = this._getActualHandProbability(highestHand.category, highestHand.detailedName);
          if (probability > 0) {
            const handName = highestHand.detailedName || highestHand.category;
            const frequencyText = this._formatFrequency(probability);

            handProbabilityInfo = `<div style="margin-top: 12px; padding: 10px; background: rgba(100, 180, 220, 0.15); border-radius: 4px; font-size: 11px; border-left: 3px solid #4addff;">
              <strong style="color: #4addff;">📊 Hand Frequency</strong><br/>
              <span style="color: #ccc;">Expected: <strong style="color: #fff;">1 ${handName}</strong> <strong style="color: #4addff;">${frequencyText}</strong></span>
            </div>`;
          }
        }
      }
    }

    const displayDiv = document.getElementById('sessionCalculatorDisplay');
    if (!displayDiv) return;

    const isPositive = expectedProfit >= 0;
    const color = isPositive ? '#4ade80' : '#ff6666';
    const sign = isPositive ? '+' : '';

    let multiplierInfo = '';
    if (ultimateXEnabled && currentMultiplier > 1) {
      multiplierInfo = `<div style="margin-top: 8px; padding: 8px; background: rgba(100, 150, 100, 0.2); border-radius: 4px; font-size: 11px;">
        <strong style="color: #4ade80;">⚡ Current Hand: ${currentMultiplier}x multiplier</strong>
      </div>`;
    }

    displayDiv.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px;">
        <div>
          <div style="font-size: 12px; color: #aaa;">Total Stake</div>
          <div style="font-size: 18px; color: #fff; font-weight: bold;">${totalBet.toFixed(0)} credits</div>
        </div>
        <div>
          <div style="font-size: 12px; color: #aaa;">Return %</div>
          <div style="font-size: 18px; font-weight: bold; color: ${color};">${returnPercent.toFixed(1)}%</div>
        </div>
      </div>
      <div style="
        background: rgba(0, 0, 0, 0.3);
        border-left: 4px solid ${color};
        padding: 10px;
        border-radius: 4px;
      ">
        <div style="font-size: 12px; color: #aaa; margin-bottom: 4px;">Expected Session Profit</div>
        <div style="font-size: 24px; color: ${color}; font-weight: bold;">${sign}${Math.abs(expectedProfit).toFixed(2)} credits</div>
        <div style="font-size: 11px; color: #aaa; margin-top: 6px;">
          ${isPositive 
            ? `Expect to <span style="color: #4ade80;">gain</span> about <strong>${expectedProfit.toFixed(2)}</strong> credits over ${hands} hands.` 
            : `Expect to <span style="color: #ff6666;">lose</span> about <strong>${Math.abs(expectedProfit).toFixed(2)}</strong> credits over ${hands} hands.`}
        </div>
        ${multiplierInfo}
        ${handProbabilityInfo}
      </div>
    `;
  }

  /**
   * Get the bonus quad category for Double Double Bonus based on ranks
   */
  _getQuadBonusCategory(quadRank, kickerRank) {
    if (quadRank === 12) { // Aces
      if (kickerRank >= 0 && kickerRank <= 2) { // 2-4
        return '4 Aces + 2-4';
      } else {
        return '4 Aces + 5-K';
      }
    } else if (quadRank >= 0 && quadRank <= 2) { // 2-4
      if (kickerRank === 12 || (kickerRank >= 0 && kickerRank <= 2)) { // A or 2-4
        return '4 2-4 + A-4';
      } else {
        return '4 2-4 + 5-K';
      }
    } else { // 5-K
      return '4 5-K';
    }
  }

  /**
   * Get all achievable hand variants (with kickers) from the best hold
   */
  _getAchievableHandVariants(category) {
    if (!this.currentBestHold || !this.combinatorics || !this.evaluator) {
      return [category];
    }

    const heldCards = this.currentBestHold.held;
    const allPossibleDraws = this.combinatorics.generateAllDraws(heldCards);
    const variants = new Set();

    for (const finalHand of allPossibleDraws) {
      const evaluation = this._evaluateHand(finalHand);

      if (evaluation.category === category) {
        // For Four of a Kind with bonus structure, get the detailed name
        if (category === 'Four of a Kind' && this.paytableEditor) {
          const paytable = this.paytableEditor.currentPaytable;
          if (paytable.payouts['Four of a Kind'] && typeof paytable.payouts['Four of a Kind'] === 'object') {
            // This paytable has bonus quad structure (e.g., Double Double Bonus)
            const quadRank = evaluation.kickers[0];
            const kickerRank = evaluation.kickers[1];
            const variant = this._getQuadBonusCategory(quadRank, kickerRank);
            variants.add(variant);
          } else {
            variants.add(category);
          }
        } else {
          variants.add(category);
        }
      }
    }

    return Array.from(variants);
  }

  /**
   * Calculate the actual probability of achieving a specific hand
   * based on the optimal hold (not generic hand probabilities)
   * Can optionally match a specific variant (e.g., "4 Aces + 2-4")
   */
  _getActualHandProbability(targetHandCategory, targetDetail = null) {
    if (!this.currentBestHold || !this.combinatorics || !this.evaluator) {
      return 0;
    }

    const heldCards = this.currentBestHold.held;
    const allPossibleDraws = this.combinatorics.generateAllDraws(heldCards);

    // Count how many draws result in the target hand (with optional detail match)
    let matchCount = 0;
    for (const finalHand of allPossibleDraws) {
      const evaluation = this._evaluateHand(finalHand);
      
      if (evaluation.category === targetHandCategory) {
        // If a specific detail is required (e.g., "4 Aces + 2-4"), check it
        if (targetDetail) {
          if (targetHandCategory === 'Four of a Kind') {
            const paytable = this.paytableEditor?.currentPaytable;
            const fourKindPayout = paytable?.payouts?.['Four of a Kind'];
            const hasBonusVariants = fourKindPayout && typeof fourKindPayout === 'object';

            if (hasBonusVariants) {
              const quadRank = evaluation.kickers[0];
              const kickerRank = evaluation.kickers[1];
              const variant = this._getQuadBonusCategory(quadRank, kickerRank);
              if (variant === targetDetail) {
                matchCount++;
              }
            } else if (targetDetail === targetHandCategory) {
              // Standard paytable: count all four of a kind outcomes
              matchCount++;
            }
          } else {
            // For other hands, if detail matches category, count it
            if (targetDetail === targetHandCategory) {
              matchCount++;
            }
          }
        } else {
          // No specific detail required, just count the category
          matchCount++;
        }
      }
    }

    // Probability = matches / total possible outcomes
    return matchCount / allPossibleDraws.length;
  }

  _formatFrequency(probability) {
    const handsPerOccurrence = 1 / probability;

    if (handsPerOccurrence < 2) {
      return `1 every ${handsPerOccurrence.toFixed(2)} hands`;
    }

    if (handsPerOccurrence < 100) {
      return `1 every ${Math.round(handsPerOccurrence)} hands`;
    }

    return `1 every ${Math.round(handsPerOccurrence).toLocaleString()} hands`;
  }

  /**
   * Determine the best hand that can be achieved from the best hold
   * Takes into account the actual cards held and what's possible to draw
   * Includes kicker details for hands with bonus structures
   */
  _getBestAchievableHand(paytable) {
    if (!this.currentBestHold || !this.combinatorics || !this.evaluator) {
      // Fallback to highest-paying hand if we don't have required info
      return this._getHighestPayingHand(paytable);
    }

    const heldCards = this.currentBestHold.held;
    
    // Generate all possible final hands from this hold
    const allPossibleDraws = this.combinatorics.generateAllDraws(heldCards);
    
    // Evaluate all possible outcomes and find the best hand achievable
    const achievableHands = new Set();
    for (const finalHand of allPossibleDraws) {
      const category = this._getHandCategory(finalHand);
      achievableHands.add(category);
    }

    // Find the best hand that's achievable in the paytable order
    const handOrder = [
      'Royal Flush',             // Natural royal (highest)
      'Four Deuces',             // Deuces Wild special
      'Wild Royal Flush',        // Deuces Wild special
      'Five of a Kind',          // Deuces Wild special
      'Straight Flush',
      'Four of a Kind',
      'Full House',
      'Flush',
      'Straight',
      'Three of a Kind',
      'Two Pair',
      'Pair',
      'High Card'
    ];

    for (const hand of handOrder) {
      if (achievableHands.has(hand)) {
        const payout = paytable.payouts[hand];
        let payoutValue = 0;
        let detailedName = hand;
        
        if (typeof payout === 'object') {
          // Hand has bonus structure - find the best specific variant
          const variants = this._getAchievableHandVariants(hand);
          if (variants.length > 0) {
            let bestVariant = variants[0];
            let bestPayoutValue = payout[bestVariant] || 0;
            
            // Find the variant with the highest payout that's achievable
            for (const variant of variants) {
              const variantPayout = payout[variant] || 0;
              if (variantPayout > bestPayoutValue) {
                bestPayoutValue = variantPayout;
                bestVariant = variant;
              }
            }
            
            detailedName = bestVariant;
            payoutValue = bestPayoutValue;
          }
        } else if (typeof payout === 'number') {
          payoutValue = payout;
        }
        
        return { category: hand, detailedName: detailedName, payout: payoutValue };
      }
    }

    // Fallback
    return { category: 'High Card', detailedName: 'High Card', payout: 0 };
  }

  /**
   * Find the highest-paying hand in the current paytable
   */
  _getHighestPayingHand(paytable) {
    let highest = null;
    let highestValue = -1;

    const handOrder = [
      'Royal Flush',
      'Four Deuces',             // Deuces Wild special
      'Wild Royal Flush',        // Deuces Wild special
      'Five of a Kind',          // Deuces Wild special
      'Straight Flush',
      'Four of a Kind',
      'Full House',
      'Flush',
      'Straight',
      'Three of a Kind',
      'Two Pair',
      'Pair',
      'High Card'
    ];

    // Find the hand with the highest payout
    for (const hand of handOrder) {
      const payout = paytable.payouts[hand];
      
      // Handle complex payout structures (object with sub-payouts)
      if (typeof payout === 'object') {
        // Find the max value in the object and its key (detail name)
        let maxSubPayout = -1;
        let bestVariant = null;
        for (const [key, value] of Object.entries(payout)) {
          if (typeof value === 'number' && value > maxSubPayout) {
            maxSubPayout = value;
            bestVariant = key;
          }
        }
        
        if (maxSubPayout >= 0 && maxSubPayout > highestValue) {
          highestValue = maxSubPayout;
          highest = { category: hand, detailedName: bestVariant || hand, payout: maxSubPayout };
        }
      } else if (typeof payout === 'number' && payout > highestValue) {
        highestValue = payout;
        highest = { category: hand, detailedName: hand, payout: payout };
      }
    }

    return highest;
  }

  displayMultiHandExpectations(evPerHand) {
    this.currentEV = evPerHand;
    this.hasSetEV = true;
    
    // Create the session calculator if it doesn't exist
    if (!document.getElementById('sessionCalculatorDisplay')) {
      this.displaySessionCalculator();
    }
    
    this.updateSessionCalculator();
  }

  hide() {
    this.container.innerHTML = '';
    this.hidden = true;
  }
}
