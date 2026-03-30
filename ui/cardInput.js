/**
 * Card Input Component
 * Provides a 52-card grid to select exactly 5 cards
 */

class CardInput {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.selectedCards = [];
    this.maxCards = 5;
    
    // Multiplier configuration for Ultimate X - all default to 0
    this.multipliers = {};  // multiplier: count (empty by default)
    this.currentMultiplier = 1;  // multiplier value for this hand
    this.ultimateXEnabled = false;  // Toggle for Ultimate X
    this.onStateChange = null;
    
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    
    // Collapsible header
    const header = document.createElement('div');
    header.className = 'section-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Select 5 Cards to Analyze';
    title.className = 'card-input-title';
    
    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'collapse-icon';
    collapseIcon.textContent = '▼';
    
    header.appendChild(title);
    header.appendChild(collapseIcon);
    this.container.appendChild(header);

    // Collapsible content (expanded by default)
    const content = document.createElement('div');
    content.className = 'section-content';
    
    // Toggle collapse on header click
    header.onclick = () => {
      content.classList.toggle('collapsed');
      collapseIcon.classList.toggle('collapsed');
    };

    // Subtitle/Instructions
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Click 5 cards from any suit to analyze all possible holds and their expected values';
    subtitle.className = 'card-input-subtitle';
    content.appendChild(subtitle);

    // Betting Configuration
    const bettingDiv = document.createElement('div');
    bettingDiv.style.cssText = `
      background: rgba(74, 170, 170, 0.15);
      border: 2px solid rgba(74, 170, 170, 0.4);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    `;

    const handsLabel = document.createElement('label');
    handsLabel.style.cssText = 'display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #aaa;';
    handsLabel.innerHTML = `
      <span>Hands to Play</span>
      <input type="number" id="bettingHands" min="1" max="1000" value="1" 
        style="padding: 6px; border: 1px solid #5a9aba; border-radius: 4px; background: #1a2a3a; color: #fff; font-size: 14px;" />
    `;
    
    // Add listener to update counter when hands value changes
    bettingDiv.appendChild(handsLabel);
    setTimeout(() => {
      const handsInput = document.getElementById('bettingHands');
      if (handsInput) {
        handsInput.addEventListener('change', () => {
          this.updateHandsCounterDisplay();
          this.triggerStateChange();
        });
      }
    }, 0);

    const creditsLabel = document.createElement('label');
    creditsLabel.setAttribute('for', 'bettingCredits');
    creditsLabel.style.cssText = 'display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #aaa;';
    creditsLabel.innerHTML = `
      <span>Credits Per Hand ${this.ultimateXEnabled ? '<span style="color: #4ade80;">(Fixed at 10 for Ultimate X)</span>' : ''}</span>
      <input type="number" id="bettingCredits" min="1" max="1000" step="0.25" value="${this.ultimateXEnabled ? '10' : '5'}" 
        ${this.ultimateXEnabled ? 'disabled style="padding: 6px; border: 1px solid #5a9aba; border-radius: 4px; background: #1a2a3a; color: #fff; font-size: 14px; opacity: 0.6; cursor: not-allowed;"' : 'style="padding: 6px; border: 1px solid #5a9aba; border-radius: 4px; background: #1a2a3a; color: #fff; font-size: 14px;"'} />
    `;
    bettingDiv.appendChild(creditsLabel);

    content.appendChild(bettingDiv);

