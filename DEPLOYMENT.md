# GitHub Pages Deployment Guide

## Quick Start Deployment

### 1. Create GitHub Repository

```bash
# If you don't have a repo yet
git init
git add .
git commit -m "Initial commit: Nick Orr's Video Poker Analyzer application"
```

### 2. Push to GitHub

```bash
git remote add origin https://github.com/orrrnicholas/Video-Poker.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings**
3. Scroll down to **Pages** section
4. Under "Build and deployment":
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select `main` and `/root`
5. Click **Save**

### 4. Access Your App

After 1-5 minutes:
```
https://orrrnicholas.github.io/Video-Poker/
```

## Update manifest.json

Replace the placeholder paths in `manifest.json`:

```json
{
   "start_url": "https://orrrnicholas.github.io/Video-Poker/index.html",
   "scope": "https://orrrnicholas.github.io/Video-Poker/"
}
```

## Optional: Custom Domain

1. In repository Settings > Pages
2. Add your custom domain
3. Configure DNS:
   - For apex domain (example.com): Add A records pointing to GitHub Pages IPs
   - For subdomain (app.example.com): Add CNAME record
4. GitHub will automatically manage SSL/HTTPS

### GitHub Pages IP Addresses (as of 2024)

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

## Troubleshooting

### "404 - File not found"
- Ensure all files are committed and pushed
- Check that file paths in HTML match actual files
- Verify `.nojekyll` file exists in root

### Service Worker not caching
- Service Workers require HTTPS (except localhost)
- GitHub Pages uses HTTPS by default
- Clear browser cache and reinstall PWA

### App not installing as PWA
- Ensure `manifest.json` is correct
- Check `start_url` matches actual deployment path
- Verify HTTPS is enabled
- Use Safari (iOS) "Add to Home Screen" or Chrome "Install app"

### "Cannot find module" in console
- Verify all JavaScript files are in correct directories
- Check relative paths in `index.html` script tags
- Ensure scripts are loaded in correct order

## Maintenance

### Update the App

Simply commit and push changes:
```bash
git add .
git commit -m "Update: Description of changes"
git push
```

GitHub Pages automatically redeploys within minutes.

### Clear Cache

If users need to clear PWA cache:
1. Go to DevTools (F12)
2. Application → Storage
3. Click "Clear site data"
4. Reinstall app

## Monitoring

### Check deployment status
- Go to repository → Settings > Pages
- View deployment history
- See any build errors

### Analytics
- Google Analytics can be added to `index.html` if desired
- No backend tracking needed (stays private)

## Security Notes

- All calculations run client-side (no server data transmission)
- No user data is collected
- Service Worker caches assets only
- Suitable for offline use in sensitive environments

## File Structure for Deployment

Ensure this structure exists in your repository:

```
├── .nojekyll
├── index.html
├── style.css
├── main.js
├── manifest.json
├── service-worker.js
├── README.md
├── DEPLOYMENT.md
├── engine/
│   ├── evaluator.js
│   ├── combinatorics.js
│   ├── evCalculator.js
│   └── houseEdgeWorker.js
└── ui/
    ├── cardInput.js
    ├── paytableEditor.js
    ├── resultsView.js
    └── houseEdgeView.js
```

## Version Control

### .gitignore (Optional)

```
.DS_Store
*.swp
*.swo
node_modules/
.cache/
dist/
```

## Continuous Updates

### Automated Deployment

If you use a deployment service:
1. GitHub Actions automatically builds GitHub Pages on push
2. No additional setup needed
3. No build process required (static site)

## Testing Deployment Locally

Before pushing to GitHub:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx http-server

# Then visit: http://localhost:8000
```

Service Worker works on localhost via HTTP, but requires HTTPS on live sites.

## DNS Configuration Example

For custom domain `cardeva.com`:

```dns
# For apex domain (replace with GitHub Pages IPs)
A       185.199.108.153
A       185.199.109.153
A       185.199.110.153
A       185.199.111.153

# For subdomain app.
CNAME   orrrnicholas.github.io
```

Wait 24-48 hours for DNS propagation.

## Support

- GitHub Pages Documentation: https://pages.github.com/
- Troubleshooting: https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites
- PWA Debugging: Chrome DevTools → Application tab

---

**Deployment Complete!** Your Nick Orr's Video Poker Analyzer is now live and accessible offline.
