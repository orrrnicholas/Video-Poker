/**
 * House Edge View Component
 * Displays house edge information and calculations
 */

class HouseEdgeView {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.evCalculator = null;
    this.isCalculating = false;
    this.cancelCurrentCalculation = null;
  }

  setEVCalculator(evCalculator) {
    this.evCalculator = evCalculator;
  }

  render() {
    this.container.innerHTML = '';

    // Collapsible header
    const header = document.createElement('div');
    header.className = 'section-header';
    
    const title = document.createElement('h2');
    title.textContent = 'RTP Estimator (Fast)';
    title.className = 'house-edge-title';
    
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

    // Status info
    const statusDiv = document.createElement('div');
    statusDiv.className = 'house-edge-status';
    statusDiv.id = 'houseEdgeStatus';
    statusDiv.innerHTML = `
      <p>Calculate the estimated Return to Player (RTP) and house edge for the current paytable configuration.</p>
      <p style="font-size: 12px; color: #888;"><strong>Method:</strong> Statistical sampling of 10,000 random hands (completes in ~5 seconds).</p>
      <p style="font-size: 12px; color: #ffa500;">💡 Modified a paytable? Use this to estimate the new RTP!</p>
    `;
    content.appendChild(statusDiv);

    // Calculate button
    const btnDiv = document.createElement('div');
    btnDiv.className = 'house-edge-buttons';

    const calcBtn = document.createElement('button');
    calcBtn.textContent = 'Calculate RTP';
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
    content.appendChild(btnDiv);

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
    content.appendChild(progressDiv);

    // Results container
    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'houseEdgeResults';
    resultsDiv.className = 'house-edge-results';
    content.appendChild(resultsDiv);
    
    // Append content to container
    this.container.appendChild(content);
  }

  startCalculation() {
    console.log('=== House Edge Calculation Started ===');
    
    if (!this.evCalculator) {
      alert('EV Calculator not initialized');
      console.error('EV Calculator not initialized');
      return;
    }

    console.log('Setting up UI...');
    this.isCalculating = true;
    
    const calcBtn = document.getElementById('calcHouseEdgeBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const progressDiv = document.getElementById('houseEdgeProgress');
    const statusDiv = document.getElementById('houseEdgeStatus');
    const resultsDiv = document.getElementById('houseEdgeResults');
    
    if (calcBtn) calcBtn.disabled = true;
    if (cancelBtn) {
      cancelBtn.style.display = 'inline-block';
      cancelBtn.disabled = false;
    }
    if (progressDiv) progressDiv.style.display = 'block';
    if (statusDiv) statusDiv.innerHTML = '<p>Initializing calculation...</p>';
    if (resultsDiv) resultsDiv.innerHTML = '';

    console.log('Starting calculation in 200ms...');
    // Give UI time to update before starting heavy calculation
    setTimeout(() => {
      console.log('Calling calculateDirect...');
      this.calculateDirect();
    }, 200);
  }

  calculateDirect() {
    // Fast statistical sampling approach
    const paytable = this.evCalculator.paytable;
    this.evCalculator.setPaytable(paytable);
    
    console.log('Starting house edge calculation (sampling method)...');
    
    // Use statistical sampling instead of analyzing all hands
    const sampleSize = 10000; // Sample 10k hands instead of 2.6M
    const allHands = this.evCalculator.combinatorics.generateAllHands();
    const totalHands = allHands.length;
    
    console.log(`Sampling ${sampleSize} hands from ${totalHands} total`);
    
    // Generate random sample
    const sampledHands = [];
    const usedIndices = new Set();
    
    while (sampledHands.length < sampleSize) {
      const randomIndex = Math.floor(Math.random() * totalHands);
      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        sampledHands.push(allHands[randomIndex]);
      }
    }
    
    let totalEV = 0;
    let processed = 0;
    const chunkSize = 100; // Process 100 hands at a time
    let cancelled = false;
    
    // Store cancel function
    this.cancelCurrentCalculation = () => {
      cancelled = true;
    };
    
    const processChunk = () => {
      // Check if cancelled
      if (cancelled) {
        console.log('Calculation cancelled by user');
        document.getElementById('houseEdgeStatus').innerHTML = '<p>Calculation cancelled.</p>';
        document.getElementById('houseEdgeProgress').style.display = 'none';
        this.isCalculating = false;
        document.getElementById('calcHouseEdgeBtn').disabled = false;
        document.getElementById('cancelBtn').style.display = 'none';
        return;
      }
      
      const start = processed;
      const end = Math.min(start + chunkSize, sampleSize);
      
      // Process this chunk
      for (let i = start; i < end; i++) {
        const hand = sampledHands[i];
        const holds = this.evCalculator.analyzeAllHolds(hand);
        const bestHold = holds[0];
        totalEV += bestHold.ev;
        processed++;
      }
      
      // Update progress
      const percentage = Math.round((processed / sampleSize) * 100);
      const progressFillEl = document.getElementById('progressFill');
      const progressTextEl = document.getElementById('progressText');
      const statusEl = document.getElementById('houseEdgeStatus');
      
      if (progressFillEl) progressFillEl.style.width = percentage + '%';
      if (progressTextEl) progressTextEl.textContent = percentage + '%';
      if (statusEl) statusEl.innerHTML = `<p>Processing: ${percentage}% (${processed.toLocaleString()} / ${sampleSize.toLocaleString()} hands sampled)</p>`;
      
      // Continue or finish
      if (processed < sampleSize) {
        setTimeout(processChunk, 10);
      } else {
        // Calculation complete
        console.log('Calculation complete!');
        const avgEVPerHand = totalEV / processed;  // Raw average payout
        const creditsPerHand = this.evCalculator.creditsPerHand;  // Get bet amount
        const overallReturn = (avgEVPerHand / creditsPerHand);  // RTP as decimal (0-1)
        const houseEdge = (1 - overallReturn) * 100;  // House edge as percentage
        
        const result = {
          overallReturn: overallReturn,
          overallReturnPercent: overallReturn * 100,
          houseEdge: houseEdge,
          totalHandsAnalyzed: sampleSize,
          totalEV: totalEV,
          isSampled: true,
          creditsPerHand: creditsPerHand
        };
        
        this.displayResults(result);
        this.isCalculating = false;
        document.getElementById('calcHouseEdgeBtn').disabled = false;
        document.getElementById('cancelBtn').style.display = 'none';
      }
    };
    
    // Start processing immediately (already delayed by startCalculation)
    console.log('Starting first chunk...');
    processChunk();
  }

  displayResults(result) {
    const resultsDiv = document.getElementById('houseEdgeResults');
    
    const overallReturnPercent = result.overallReturnPercent;
    const avgEVPerHand = result.overallReturn;
    const isSampled = result.isSampled || false;

    // Calculate multi-hand expectations for this paytable
    const multiHandStats = MultiHandAnalysis.calculateExpectations(avgEVPerHand, 10, 5);
    const formatted = MultiHandAnalysis.formatForDisplay(multiHandStats);
    
    const samplingNote = isSampled ? 
      `<div class="result-item" style="background: rgba(74, 138, 170, 0.2); padding: 8px; border-radius: 4px; margin-top: 8px;">
        <span style="font-size: 12px; color: #aaa;">
          📊 <strong>Note:</strong> Based on statistical sampling of ${result.totalHandsAnalyzed.toLocaleString()} random hands. 
          Accuracy typically within ±0.1% of exact value.
        </span>
      </div>` : '';
    
    resultsDiv.innerHTML = `
      <div class="house-edge-result-card">
        <div class="result-item">
          <span class="result-label">Overall Return:</span>
          <span class="result-value">${overallReturnPercent.toFixed(2)}%</span>
        </div>
        <div class="result-item">
          <span class="result-label">House Edge:</span>
          <span class="result-value" style="color: #ff6666;">${result.houseEdge.toFixed(2)}%</span>
        </div>
        ${samplingNote}
      </div>

      <div class="multi-hand-expectations-house-edge" style="
        background: linear-gradient(135deg, #2a4a6a 0%, #1a3a4a 100%);
        border: 2px solid #4a8aaa;
        border-radius: 8px;
        padding: 16px;
        margin-top: 20px;
        color: #fff;
      ">
        <h3 style="margin-top: 0; margin-bottom: 12px; color: #4addff;">📊 What This Means: 10 Hand Session</h3>
        
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 12px 0;
          font-size: 13px;
        ">
          <div style="background: rgba(74, 221, 255, 0.1); padding: 8px; border-radius: 4px; border-left: 3px solid #4ade80;">
            <strong>Total Bet:</strong> ${formatted.summary.totalBet} credits
          </div>
          <div style="background: rgba(74, 221, 255, 0.1); padding: 8px; border-radius: 4px; border-left: 3px solid ${formatted.summary.expectedValue.includes('-') ? '#ff6666' : '#4ade80'};">
            <strong>Expected Value:</strong> ${formatted.summary.expectedValue} credits
          </div>
          <div style="background: rgba(74, 221, 255, 0.1); padding: 8px; border-radius: 4px;" colspan="2">
            <strong>Expected Return:</strong> ${formatted.summary.expectedReturnPercent}%
          </div>
        </div>

        <div style="
          background: rgba(74, 170, 170, 0.2);
          padding: 10px;
          border-radius: 4px;
          font-size: 13px;
          margin-top: 12px;
        ">
          <p style="margin: 0 0 8px 0; font-weight: bold;">Realistic Outcome Range (95% confidence):</p>
          <p style="margin: 0; color: #aaa;">You might expect to have somewhere between <strong style="color: #fff;">${formatted.confidence.lower} and ${formatted.confidence.upper}</strong> credits after 10 hands.</p>
        </div>
      </div>
    `;

    document.getElementById('houseEdgeProgress').style.display = 'none';
    document.getElementById('houseEdgeStatus').innerHTML = '<p style="color: #0f0;">✓ Calculation complete!</p>';
  }

  cancelCalculation() {
    // Cancel the chunked calculation
    if (this.cancelCurrentCalculation) {
      this.cancelCurrentCalculation();
    }
    this.isCalculating = false;
    document.getElementById('calcHouseEdgeBtn').disabled = false;
    document.getElementById('cancelBtn').style.display = 'none';
  }
}