    // Ultimate X Toggle
    const ultimateXToggleDiv = document.createElement('div');
    ultimateXToggleDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 10px;
      background: rgba(100, 100, 100, 0.15);
      border-radius: 6px;
    `;

    const toggleCheckbox = document.createElement('input');
    toggleCheckbox.type = 'checkbox';
    toggleCheckbox.id = 'ultimateXToggle';
    toggleCheckbox.checked = this.ultimateXEnabled;
    toggleCheckbox.style.cssText = 'cursor: pointer; width: 18px; height: 18px;';
    toggleCheckbox.onchange = (e) => {
      this.ultimateXEnabled = e.target.checked;
      // Show/hide the multiplier section
      const multiplierSection = document.getElementById('ultimateXSection');
      if (multiplierSection) {
        multiplierSection.style.display = this.ultimateXEnabled ? 'block' : 'none';
      }
      
      // Update credits per hand based on Ultimate X status
      const creditsInput = document.getElementById('bettingCredits');
      const creditsLabelSpan = document.querySelector('label[for="bettingCredits"] > span');
      
      if (creditsInput) {
        if (this.ultimateXEnabled) {
          // Ultimate X requires 10 credits per hand (2x the base bet)
          creditsInput.value = 10;
          creditsInput.disabled = true;
          creditsInput.style.opacity = '0.6';
          creditsInput.style.cursor = 'not-allowed';
          
          // Update label
          if (creditsLabelSpan) {
            creditsLabelSpan.innerHTML = 'Credits Per Hand <span style="color: #4ade80;">(Fixed at 10 for Ultimate X)</span>';
          }
        } else {
          // Normal mode - allow custom credits
          creditsInput.value = 5;
          creditsInput.disabled = false;
          creditsInput.style.opacity = '1';
          creditsInput.style.cursor = '';
          
          // Update label
          if (creditsLabelSpan) {
            creditsLabelSpan.textContent = 'Credits Per Hand';
          }
        }
      }

      this.triggerStateChange();
    };

    const toggleLabel = document.createElement('label');
    toggleLabel.htmlFor = 'ultimateXToggle';
    toggleLabel.style.cssText = 'cursor: pointer; color: #4ade80; font-weight: bold; margin: 0;';
    toggleLabel.innerHTML = '⚡ Use Ultimate X Multipliers <span style="font-size: 11px; font-weight: normal; color: #aaa;">(10 credits/hand)</span>';

    ultimateXToggleDiv.appendChild(toggleCheckbox);
    ultimateXToggleDiv.appendChild(toggleLabel);
    content.appendChild(ultimateXToggleDiv);

    // Ultimate X Multiplier Configuration
    const multiplierDiv = document.createElement('div');
    multiplierDiv.id = 'ultimateXSection';
    multiplierDiv.style.cssText = `
      background: rgba(100, 150, 100, 0.15);
      border: 2px solid rgba(100, 150, 100, 0.4);
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 16px;
      display: ${this.ultimateXEnabled ? 'block' : 'none'};
    `;

    const multiplierTitle = document.createElement('div');
    multiplierTitle.style.cssText = 'font-weight: bold; color: #aaa; margin-bottom: 10px; font-size: 14px;';
    multiplierTitle.textContent = 'Ultimate X Multiplier Setup';
    multiplierDiv.appendChild(multiplierTitle);

    // Current hand multiplier selector
    const currentMultiplierLabel = document.createElement('label');
    currentMultiplierLabel.style.cssText = 'display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #aaa; margin-bottom: 12px;';
    currentMultiplierLabel.innerHTML = `
      <span>Base Hand's Multiplier (does not apply to other hands)</span>
      <select id="currentMultiplier" style="padding: 8px; border: 1px solid #5a9aba; border-radius: 4px; background: #1a2a3a; color: #fff; font-size: 13px;">
        <option value="1" selected>1x</option>
        <option value="2">2x</option>
        <option value="3">3x</option>
        <option value="4">4x</option>
        <option value="5">5x</option>
        <option value="6">6x</option>
        <option value="7">7x</option>
        <option value="8">8x</option>
        <option value="9">9x</option>
        <option value="10">10x</option>
        <option value="11">11x</option>
        <option value="12">12x</option>
      </select>
    `;
    multiplierDiv.appendChild(currentMultiplierLabel);

    setTimeout(() => {
      const currentMultiplierSelect = document.getElementById('currentMultiplier');
      if (currentMultiplierSelect) {
        currentMultiplierSelect.value = String(this.currentMultiplier || 1);
        currentMultiplierSelect.addEventListener('change', (e) => {
          this.currentMultiplier = parseInt(e.target.value) || 1;
          this.triggerStateChange();
        });
      }
    }, 0);

    // Remaining hands multiplier grid
    const gridLabel = document.createElement('div');
    gridLabel.style.cssText = 'font-weight: 600; color: #aaa; margin-bottom: 8px; font-size: 13px;';
    gridLabel.textContent = 'Remaining Hands - Enter Count for Each Multiplier';
    multiplierDiv.appendChild(gridLabel);

    const multiplierGridDiv = document.createElement('div');
    multiplierGridDiv.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    `;

