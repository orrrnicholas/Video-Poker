/**
 * Main Application
 * Orchestrates all UI components and business logic
 */

class CardEVAnalyzer {
  constructor() {
    this.storageKey = 'cardEVAnalyzerState';

    // Initialize core engines
    this.evaluator = new HandEvaluator();
    this.combinatorics = new Combinatorics();
    this.evCalculator = new EVCalculator(this.evaluator, this.combinatorics);

    console.log('✓ Core engines initialized');

    // Initialize UI components
    try {
      this.gameSelector = new GameSelector('game-selector-container', this.evCalculator);
      console.log('✓ GameSelector created');
    } catch(e) {
      console.error('✗ GameSelector error:', e);
    }

    try {
      this.cardInput = new CardInput('card-input-container');
      console.log('✓ CardInput created');
    } catch(e) {
      console.error('✗ CardInput error:', e);
    }

    try {
      this.paytableEditor = new PaytableEditor('paytable-container');
      console.log('✓ PaytableEditor created');
    } catch(e) {
      console.error('✗ PaytableEditor error:', e);
    }

    try {
      this.resultsView = new ResultsView('results-container', this.cardInput, this.paytableEditor, this.evaluator, this.combinatorics);
      console.log('✓ ResultsView created');
    } catch(e) {
      console.error('✗ ResultsView error:', e);
    }

    // Setup handlers
    this.setupHandlers();
    console.log('✓ Handlers setup');

    // Auto-select first game after callback is set up
    this.gameSelector.selectGame('jacks');
    console.log('✓ Game auto-selected');

    // Load saved paytable if available
    this.loadSavedState();
    console.log('✓ State loaded');

    console.log('✓ App initialization complete');
  }

  setupHandlers() {
    // Game selection
    this.gameSelector.setOnGameSelect((gameName) => {
      // Find and select the corresponding paytable
      const presets = EVCalculator.getPresetPaytables();
      const paytable = presets.find(p => p.name === gameName);
      if (paytable) {
        this.paytableEditor.setPaytable(paytable);
        this.evCalculator.setPaytable(paytable);
        this.saveState();
        
        // Reset RTP to default when switching to a preset game
        const selectedGame = this.gameSelector.getSelectedGame();
        if (selectedGame) {
          this.gameSelector.resetGameRTP(selectedGame);
        }
        
        // Re-analyze if hand is currently displayed
        if (!this.resultsView.hidden && this.cardInput.selectedCards.length === 5) {
          this.analyzeHand();
        }
      }
    });

    // Card input analysis
    this.cardInput.setOnAnalyze(() => this.analyzeHand());

    // Card input state changes
    this.cardInput.setOnChange(() => {
      this.saveState();
    });

    // Paytable changes
    this.paytableEditor.setOnChange((paytable) => {
      this.evCalculator.setPaytable(paytable);
      this.saveState();
      
      // Mark the game as modified (don't calculate RTP to avoid freezing)
      const selectedGame = this.gameSelector.getSelectedGame();
      if (selectedGame) {
        this.gameSelector.updateGameRTP(selectedGame, null, true);
      }
      
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

    // Show loading overlay
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingProgress = document.getElementById('loadingProgress');
    const workload = this.evCalculator.getAnalysisWorkload(hand);

    if (loadingProgress) {
      loadingProgress.textContent = `Analyzing ${workload.totalOutcomeEvaluations.toLocaleString()} outcomes across ${workload.totalHolds} holds...`;
    }

    if (loadingOverlay) {
      loadingOverlay.classList.add('active');
    }

    // Defer analysis to allow UI to update
    setTimeout(() => {
      try {
        if (loadingProgress) {
          loadingProgress.textContent = 'Applying game settings...';
        }

        // Get Ultimate X settings and update EV calculator
        const settings = this.cardInput.getSettings();
        this.evCalculator.setUltimateXSettings(settings.ultimateXEnabled, settings.credits);

        if (loadingProgress) {
          loadingProgress.textContent = `Analyzing ${workload.totalOutcomeEvaluations.toLocaleString()} outcomes across ${workload.totalHolds} holds...`;
        }
        
        // Analyze all holds
        const analyses = this.evCalculator.analyzeAllHolds(hand);

        if (loadingProgress) {
          loadingProgress.textContent = 'Rendering results...';
        }

        // Display results
        this.resultsView.display(hand, analyses);

        // Save state
        this.saveState();
      } finally {
        // Hide loading overlay
        if (loadingOverlay) {
          loadingOverlay.classList.remove('active');
        }
        
        // Focus on session expected return after analysis completes
        setTimeout(() => {
          const sessionCalc = document.getElementById('sessionCalculatorDisplay');
          if (sessionCalc) {
            sessionCalc.scrollIntoView({ behavior: 'smooth', block: 'start' });
            sessionCalc.focus({ preventScroll: true });
          }
        }, 100);
      }
    }, 100);
  }

  saveState() {
    const state = {
      selectedGame: this.gameSelector.getSelectedGame(),
      selectedCards: this.cardInput.getSelectedCards(),
      cardSettings: this.cardInput.getSettings(),
      paytable: this.paytableEditor.getPaytable(),
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.log('Could not save state:', e);
    }
  }

  loadSavedState() {
    let saved = null;

    try {
      saved = localStorage.getItem(this.storageKey);
    } catch (e) {
      console.log('Could not access saved state:', e);
      return;
    }

    if (saved) {
      try {
        const state = JSON.parse(saved);

        if (state.selectedGame) {
          this.gameSelector.selectGame(state.selectedGame);
        }

        if (state.paytable) {
          this.paytableEditor.setPaytable(state.paytable);
          this.evCalculator.setPaytable(state.paytable);

          // Loaded paytable is user-customized relative to the selected preset.
          const selectedGame = this.gameSelector.getSelectedGame();
          if (selectedGame) {
            this.gameSelector.updateGameRTP(selectedGame, null, true);
          }
        }

        this.cardInput.setState({
          selectedCards: state.selectedCards,
          settings: state.cardSettings
        });

        if (this.cardInput.selectedCards.length === 5) {
          this.analyzeHand();
        }
      } catch (e) {
        console.log('Could not load saved state:', e);
      }
    }
  }

  switchTab(tabName) {
    // Tab switching no longer needed - only Analyzer view exists
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
