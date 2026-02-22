/**
 * House Edge View Component
 * Displays house edge information and calculations
 */

class HouseEdgeView {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.evCalculator = null;
    this.worker = null;
    this.isCalculating = false;
    this.cache = {};
  }

  setEVCalculator(evCalculator) {
    this.evCalculator = evCalculator;
  }

  render() {
    this.container.innerHTML = '';

    const title = document.createElement('h2');
    title.textContent = 'House Edge Analysis';
    title.className = 'house-edge-title';
    this.container.appendChild(title);

    // Status info
    const statusDiv = document.createElement('div');
    statusDiv.className = 'house-edge-status';
    statusDiv.id = 'houseEdgeStatus';
    statusDiv.innerHTML = `
      <p>Click "Calculate House Edge" to analyze the full paytable performance.</p>
      <p style="font-size: 12px; color: #888;">Warning: This analyzes all 2,598,960 possible starting hands and may take 10-30 seconds.</p>
    `;
    this.container.appendChild(statusDiv);

    // Calculate button
    const btnDiv = document.createElement('div');
    btnDiv.className = 'house-edge-buttons';

    const calcBtn = document.createElement('button');
    calcBtn.textContent = 'Calculate House Edge';
    calcBtn.className = 'btn btn-primary';
    calcBtn.id = 'calcHouseEdgeBtn';
    calcBtn.onclick = () => this.startCalculation();

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.id = 'cancelBtn';
    cancelBtn.style.display = 'none';
    cancelBtn.disabled = true;
    cancelBtn.onclick = () => this.cancelCalculation();

    btnDiv.appendChild(calcBtn);
    btnDiv.appendChild(cancelBtn);
    this.container.appendChild(btnDiv);

    // Progress bar
    const progressDiv = document.createElement('div');
    progressDiv.id = 'houseEdgeProgress';
    progressDiv.className = 'house-edge-progress-container';
    progressDiv.style.display = 'none';
    progressDiv.innerHTML = `
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill" style="width: 0%"></div>
      </div>
      <div class="progress-text" id="progressText">0%</div>
    `;
    this.container.appendChild(progressDiv);

    // Results container
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'houseEdgeResults';
    resultsDiv.className = 'house-edge-results';
    this.container.appendChild(resultsDiv);
  }

  startCalculation() {
    if (!this.evCalculator) {
      alert('EV Calculator not initialized');
      return;
    }

    this.isCalculating = true;
    document.getElementById('calcHouseEdgeBtn').disabled = true;
    document.getElementById('cancelBtn').style.display = 'inline-block';
    document.getElementById('cancelBtn').disabled = false;
    document.getElementById('houseEdgeProgress').style.display = 'block';
    document.getElementById('houseEdgeStatus').innerHTML = '<p>Calculating house edge...</p>';
    document.getElementById('houseEdgeResults').innerHTML = '';

    // Use Web Worker if available
    if (typeof Worker !== 'undefined') {
      this.startWorkerCalculation();
    } else {
      // Fallback: synchronous calculation
      this.calculateDirect();
    }
  }

  startWorkerCalculation() {
    if (!this.worker) {
      this.worker = new Worker('engine/houseEdgeWorker.js');
      this.worker.onmessage = (event) => this.handleWorkerMessage(event);
    }

    const paytable = this.evCalculator.paytable;
    this.worker.postMessage({
      type: 'calculate',
      paytable: paytable
    });
  }

  handleWorkerMessage(event) {
    const { type, data } = event.data;

    if (type === 'progress') {
      const percentage = Math.round(data.percentage);
      document.getElementById('progressFill').style.width = percentage + '%';
      document.getElementById('progressText').textContent = percentage + '%';
      document.getElementById('houseEdgeStatus').innerHTML = `<p>Processing: ${percentage}% (${data.processed.toLocaleString()} / ${data.total.toLocaleString()})</p>`;
    } else if (type === 'complete') {
      this.displayResults(data);
      this.isCalculating = false;
      document.getElementById('calcHouseEdgeBtn').disabled = false;
      document.getElementById('cancelBtn').style.display = 'none';
    }
  }

  calculateDirect() {
    // Synchronous calculation with progress callback
    const paytable = this.evCalculator.paytable;
    this.evCalculator.setPaytable(paytable);

    const result = this.evCalculator.calculateHouseEdge((progress) => {
      const percentage = Math.round(progress.percentage);
      document.getElementById('progressFill').style.width = percentage + '%';
      document.getElementById('progressText').textContent = percentage + '%';
      document.getElementById('houseEdgeStatus').innerHTML = `<p>Processing: ${percentage}% (${progress.processed.toLocaleString()} / ${progress.total.toLocaleString()})</p>`;
    });

    this.displayResults(result);
    this.isCalculating = false;
    document.getElementById('calcHouseEdgeBtn').disabled = false;
    document.getElementById('cancelBtn').style.display = 'none';
  }

  displayResults(result) {
    const resultsDiv = document.getElementById('houseEdgeResults');
    
    resultsDiv.innerHTML = `
      <div class="house-edge-result-card">
        <div class="result-item">
          <span class="result-label">Overall Return:</span>
          <span class="result-value">${(result.overallReturnPercent).toFixed(2)}%</span>
        </div>
        <div class="result-item">
          <span class="result-label">House Edge:</span>
          <span class="result-value" style="color: #ff6666;">${(result.houseEdge).toFixed(2)}%</span>
        </div>
        <div class="result-item" style="border-top: 1px solid #444; padding-top: 12px; margin-top: 12px;">
          <span class="result-label">Hands Analyzed:</span>
          <span class="result-value">${result.totalHandsAnalyzed.toLocaleString()}</span>
        </div>
      </div>
    `;

    document.getElementById('houseEdgeProgress').style.display = 'none';
    document.getElementById('houseEdgeStatus').innerHTML = '<p style="color: #0f0;">✓ Calculation complete!</p>';
  }

  cancelCalculation() {
    if (this.worker) {
      this.worker.postMessage({ type: 'cancel' });
    }
    this.isCalculating = false;
    document.getElementById('calcHouseEdgeBtn').disabled = false;
    document.getElementById('cancelBtn').disabled = true;
    document.getElementById('houseEdgeProgress').style.display = 'none';
    document.getElementById('houseEdgeStatus').innerHTML = '<p>Calculation cancelled.</p>';
  }
}
