/**
 * Paytable Editor Component
 * Allows users to select presets or create custom paytables
 */

class PaytableEditor {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.presets = EVCalculator.getPresetPaytables();
    this.currentPaytable = JSON.parse(JSON.stringify(this.presets[0]));
    this.onPaytableChange = null;
    
    this.render();
  }

  render() {
    this.container.innerHTML = '';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Paytable Configuration';
    title.className = 'paytable-title';
    this.container.appendChild(title);

    // Instructions
    const instructions = document.createElement('p');
    instructions.style.cssText = 'font-size: 13px; color: #aaa; margin-bottom: 16px;';
    instructions.textContent = 'Adjust payouts below to test different variants. Changes apply immediately to EV calculations.';
    this.container.appendChild(instructions);

    // Preset selector
    const presetDiv = document.createElement('div');
    presetDiv.className = 'paytable-preset-section';

    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Select Paytable:';
    presetLabel.className = 'label';

    const select = document.createElement('select');
    select.className = 'paytable-select';
    select.id = 'paytableSelect';

    this.presets.forEach((preset, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = preset.name;
      // Mark as selected if this preset matches current paytable
      if (preset.name === this.currentPaytable.name) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.onchange = (e) => {
      this.currentPaytable = JSON.parse(JSON.stringify(this.presets[parseInt(e.target.value)]));
      this.render();
      if (this.onPaytableChange) this.onPaytableChange(this.currentPaytable);
    };

    presetDiv.appendChild(presetLabel);
    presetDiv.appendChild(select);
    this.container.appendChild(presetDiv);

    // Name display
    const nameDiv = document.createElement('div');
    nameDiv.className = 'paytable-name';
    nameDiv.textContent = `Current: ${this.currentPaytable.name}`;
    this.container.appendChild(nameDiv);

    // Paytable editor table
    const tableDiv = document.createElement('div');
    tableDiv.className = 'paytable-editor-table';

    const table = document.createElement('table');
    table.className = 'paytable-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const handHeader = document.createElement('th');
    handHeader.textContent = 'Hand';
    const payoutHeader = document.createElement('th');
    payoutHeader.textContent = 'Payout (per coin)';
    headerRow.appendChild(handHeader);
    headerRow.appendChild(payoutHeader);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    const handCategories = [
      'Royal Flush', 'Straight Flush', 'Four of a Kind', 'Full House',
      'Flush', 'Straight', 'Three of a Kind', 'Two Pair', 'Pair', 'High Card'
    ];

    for (const hand of handCategories) {
      const payout = this.currentPaytable.payouts[hand];
      
      // Handle complex payout structures (like bonus quads)
      if (typeof payout === 'object' && payout !== null) {
        // Add main category header
        const headerRow = document.createElement('tr');
        headerRow.className = 'paytable-category-header';
        const headerCell = document.createElement('td');
        headerCell.colSpan = 2;
        headerCell.textContent = hand;
        headerCell.className = 'paytable-hand-name';
        headerRow.appendChild(headerCell);
        tbody.appendChild(headerRow);
        
        // Add each sub-category
        for (const [subCategory, value] of Object.entries(payout)) {
          const row = document.createElement('tr');
          const cellHand = document.createElement('td');
          cellHand.textContent = `  └─ ${subCategory}`;
          cellHand.className = 'paytable-sub-category';
          
          const cellPayout = document.createElement('td');
          const input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.value = value || 0;
          input.className = 'paytable-payout-input';
          input.onchange = () => this.updateBonusPaytable(hand, subCategory, parseInt(input.value));
          
          cellPayout.appendChild(input);
          row.appendChild(cellHand);
          row.appendChild(cellPayout);
          tbody.appendChild(row);
        }
      } else {
        // Standard numeric payout
        const row = document.createElement('tr');
        const cellHand = document.createElement('td');
        cellHand.textContent = hand;
        cellHand.className = 'paytable-hand-name';

        const cellPayout = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.value = payout || 0;
        input.className = 'paytable-payout-input';
        input.onchange = () => this.updatePaytable(hand, parseInt(input.value));

        cellPayout.appendChild(input);
        row.appendChild(cellHand);
        row.appendChild(cellPayout);
        tbody.appendChild(row);
      }
    }

    table.appendChild(tbody);
    tableDiv.appendChild(table);
    this.container.appendChild(tableDiv);

    // Reset button
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'paytable-buttons';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset to Selected Preset';
    resetBtn.className = 'btn btn-secondary';
    resetBtn.onclick = () => {
      const selectedIdx = parseInt(document.getElementById('paytableSelect').value);
      this.currentPaytable = JSON.parse(JSON.stringify(this.presets[selectedIdx]));
      this.render();
      if (this.onPaytableChange) this.onPaytableChange(this.currentPaytable);
    };

    buttonsDiv.appendChild(resetBtn);
    this.container.appendChild(buttonsDiv);
  }

  updatePaytable(hand, payout) {
    this.currentPaytable.payouts[hand] = payout;
    this.showUpdateConfirmation();
    if (this.onPaytableChange) this.onPaytableChange(this.currentPaytable);
  }

  updateBonusPaytable(hand, subCategory, payout) {
    if (!this.currentPaytable.payouts[hand]) {
      this.currentPaytable.payouts[hand] = {};
    }
    this.currentPaytable.payouts[hand][subCategory] = payout;
    this.showUpdateConfirmation();
    if (this.onPaytableChange) this.onPaytableChange(this.currentPaytable);
  }

  showUpdateConfirmation() {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
      color: white;
      padding: 12px 16px;
      border-radius: 6px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    feedback.textContent = '✓ Paytable Updated • EV Calculations Updated';
    document.body.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 3000);
  }

  getPaytable() {
    return this.currentPaytable;
  }

  setPaytable(paytable) {
    this.currentPaytable = JSON.parse(JSON.stringify(paytable));
    this.render();
  }

  setOnChange(callback) {
    this.onPaytableChange = callback;
  }
}
