# Nick Orr's Video Poker Analyzer - Video Poker Expected Value Optimizer

A professional-grade, mathematically exact Expected Value analyzer for video poker, designed for offline use and strategic analysis.

## Features

- **Exact Combinatorial Analysis**: Uses precise enumeration, not Monte Carlo simulation
- **Single Hand Analysis**: Analyzes all 32 possible holds (2^5 combinations) for any 5-card input
- **Custom Paytables**: Support for standard presets and fully editable custom paytables
- **House Edge Calculation**: Computes exact return and house edge by analyzing all 2,598,960 possible starting hands
- **Multi-Hand Comparison**: Compare hands across different paytables
- **Offline Functionality**: Full operation offline after initial load (PWA with Service Worker)
- **Mobile-First Design**: Optimized for iPhone and mobile use
- **Dark Mode**: Professional, discreet dark interface for casino use

## Mathematical Precision

### Single Hand EV Calculation

For a given 5-card hand:

1. Generates all 32 possible hold combinations (using bitmask 0-31)
2. For each hold, enumerates all exact draw combinations from the remaining deck
3. Evaluates each final 5-card hand using an optimized hand evaluator
4. Calculates EV = (sum of payouts) / (number of possible draws)
5. Identifies optimal hold with lowest penalty calculation

### Hand Evaluation

The evaluator correctly identifies all poker hand categories with high performance:
- Royal Flush (A-K-Q-J-T suited)
- Straight Flush
- Four of a Kind
- Full House
- Flush
- Straight (including Ace-low A-2-3-4-5)
- Three of a Kind
- Two Pair
- Pair (with paytable-specific qualifying ranks)
- High Card

Optimizations:
- Rank frequency arrays
- Suit frequency arrays
- Bitmask straight detection
- Evaluates millions of hands under 1 second on modern devices

### House Edge Calculation

When analyzing a complete paytable:

1. Enumerates all 2,598,960 possible starting hands C(52,5)
2. For each starting hand, calculates its optimal hold EV
3. Computes overall return = (sum of all optimal EVs) / 2,598,960
4. House Edge = 1 - Overall Return
5. Runs in Web Worker to avoid UI blocking
6. Includes progress tracking and cancellation support

## Architecture

### Engine (Zero DOM Code)

- **evaluator.js**: Poker hand classifier and evaluator
- **combinatorics.js**: Card enumeration and combination generation
- **evCalculator.js**: EV computation for holds and paytables
- **houseEdgeWorker.js**: Web Worker for heavy calculations

### UI Components

- **cardInput.js**: 52-card grid selector with validation
- **paytableEditor.js**: Paytable editor with presets and localStorage
- **resultsView.js**: Results display with sorting and penalty visualization
- **houseEdgeView.js**: House edge calculation and progress tracking

### Core Files

- **index.html**: Main application structure
- **style.css**: Dark mode responsive styling
- **main.js**: Application orchestration and state management
- **manifest.json**: PWA configuration
- **service-worker.js**: Offline caching and PWA capability

## Supported Paytables

### Presets Included

1. **9/6 Jacks or Better** (≈99.54% return)
   - Full House: 9
   - Flush: 6
   - Pair: Must be Jacks or better

2. **8/5 Jacks or Better** (≈98.35% return)
3. **7/5 Jacks or Better** (≈96.36% return)
4. **6/5 Jacks or Better** (≈93.60% return)
5. **Deuces Wild** (Various return)

Create custom paytables for any variation:
- Adjust payout values in editor
- Real-time recalculation
- Save to localStorage
- Compare across games

## Usage

### Input a Hand for Analysis

1. Click "Analyzer" tab
2. Select exactly 5 cards from the 52-card grid (organized by suit)
3. Press "Analyze Hand"
4. View results showing all 32 possible holds sorted by EV

### Interpret Results

- **Best Hold**: Highlighted with green border showing optimal strategy
- **EV**: Expected value per coin wagered
- **Penalty**: Cost in EV for deviating from optimal hold (best hold = 0)
- **Draws**: Number of possible draw outcomes for this hold

Color coding for penalty severity:
- **Green** (≤0.001): Essentially optimal
- **Yellow** (0.001-0.5): Minor penalty
- **Orange** (0.5-1.0): Moderate penalty
- **Red** (>1.0): Severe penalty

### Calculate House Edge

1. Click "House Edge" tab
2. Select or create a paytable
3. Click "Calculate House Edge"
4. Monitor progress (analyzes 2,598,960 hands)
5. View results showing:
   - Overall Return %
   - House Edge %
   - Total hands analyzed

## Performance

- **Single hand analysis**: &lt;500ms on modern devices
- **House edge calculation**: 10-30 seconds (runs in Web Worker)
- **Hand evaluation**: Millions per second
- **Mobile-optimized**: Responsive card selection interface

