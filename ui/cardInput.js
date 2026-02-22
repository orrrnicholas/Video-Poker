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
    
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Select 5 Cards to Analyze';
    title.className = 'card-input-title';
    this.container.appendChild(title);

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
    this.container.appendChild(controls);

    // Selected cards display
    const selectedDiv = document.createElement('div');
    selectedDiv.className = 'selected-cards-display';
    selectedDiv.id = 'selectedCardsDisplay';
    selectedDiv.innerHTML = '<p style="text-align: center; color: #888;">No cards selected</p>';
    this.container.appendChild(selectedDiv);

    // Card grid
    const gridDiv = document.createElement('div');
    gridDiv.className = 'card-grid';
    
    const suits = ['H', 'D', 'C', 'S'];
    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suitLabels = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' };

    for (const suit of suits) {
      const suitSection = document.createElement('div');
      suitSection.className = 'card-suit-section';
      
      const suitLabel = document.createElement('div');
      suitLabel.className = 'suit-label';
      suitLabel.innerHTML = suitLabels[suit];
      suitLabel.style.color = (suit === 'H' || suit === 'D') ? '#ff4444' : '#000';
      suitSection.appendChild(suitLabel);

      for (const rank of ranks) {
        const card = rank + suit;
        const btn = document.createElement('button');
        btn.textContent = rank;
        btn.className = 'card-btn';
        btn.dataset.card = card;
        btn.onclick = () => this.toggleCard(card, btn);
        suitSection.appendChild(btn);
      }

      gridDiv.appendChild(suitSection);
    }

    this.container.appendChild(gridDiv);
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
  }

  updateDisplay() {
    const display = document.getElementById('selectedCardsDisplay');
    const analyzeBtn = document.getElementById('analyzeBtn');

    if (this.selectedCards.length === 0) {
      display.innerHTML = '<p style="text-align: center; color: #888;">No cards selected</p>';
      analyzeBtn.disabled = true;
    } else {
      const cardDisplay = this.selectedCards.map(card => {
        const suit = card[1];
        const suitSymbol = { 'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠' }[suit];
        const color = (suit === 'H' || suit === 'D') ? '#ff4444' : '#000';
        return `<span class="selected-card" style="color: ${color}; font-weight: bold;">${card[0]}${suitSymbol}</span>`;
      }).join(' ');

      display.innerHTML = `<div style="text-align: center; font-size: 18px; letter-spacing: 8px;">${cardDisplay}</div>`;
      analyzeBtn.disabled = this.selectedCards.length !== 5;
    }
  }

  clear() {
    this.selectedCards = [];
    this.render();
  }

  getSelectedCards() {
    return [...this.selectedCards];
  }

  setOnAnalyze(callback) {
    this.onAnalyze = callback;
  }

  showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 2000);
  }
}
