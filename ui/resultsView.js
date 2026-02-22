/**
 * Results View Component
 * Displays all 32 hold combinations sorted by EV
 */

class ResultsView {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.results = [];
    this.hidden = true;
  }

  display(hand, analyses) {
    this.results = analyses;
    this.hidden = false;

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
                           `<div style="margin-top: 8px;"><strong>EV:</strong> ${bestHold.ev.toFixed(5)}</div>`;

    bestContent.appendChild(bestEVText);
    bestDiv.appendChild(bestTitle);
    bestDiv.appendChild(bestContent);
    this.container.appendChild(bestDiv);

    // Table of all holds
    const tableDiv = document.createElement('div');
    tableDiv.className = 'results-table-container';

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

  hide() {
    this.container.innerHTML = '';
    this.hidden = true;
  }
}