    // Create input fields for 1x through 12x
    const multiplierInputs = {};
    for (let mult = 1; mult <= 12; mult++) {
      const label = document.createElement('label');
      label.style.cssText = 'display: flex; flex-direction: column; gap: 4px; font-size: 12px;';
      
      const labelText = document.createElement('span');
      labelText.textContent = `${mult}x`;
      labelText.style.cssText = 'color: #aaa;';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.id = `multiplier_${mult}x`;
      input.min = '0';
      input.value = this.multipliers[`${mult}x`] || 0;
      input.style.cssText = 'padding: 6px; border: 1px solid #5a9aba; border-radius: 4px; background: #1a2a3a; color: #fff; font-size: 12px; text-align: center;';
      
      // Add real-time counter update
      input.oninput = () => {
        this.updateHandsCounterDisplay();
        this.triggerStateChange();
      };
      
      multiplierInputs[`${mult}x`] = input;
      
      label.appendChild(labelText);
      label.appendChild(input);
      multiplierGridDiv.appendChild(label);
    }

    multiplierDiv.appendChild(multiplierGridDiv);

    // Total hands counter
    const totalDiv = document.createElement('div');
    totalDiv.id = 'handsCounterDisplay';
    totalDiv.style.cssText = `
      background: rgba(74, 221, 255, 0.1);
      border: 1px solid rgba(74, 221, 255, 0.3);
      border-radius: 4px;
      padding: 10px;
      margin: 12px 0;
      font-size: 13px;
      color: #aaa;
      text-align: center;
      font-weight: 500;
    `;
    totalDiv.innerHTML = '1 (base hand) + 0 (remaining) = 1 (total)';
    multiplierDiv.appendChild(totalDiv);

    // Update button
    const updateMultBtn = document.createElement('button');
    updateMultBtn.textContent = 'Update Multipliers';
    updateMultBtn.className = 'btn btn-secondary';
    updateMultBtn.style.cssText = 'margin-top: 12px; width: 100%;';
    updateMultBtn.onclick = () => this.updateMultipliersFromGrid(multiplierInputs);
    multiplierDiv.appendChild(updateMultBtn);

    content.appendChild(multiplierDiv);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'card-input-controls';
    
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Clear All';
    resetBtn.className = 'btn btn-secondary';
    resetBtn.onclick = () => this.clear();
    
    const analyzeBtn = document.createElement('button');
    analyzeBtn.textContent = 'Analyze Hand';
    analyzeBtn.className = 'btn btn-primary';
    analyzeBtn.id = 'analyzeBtn';
    analyzeBtn.disabled = true;
    analyzeBtn.onclick = () => this.onAnalyze();
    
    controls.appendChild(resetBtn);
    controls.appendChild(analyzeBtn);
    content.appendChild(controls);

    // Mobile Action Bar (fixed at bottom on mobile)
    let mobileActionBar = document.getElementById('mobileActionBar');
    if (!mobileActionBar) {
      mobileActionBar = document.createElement('div');
      mobileActionBar.id = 'mobileActionBar';
      mobileActionBar.className = 'mobile-action-bar';
      
      const mobileResetBtn = document.createElement('button');
      mobileResetBtn.textContent = 'Clear All';
      mobileResetBtn.className = 'btn btn-secondary';
      mobileResetBtn.onclick = () => this.clear();
      
      const mobileAnalyzeBtn = document.createElement('button');
      mobileAnalyzeBtn.textContent = 'Analyze Hand';
      mobileAnalyzeBtn.className = 'btn btn-primary';
      mobileAnalyzeBtn.id = 'mobileAnalyzeBtn';
      mobileAnalyzeBtn.disabled = true;
      mobileAnalyzeBtn.onclick = () => this.onAnalyze();
      
      mobileActionBar.appendChild(mobileResetBtn);
      mobileActionBar.appendChild(mobileAnalyzeBtn);
      document.body.appendChild(mobileActionBar);
    }