## Offline Operation

The application uses Service Worker caching to enable full offline functionality:

1. First load caches all assets
2. Subsequent uses work offline
3. No server backend required
4. All calculations run client-side
5. localStorage for saving custom paytables

### PWA Features

- Installable as home screen app ("Add to Home Screen")
- Works fully offline after installation
- Standalone display mode
- Custom theme colors
- Works on iOS and Android

## Browser Support

- Chrome/Edge 51+
- Firefox 44+
- Safari 11.1+
- iOS Safari 11.3+
- Android Browser 51+

## Deployment to GitHub Pages

### Setup Repository

```bash
# Clone or create a repository named "Video-Poker"
git init Video-Poker
cd Video-Poker
```

### Deploy Files

1. Copy all project files to repository root
2. Create a `.nojekyll` file (prevents Jekyll processing)
3. Ensure `index.html` is in root directory

### Configure GitHub Pages

1. Go to repository settings
2. Scroll to "Pages" section
3. Under "Source", select "Deploy from a branch"
4. Select branch: `main` (or `master`)
5. Select folder: `/ (root)`
6. Save

### Access the App

After deployment, access at:
```
https://yourusername.github.io/Video-Poker/
```

Or update `manifest.json` with your actual path:
```json
"start_url": "/Video-Poker/index.html",
"scope": "/Video-Poker/",
```

### Custom Domain (Optional)

1. In repository settings, add custom domain
2. Update DNS records to point to GitHub Pages
3. Update `manifest.json` paths if needed

### Update manifest.json for GitHub Pages

Replace `yourusername` with your GitHub username:

```json
{
  "start_url": "https://yourusername.github.io/Video-Poker/index.html",
  "scope": "https://yourusername.github.io/Video-Poker/"
}
```

## Local Testing

### Quick Start

1. Open `index.html` in a modern web browser
2. Or run a local server:

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (with http-server)
npx http-server
```

3. Navigate to `http://localhost:8000` (or appropriate port)

### Service Worker Testing

Service Workers require HTTPS in production, but work with HTTP on localhost.

For local testing:
1. Use http-server or similar local server
2. Open DevTools (F12)
3. Go to Application → Service Workers
4. Register and test caching

## Mathematical Validation

The 9/6 Jacks or Better hand analysis validates at approximately **99.54% return**:
- Expected value over 5 coins bet ≈ 4.976 coins back
- House edge ≈ 0.46%

This matches published analysis for optimal strategy.

## Code Organization

```
├── index.html              # Main app structure
├── style.css              # Dark mode responsive styles
├── main.js                # App orchestration
├── manifest.json          # PWA configuration
├── service-worker.js      # Offline caching
├── engine/
│   ├── evaluator.js       # Hand classification
│   ├── combinatorics.js   # Card enumeration
│   ├── evCalculator.js    # EV computation
│   └── houseEdgeWorker.js # Web Worker
└── ui/
    ├── cardInput.js       # Card selector
    ├── paytableEditor.js  # Paytable config
    ├── resultsView.js     # Results display
    └── houseEdgeView.js   # House edge calc
```

## Development Notes

### Adding Custom Paytables

Edit `EVCalculator.getPresetPaytables()` in `engine/evCalculator.js`:

```javascript
{
  name: 'My Custom Paytable',
  qualifier: { rank: 'PAIR', rankValue: 11 },
  payouts: {
    'Royal Flush': 800,
    'Straight Flush': 50,
    // ... other hands
  }
}
```

### Extending the Analyzer

The modular architecture allows easy extensions:
- Add new paytable types
- Support other poker variants
- Implement multi-hand analysis
- Create batch analysis tools

### Debugging

Access components in browser console:
```javascript
window.app                  // Main application
window.evaluator           # Hand evaluator
window.evCalculator        # EV calculator
```

## Disclaimers

- **Educational Purpose**: This tool is designed for strategic analysis and education
- **Strategy Only**: Results show mathematically optimal play, not gambling advice
- **No Guarantees**: Actual results will vary due to randomness
- **Not for Harm**: Should not be used to encourage problem gambling

## License

This project is provided as-is for educational and analytical purposes.

## Technical Specifications

- **Language**: Pure JavaScript (ES6)
- **No Dependencies**: Zero external libraries
- **No Backend**: Fully static site
- **PWA**: Progressive Web App standard
- **Responsive**: Mobile-first design
- **Optimization**: Combinatorial efficiency

## Support & Feedback

For issues, questions, or suggestions, create an issue in the repository.

---

**Nick Orr's Video Poker Analyzer v1.0** - Professional poker analysis, offline-first design, GitHub Pages ready.
