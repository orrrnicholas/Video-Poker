/**
 * Game Selector Component
 * Allows users to select poker game variants with organized categories
 */

class GameSelector {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.onGameSelect = null;
    this.selectedGame = null;

    // Game definitions organized by category
    this.games = {
      'Classic Games': [
        { id: 'jacks', name: 'Jacks or Better', rtp: '99.55%' },
        { id: 'deuces', name: 'Deuces Wild', rtp: '100.76%' }
      ],
      'Bonus Games': [
        { id: 'double-bonus', name: 'Double Double Bonus', rtp: '99.27%' }
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
      'double-bonus': 'Double Double Bonus'
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
}
