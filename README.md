# Nick Orr's Video Poker Analyzer

A professional-grade, mathematically exact Expected Value analyzer for video poker. Analyzes all possible card holds with perfect precision using combinatorial mathematics.

## Live App

- https://orrrnicholas.github.io/Video-Poker/

## Features

- **Exact Analysis**: Uses precise mathematical enumeration (not approximation)
- **All Holds**: Evaluates all 32 possible 5-card holds instantly
- **Multiple Paytables**: Compare hands across different game variations
- **House Edge Calc**: Analyzes all 2.6M possible starting hands for complete paytable analysis
- **Mobile First**: Fully optimized for mobile and tablet devices
- **Offline Ready**: Works completely offline after first load
- **Dark Interface**: Easy on the eyes during extended use

## How to Use

### Analyze a Hand

1. Select exactly 5 cards from the grid
2. Choose a paytable (or create your own)
3. Click "Analyze Hand"
4. View all 32 possible holds ranked by expected value

The **green highlighted hold** is mathematically optimal for that hand.

### Understand the Results

- **EV**: Expected value of that hold (coins per coin wagered)
- **Penalty**: How much EV you lose vs the optimal hold
- **Draws**: Number of possible outcomes for that hold

### Calculate House Edge

Select a paytable and click "Calculate House Edge" to analyze all 2,598,960 possible starting hands. Results show the exact return percentage for perfect play.

## Paytables Included

- 9/6 Jacks or Better (~99.54% return)
- 8/5 Jacks or Better (~98.35% return)
- 7/5 Jacks or Better (~96.36% return)
- 6/5 Jacks or Better (~93.60% return)
- Deuces Wild (various returns)
- Custom: Create your own paytable and save it

## Technical Details

**No dependencies, no server, no internet required**
- Pure JavaScript (ES6)
- Fully static site
- Progressive Web App
- Mobile-responsive design
- Runs offline after first load

**Performance**
- Hand analysis: <500ms
- House edge calc: 10-30 seconds (background worker)
- Works on all modern browsers

## Disclaimers

- **Educational Tool**: For strategic analysis and learning
- **No Guarantees**: Actual casino results will vary due to randomness
- **Not Gambling Advice**: Optimal strategy shown for mathematical comparison only

## License

Provided as-is for educational and analytical purposes.

---

**Nick Orr's Video Poker Analyzer** - Pure JavaScript, zero dependencies, 100% offline-capable
