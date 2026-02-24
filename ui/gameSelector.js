/**
 * Game Selector Component
 * Allows users to select poker game variants with organized categories
 */

class GameSelector {
  constructor(containerId, evCalculator = null) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.onGameSelect = null;
    this.selectedGame = null;
    this.evCalculator = evCalculator;

    // Game definitions organized by category
    // RTP values are for default paytables
    this.games = {
      'Classic Games': [
        { id: 'jacks', name: 'Jacks or Better', rtp: '99.54%', defaultRtp: '99.54%', modified: false },
        { id: 'deuces', name: 'Deuces Wild', rtp: '100.76%', defaultRtp: '100.76%', modified: false }
      ],
      'Bonus Games': [
        { id: 'double-bonus', name: 'Double Double Bonus', rtp: '98.98%', defaultRtp: '98.98%', modified: false },
        { id: 'triple-double-bonus', name: 'Triple Double Bonus', rtp: '99.58%', defaultRtp: '99.58%', modified: false }
      ]
    };

    this.render();
  }

  render() {
    this.container.innerHTML = '';

    // Collapsible header
    const header = document.createElement('div');
    header.className = 'section-header';
    
    const title = document.createElement('h2');
    title.textContent = 'Select Game';
    title.className = 'game-selector-title';
    
    const collapseIcon = document.createElement('span');
    collapseIcon.className = 'collapse-icon';
    collapseIcon.textContent = '▼';
    
    header.appendChild(title);
    header.appendChild(collapseIcon);
    this.container.appendChild(header);

    // Collapsible content
    const content = document.createElement('div');
    content.className = 'section-content';
    
    // Toggle collapse on header click
    header.onclick = () => {
      content.classList.toggle('collapsed');
      collapseIcon.classList.toggle('collapsed');
    };

    // Category sections
    for (const [category, games] of Object.entries(this.games)) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'game-category';

      // Category label
      const categoryLabel = document.createElement('div');
      categoryLabel.className = 'game-category-label';
      categoryLabel.textContent = category;
      categoryDiv.appendChild(categoryLabel);

      // Games grid
      const gamesGrid = document.createElement('div');
      gamesGrid.className = 'games-grid';

      for (const game of games) {
        const gameBtn = document.createElement('button');
        gameBtn.className = 'game-btn';
        gameBtn.dataset.gameId = game.id;

        const gameName = document.createElement('div');
        gameName.className = 'game-name';
        gameName.textContent = game.name;

        const gameRtp = document.createElement('div');
        gameRtp.className = 'game-rtp';
        gameRtp.textContent = `RTP: ${game.rtp}`;

        gameBtn.appendChild(gameName);
        gameBtn.appendChild(gameRtp);
        gameBtn.onclick = () => this.selectGame(game.id, gameBtn);

        gamesGrid.appendChild(gameBtn);
      }

      categoryDiv.appendChild(gamesGrid);
      content.appendChild(categoryDiv);
    }
    
    this.container.appendChild(content);
  }

  selectGame(gameId, btnElement = null) {
    this.selectedGame = gameId;

    // Update button states
    document.querySelectorAll('.game-btn').forEach(btn => {
      btn.classList.remove('selected');
    });

    if (btnElement) {
      btnElement.classList.add('selected');
    } else {
      const btn = document.querySelector(`[data-game-id="${gameId}"]`);
      if (btn) btn.classList.add('selected');
    }

    // Map game ID to paytable name
    const gameMap = {
      'jacks': 'Jacks or Better',
      'deuces': 'Deuces Wild',
      'double-bonus': 'Double Double Bonus',
      'triple-double-bonus': 'Triple Double Bonus'
    };

    if (this.onGameSelect) {
      this.onGameSelect(gameMap[gameId]);
    }
  }

  setOnGameSelect(callback) {
    this.onGameSelect = callback;
  }

  getSelectedGame() {
    return this.selectedGame;
  }

  /**
   * Set the EV calculator instance for RTP calculations
   */
  setEVCalculator(evCalculator) {
    this.evCalculator = evCalculator;
  }

  /**
   * Update RTP for a specific game
   * @param {string} gameId - The game ID (e.g., 'jacks', 'deuces')
   * @param {number|null} rtpPercent - The RTP percentage (e.g., 99.54) or null to just mark as modified
   * @param {boolean} isModified - Whether this is a custom/modified paytable
   */
  updateGameRTP(gameId, rtpPercent = null, isModified = false) {
    // Find the game in the games object
    for (const [category, games] of Object.entries(this.games)) {
      const game = games.find(g => g.id === gameId);
      if (game) {
        game.modified = isModified;
        
        // Update the display if already rendered
        const gameBtn = document.querySelector(`[data-game-id="${gameId}"]`);
        if (gameBtn) {
          const rtpDiv = gameBtn.querySelector('.game-rtp');
          if (rtpDiv) {
            if (isModified) {
              // Just show "Modified" without calculating exact RTP
              rtpDiv.textContent = `RTP: ${game.defaultRtp} (Modified)`;
              rtpDiv.style.color = '#ffa500'; // Orange color for modified
              rtpDiv.title = 'Paytable has been customized. RTP will differ from default.';
            } else {
              // Show default RTP
              rtpDiv.textContent = `RTP: ${game.defaultRtp}`;
              rtpDiv.style.color = ''; // Reset to default
              rtpDiv.title = '';
            }
          }
        }
        return;
      }
    }
  }

  /**
   * Calculate and update RTP for a specific game using its default paytable
   * @param {string} gameId - The game ID (e.g., 'jacks', 'deuces')
   * @param {Function} callback - Optional callback when calculation completes
   */
  calculateGameRTP(gameId, callback = null) {
    if (!this.evCalculator) {
      console.error('EV Calculator not set');
      return;
    }

    // Map game ID to paytable name
    const gameMap = {
      'jacks': 'Jacks or Better',
      'deuces': 'Deuces Wild',
      'double-bonus': 'Double Double Bonus',
      'triple-double-bonus': 'Triple Double Bonus'
    };

    const gameName = gameMap[gameId];
    if (!gameName) return;

    // Find the paytable
    const presets = EVCalculator.getPresetPaytables();
    const paytable = presets.find(p => p.name === gameName);
    if (!paytable) return;

    // Calculate in background to avoid blocking UI
    setTimeout(() => {
      const originalPaytable = this.evCalculator.paytable;
      this.evCalculator.setPaytable(paytable);
      
      const result = this.evCalculator.calculateHouseEdge();
      this.updateGameRTP(gameId, result.overallReturnPercent);
      
      // Restore original paytable
      this.evCalculator.setPaytable(originalPaytable);
      
      if (callback) callback(gameId, result.overallReturnPercent);
    }, 0);
  }

  /**
   * Reset RTP to default for a specific game
   * @param {string} gameId - The game ID (e.g., 'jacks', 'deuces')
   */
  resetGameRTP(gameId) {
    for (const [category, games] of Object.entries(this.games)) {
      const game = games.find(g => g.id === gameId);
      if (game) {
        game.modified = false;
        game.rtp = game.defaultRtp;
        
        // Update the display if already rendered
        const gameBtn = document.querySelector(`[data-game-id="${gameId}"]`);
        if (gameBtn) {
          const rtpDiv = gameBtn.querySelector('.game-rtp');
          if (rtpDiv) {
            rtpDiv.textContent = `RTP: ${game.rtp}`;
            rtpDiv.style.color = ''; // Reset to default color
          }
        }
        return;
      }
    }
  }
}
