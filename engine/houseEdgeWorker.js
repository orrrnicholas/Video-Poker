/**
 * House Edge Worker
 * Runs in a Web Worker to calculate house edge without blocking the UI
 * Receives: { type: 'calculate', paytable, data }
 * Sends: progress and result messages
 */

class HouseEdgeWorker {
  constructor() {
    this.evaluator = new HandEvaluator();
    this.combinatorics = new Combinatorics();
    this.evCalculator = new EVCalculator(this.evaluator, this.combinatorics);
    
    // Listen for messages
    self.onmessage = (event) => this.handleMessage(event);
  }

  handleMessage(event) {
    const { type, paytable } = event.data;

    if (type === 'calculate') {
      this.calculateHouseEdge(paytable);
    } else if (type === 'cancel') {
      this.cancelled = true;
    }
  }

  calculateHouseEdge(paytable) {
    this.cancelled = false;
    this.evCalculator.setPaytable(paytable);

    const result = this.evCalculator.calculateHouseEdge((progress) => {
      // Send progress update to main thread
      self.postMessage({
        type: 'progress',
        data: progress
      });
    });

    // Send final result
    self.postMessage({
      type: 'complete',
      data: result
    });
  }
}

// Initialize worker
const worker = new HouseEdgeWorker();
