# GitHub Pages Deployment Guide

## ✅ Your app is configured for: `orrrnicholas.github.io/Video-Poker/`

## Steps to Deploy:

### 1. Create GitHub Repository
```bash
cd "c:\Users\orrrn\Python Programs\Video-Poker"
git init
git add .
git commit -m "Initial commit - Video Poker Analyzer with dynamic RTP"
```

### 2. Push to GitHub
1. Create a new repository on GitHub named **"Video-Poker"** (case-sensitive!)
2. Run these commands:
```bash
git remote add origin https://github.com/orrrnicholas/Video-Poker.git
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages
1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll to **Pages** section (left sidebar)
4. Under **Source**, select **main** branch
5. Click **Save**

### 4. Access Your Site
- Your app will be live at: `https://orrrnicholas.github.io/Video-Poker/`
- It may take 1-2 minutes to deploy

## ✅ What Works:

- **All JavaScript calculations** (no server needed)
- **RTP calculations** (chunked, non-blocking)
- **House Edge calculator** (works without Web Worker)
- **Offline support** (Service Worker caching)
- **All paytable customizations**
- **Mobile responsive design**

## 🔧 If You Change Repository Name:

If you use a different repository name (e.g., "poker-analyzer"), you'll need to update these files:

1. **manifest.json** - Change all `/Video-Poker/` to `/your-repo-name/`
2. **service-worker.js** - Change all `/Video-Poker/` to `/your-repo-name/`

## 📝 Testing Before Deployment:

To test locally with the GitHub Pages paths:
```bash
# Stop current server (Ctrl+C)
# Restart server from parent directory
cd ..
python -m http.server 8080
# Access at: http://localhost:8080/Video-Poker/
```

## ⚠️ Important Notes:

- **Repository must be named "Video-Poker"** (or update all paths)
- **Repository must be public** (or have GitHub Pro for private Pages)
- **Service Worker** will cache files for offline use after first visit
- **No backend needed** - everything runs client-side
- **HTTPS automatic** - GitHub Pages provides SSL certificate

## 🎉 Share with Friends:

Once deployed, share this URL: `https://orrrnicholas.github.io/Video-Poker/`

They can:
- Use it immediately in any modern browser
- Install as PWA on mobile devices
- Use offline after first visit
- Bookmark for quick access

## 🐛 Troubleshooting:

**Blank page on GitHub Pages?**
- Check browser console for errors
- Verify repository name matches paths in manifest/service-worker
- Try hard refresh: Ctrl+Shift+R

**RTP not calculating?**
- Clear browser cache
- Disable any ad blockers
- Check browser console for JavaScript errors

**404 errors for assets?**
- Verify all file names match exactly (case-sensitive)
- Check that all files are committed to repository
- Wait 2-3 minutes for GitHub Pages to fully deploy