    // Mobile selected cards bar (fixed above mobile action bar)
    let mobileSelectedBar = document.getElementById('mobileSelectedCardsBar');
    if (!mobileSelectedBar) {
      mobileSelectedBar = document.createElement('div');
      mobileSelectedBar.id = 'mobileSelectedCardsBar';
      mobileSelectedBar.className = 'mobile-selected-cards-bar';

      const mobileSelectedContent = document.createElement('div');
      mobileSelectedContent.id = 'mobileSelectedCardsDisplay';
      mobileSelectedContent.className = 'mobile-selected-cards-display';
      mobileSelectedContent.textContent = 'No cards selected';

      mobileSelectedBar.appendChild(mobileSelectedContent);
      document.body.appendChild(mobileSelectedBar);
    }

    // Selected cards display
    const selectedDiv = document.createElement('div');
    selectedDiv.className = 'selected-cards-display';
    selectedDiv.id = 'selectedCardsDisplay';
    selectedDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No cards selected</p>';
    content.appendChild(selectedDiv);

    // Card grid
    const gridDiv = document.createElement('div');
    gridDiv.className = 'card-grid';
    
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suitLabels = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };

    for (const suit of suits) {
      const suitSection = document.createElement('div');
      const suitClass = suit === 'H' ? 'suit-hearts' : 
                       suit === 'D' ? 'suit-diamonds' : 
                       suit === 'C' ? 'suit-clubs' : 'suit-spades';
      suitSection.className = `card-suit-section ${suitClass}`;
      
      const suitLabel = document.createElement('div');
      suitLabel.className = 'suit-label';
      suitLabel.innerHTML = suitLabels[suit];
      suitLabel.style.color = (suit === 'H' || suit === 'D') ? '#cf203a' : '#111827';
      suitSection.appendChild(suitLabel);

      for (const rank of ranks) {
        const card = rank + suit;
        const btn = document.createElement('button');
        btn.textContent = rank;
        btn.className = 'card-btn';
        if (this.selectedCards.includes(card)) {
          btn.classList.add('selected');
        }
        btn.dataset.card = card;
        btn.onclick = () => this.toggleCard(card, btn);
        suitSection.appendChild(btn);
      }

      gridDiv.appendChild(suitSection);
    }

    content.appendChild(gridDiv);
    this.container.appendChild(content);

    this.updateDisplay();
    this.updateHandsCounterDisplay();
  }

  parseAndSetMultipliers() {
    const input = document.getElementById('multiplierInput')?.value || '';
    try {
      this.multipliers = {};
      const pairs = input.split(',');
      
      for (const pair of pairs) {
        const [mult, count] = pair.trim().split(':');
        const multiplierValue = parseFloat(mult.replace('x', ''));
        const countValue = parseInt(count.trim());
        
        if (isNaN(multiplierValue) || isNaN(countValue) || countValue < 0) {
          throw new Error('Invalid format');
        }
        
        this.multipliers[mult.trim()] = countValue;
      }

      // Update the current multiplier dropdown options
      const selectEl = document.getElementById('currentMultiplier');
      const currentValue = selectEl?.value;
      selectEl.innerHTML = '';
      
      for (const key of Object.keys(this.multipliers)) {
        const option = document.createElement('option');
        option.value = parseFloat(key.replace('x', ''));
        option.textContent = key;
        selectEl.appendChild(option);
      }
      
      // Restore previous selection or default to first
      if (selectEl.querySelector(`option[value="${currentValue}"]`)) {
        selectEl.value = currentValue;
      } else {
        selectEl.value = Object.keys(this.multipliers)[0].replace('x', '');
      }
      
    } catch (e) {
      alert('Invalid format. Use: 1x: 5, 8x: 3, 2x: 2');
    }
  }

  toggleCard(card, btnElement) {
    const idx = this.selectedCards.indexOf(card);

    if (idx >= 0) {
      // Deselect
      this.selectedCards.splice(idx, 1);
      btnElement.classList.remove('selected');
    } else {
      // Select
      if (this.selectedCards.length < this.maxCards) {
        this.selectedCards.push(card);
        btnElement.classList.add('selected');
      } else {
        // Max reached - show feedback
        this.showFeedback('Maximum 5 cards selected');
        return;
      }
    }

    this.updateDisplay();
    this.triggerStateChange();
  }

  updateDisplay() {
    const display = document.getElementById('selectedCardsDisplay');
    const mobileDisplay = document.getElementById('mobileSelectedCardsDisplay');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const mobileAnalyzeBtn = document.getElementById('mobileAnalyzeBtn');

    if (this.selectedCards.length === 0) {
      display.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No cards selected</p>';
      if (mobileDisplay) {
        mobileDisplay.innerHTML = '<span style="color: var(--text-secondary);">No cards selected</span>';
      }
      analyzeBtn.disabled = true;
      if (mobileAnalyzeBtn) mobileAnalyzeBtn.disabled = true;
    } else {
      const cardDisplay = this.selectedCards.map(card => {
        const suit = card[1];
        const suitSymbol = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' }[suit];
        const color = (suit === 'H' || suit === 'D') ? '#ff4d5e' : '#f5f8fc';
        return `<span class="selected-card" style="color: ${color}; font-weight: bold;">${card[0]}${suitSymbol}</span>`;
      }).join(' ');

      display.innerHTML = `<div style="text-align: center; font-size: 18px; letter-spacing: 8px;">${cardDisplay}</div>`;
      if (mobileDisplay) {
        mobileDisplay.innerHTML = `<div style="text-align: center; font-size: 16px; letter-spacing: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cardDisplay}</div>`;
      }

      if (this.selectedCards.length === this.maxCards) {
        analyzeBtn.disabled = false;
        if (mobileAnalyzeBtn) mobileAnalyzeBtn.disabled = false;
      } else {
        analyzeBtn.disabled = true;
        if (mobileAnalyzeBtn) mobileAnalyzeBtn.disabled = true;
      }
    }
  }

  clear() {
    this.selectedCards = [];
    document.querySelectorAll('.card-btn.selected').forEach(btn => {
      btn.classList.remove('selected');
    });

    this.updateDisplay();
    this.triggerStateChange();
  }

  getSelectedCards() {
    return [...this.selectedCards];
  }

  getSettings() {
    const hands = parseInt(document.getElementById('bettingHands')?.value) || 1;
    let credits = parseFloat(document.getElementById('bettingCredits')?.value) || 5;
    
    // Ultimate X always uses 10 credits per hand (double the base bet)
    if (this.ultimateXEnabled) {
      credits = 10;
    }
    
    const currentMultiplier = parseInt(document.getElementById('currentMultiplier')?.value) || this.currentMultiplier || 1;
    
    // Get multiplier distribution
    const multipliers = {};
    if (this.ultimateXEnabled) {
      for (let mult = 1; mult <= 12; mult++) {
        const count = parseInt(document.getElementById(`multiplier_${mult}x`)?.value) || 0;
        if (count > 0) {
          multipliers[`${mult}x`] = count;
        }
      }
    }
    
    return { 
      hands, 
      credits,
      currentMultiplier,
      multipliers,
      ultimateXEnabled: this.ultimateXEnabled
    };
  }

  updateMultipliersFromGrid(multiplierInputs) {
    // Update from grid inputs
    const multipliers = {};
    let totalCount = 0;
    
    for (let mult = 1; mult <= 12; mult++) {
      const count = parseInt(multiplierInputs[`${mult}x`].value) || 0;
      if (count > 0) {
        multipliers[`${mult}x`] = count;
        totalCount += count;
      }
    }
    
    this.multipliers = multipliers;
    
    // Show feedback
    if (totalCount > 0) {
      this.showFeedback(`Updated: ${totalCount} hands across ${Object.keys(multipliers).length} multiplier levels`);
    }

    this.triggerStateChange();
  }

  updateHandsCounterDisplay() {
    // Calculate total remaining hands from grid inputs
    let remainingHands = 0;
    
    for (let mult = 1; mult <= 12; mult++) {
      const count = parseInt(document.getElementById(`multiplier_${mult}x`)?.value) || 0;
      remainingHands += count;
    }
    
    const totalHands = 1 + remainingHands;  // 1 base hand + remaining
    const handsConfigured = parseInt(document.getElementById('bettingHands')?.value) || 1;
    
    // Update display
    const display = document.getElementById('handsCounterDisplay');
    if (display) {
      const warningColor = totalHands !== handsConfigured ? '#ff9999' : '#aaa';
      const warningText = totalHands !== handsConfigured ? 
        ` ⚠️ Expected ${handsConfigured}` : '';
      
      display.innerHTML = `1 (base hand) + ${remainingHands} (remaining) = ${totalHands} (total)${warningText}`;
      display.style.color = warningColor;
    }
  }

  setOnAnalyze(callback) {
    this.onAnalyze = callback;
  }

  setOnChange(callback) {
    this.onStateChange = callback;
  }

  triggerStateChange() {
    if (this.onStateChange) {
      this.onStateChange({
        selectedCards: this.getSelectedCards(),
        settings: this.getSettings()
      });
    }
  }

  setState(state = {}) {
    const selectedCards = Array.isArray(state.selectedCards) ? state.selectedCards : [];
    this.selectedCards = selectedCards
      .filter(card => typeof card === 'string' && /^[AKQJT98765432][HDCS]$/.test(card))
      .slice(0, this.maxCards);

    const settings = state.settings || {};

    this.ultimateXEnabled = !!settings.ultimateXEnabled;
    this.currentMultiplier = Math.min(12, Math.max(1, parseInt(settings.currentMultiplier) || 1));

    if (this.ultimateXEnabled) {
      this.multipliers = {};
      const savedMultipliers = settings.multipliers || {};
      for (let mult = 1; mult <= 12; mult++) {
        const key = `${mult}x`;
        const count = parseInt(savedMultipliers[key]) || 0;
        if (count > 0) {
          this.multipliers[key] = count;
        }
      }
    } else {
      this.multipliers = {};
    }

    this.render();

    const handsInput = document.getElementById('bettingHands');
    if (handsInput && Number.isFinite(Number(settings.hands)) && Number(settings.hands) > 0) {
      handsInput.value = String(Math.floor(Number(settings.hands)));
    }

    const creditsInput = document.getElementById('bettingCredits');
    if (creditsInput) {
      if (this.ultimateXEnabled) {
        creditsInput.value = '10';
      } else if (Number.isFinite(Number(settings.credits)) && Number(settings.credits) > 0) {
        creditsInput.value = String(Number(settings.credits));
      }
    }

    const ultimateXToggle = document.getElementById('ultimateXToggle');
    if (ultimateXToggle) {
      ultimateXToggle.checked = this.ultimateXEnabled;
    }

    const ultimateXSection = document.getElementById('ultimateXSection');
    if (ultimateXSection) {
      ultimateXSection.style.display = this.ultimateXEnabled ? 'block' : 'none';
    }

    const currentMultiplierSelect = document.getElementById('currentMultiplier');
    if (currentMultiplierSelect) {
      currentMultiplierSelect.value = String(this.currentMultiplier);
    }

    this.updateDisplay();
    this.updateHandsCounterDisplay();
  }

  showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 2000);
  }
}
