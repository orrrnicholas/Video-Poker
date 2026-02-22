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
      if (idx === 0) option.selected = true;
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
      const row = document.createElement('tr');
      const cellHand = document.createElement('td');
      cellHand.textContent = hand;
      cellHand.className = 'paytable-hand-name';

      const cellPayout = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.value = this.currentPaytable.payouts[hand] || 0;
      input.className = 'paytable-payout-input';
      input.onchange = () => this.updatePaytable(hand, parseInt(input.value));

      cellPayout.appendChild(input);
      row.appendChild(cellHand);
      row.appendChild(cellPayout);
      tbody.appendChild(row);
    }

    table.appendChild(tbody);
    tableDiv.appendChild(table);
    this.container.appendChild(tableDiv);

    // Buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'paytable-buttons';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save Custom Paytable';
    saveBtn.className = 'btn btn-secondary';
    saveBtn.onclick = () => this.saveCustomPaytable();

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset to Preset';
    resetBtn.className = 'btn btn-secondary';
    resetBtn.onclick = () => {
      this.currentPaytable = JSON.parse(JSON.stringify(this.presets[0]));
      this.render();
      if (this.onPaytableChange) this.onPaytableChange(this.currentPaytable);
    };

    buttonsDiv.appendChild(saveBtn);
    buttonsDiv.appendChild(resetBtn);
    this.container.appendChild(buttonsDiv);
  }

  updatePaytable(hand, payout) {
    this.currentPaytable.payouts[hand] = payout;
    if (this.onPaytableChange) this.onPaytableChange(this.currentPaytable);
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

  saveCustomPaytable() {
    const customPaytables = JSON.parse(localStorage.getItem('customPaytables') || '[]');
    const customName = prompt('Enter name for custom paytable:', 'My Custom Paytable');
    
    if (customName) {
      const customPaytable = {
        ...this.currentPaytable,
        name: customName,
        isCustom: true
      };

      customPaytables.push(customPaytable);
      localStorage.setItem('customPaytables', JSON.stringify(customPaytables));
      alert('Custom paytable saved!');
    }
  }
}
