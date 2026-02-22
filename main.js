/**
 * Main Application
 * Orchestrates all UI components and business logic
 */

class CardEVAnalyzer {
  constructor() {
    // Initialize core engines
    this.evaluator = new HandEvaluator();
    this.combinatorics = new Combinatorics();
    this.evCalculator = new EVCalculator(this.evaluator, this.combinatorics);

    // Initialize UI components
    this.cardInput = new CardInput('card-input-container');
    this.paytableEditor = new PaytableEditor('paytable-container');
    this.resultsView = new ResultsView('results-container');
    this.houseEdgeView = new HouseEdgeView('house-edge-container');

    // Setup handlers
    this.setupHandlers();

    // Load saved paytable if available
    this.loadSavedState();

    // Initialize with default paytable
    this.houseEdgeView.setEVCalculator(this.evCalculator);
  }

  setupHandlers() {
    // Card input analysis
    this.cardInput.setOnAnalyze(() => this.analyzeHand());

    // Paytable changes
    this.paytableEditor.setOnChange((paytable) => {
      this.evCalculator.setPaytable(paytable);
      this.saveState();
      // Re-analyze if hand is currently displayed
      if (!this.resultsView.hidden && this.cardInput.selectedCards.length === 5) {
        this.analyzeHand();
      }
    });
  }

  analyzeHand() {
    const hand = this.cardInput.getSelectedCards();
    if (hand.length !== 5) {
      alert('Please select exactly 5 cards');
      return;
    }

    // Analyze all holds
    const analyses = this.evCalculator.analyzeAllHolds(hand);

    // Display results
    this.resultsView.display(hand, analyses);

    // Save state
    this.saveState();
  }

  saveState() {
    const state = {
      selectedCards: this.cardInput.selectedCards,
      paytable: this.paytableEditor.getPaytable(),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cardEVAnalyzerState', JSON.stringify(state));
  }

  loadSavedState() {
    const saved = localStorage.getItem('cardEVAnalyzerState');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.paytable) {
          this.paytableEditor.setPaytable(state.paytable);
          this.evCalculator.setPaytable(state.paytable);
        }
      } catch (e) {
        console.log('Could not load saved state:', e);
      }
    }
  }

  switchTab(tabName) {
    // Hide all containers
    document.getElementById('card-input-container').style.display = 'none';
    document.getElementById('paytable-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'none';
    document.getElementById('house-edge-container').style.display = 'none';

    // Show selected tab
    if (tabName === 'analyzer') {
      document.getElementById('card-input-container').style.display = 'block';
      document.getElementById('paytable-container').style.display = 'block';
      document.getElementById('results-container').style.display = 'block';
    } else if (tabName === 'houseEdge') {
      document.getElementById('house-edge-container').style.display = 'block';
      this.houseEdgeView.render();
    }

    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    event.target.classList.add('active');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CardEVAnalyzer();

  // Make app accessible for debugging
  window.app = app;
  window.evaluator = app.evaluator;
  window.evCalculator = app.evCalculator;
});
