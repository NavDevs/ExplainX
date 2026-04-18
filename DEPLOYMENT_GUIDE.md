# 🚀 Deploy ExplainX Website - Step by Step Guide

## Option 1: GitHub Pages (RECOMMENDED - 100% Free)

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **New Repository**
3. Name it: `ExplainX`
4. Description: `AI-powered Chrome extension for text explanations`
5. Select **Public**
6. Click **Create repository**

### Step 2: Upload Your Files

```bash
# Navigate to your project
cd "c:\Users\huesh\Downloads\College Project\ExplainX"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with website and extension"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/ExplainX.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Click **Pages** in the left sidebar
4. Under **Source**, select:
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**

### Step 4: Wait 2-5 Minutes

Your site will be live at:
```
https://YOUR_USERNAME.github.io/ExplainX/website/
```

---

## Option 2: Netlify (EASIEST - 100% Free)

### Method A: Drag & Drop (No Git Required)

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub or email
3. Go to **Sites** → **Add new site** → **Deploy manually**
4. Drag the `website` folder
5. Done! Your site is live

**Your URL:** `https://random-name.netlify.app`

### Method B: Connect to GitHub (Auto-updates)

1. Push your code to GitHub (see Option 1, Steps 1-2)
2. On Netlify, click **New site from Git**
3. Choose **GitHub**
4. Select your `ExplainX` repository
5. Set build settings:
   - Build command: (leave empty)
   - Publish directory: `website`
6. Click **Deploy site**

---

## Option 3: Vercel (100% Free)

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **New Project**
4. Import your `ExplainX` repository
5. Settings:
   - Framework Preset: **Other**
   - Root Directory: `website`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
6. Click **Deploy**

---

## 🎯 After Deployment

### 1. Update Your GitHub Links

In `website/index.html`, replace:
- `YOUR_USERNAME` → Your actual GitHub username

### 2. Create Your First Release

```bash
# On GitHub, go to your repository
# Click "Releases" → "Create a new release"
# Tag: v1.0.0
# Title: ExplainX v1.0.0
# Attach: ZIP file of dist/ folder
```

### 3. Test Your Website

Visit your deployed site and check:
- ✅ All links work
- ✅ Download button points to correct GitHub release
- ✅ Mobile responsive
- ✅ Contact/issue links work

---

## 📦 Creating ZIP for Distribution

### Create Release ZIP

```bash
# Navigate to your project
cd "c:\Users\huesh\Downloads\College Project\ExplainX"

# Build the extension
npm run build

# Create ZIP of dist folder
# On Windows (PowerShell):
Compress-Archive -Path dist -DestinationPath ExplainX-v1.0.0.zip

# On Mac/Linux:
zip -r ExplainX-v1.0.0.zip dist/
```

### Upload to GitHub Release

1. Go to your repository → **Releases**
2. Click **Create a new release**
3. Tag version: `v1.0.0`
4. Release title: `ExplainX v1.0.0`
5. Description: Add release notes
6. Click **Attach binaries**
7. Upload `ExplainX-v1.0.0.zip`
8. Click **Publish release**

---

## 🌐 Custom Domain (Optional)

### GitHub Pages

1. Buy a domain (e.g., from Namecheap ~$10/year)
2. Go to repository → Settings → Pages
3. Add your custom domain
4. Add `CNAME` file to `website/` folder with your domain

### Netlify

1. Go to Site settings → Domain management
2. Click **Add custom domain**
3. Follow DNS instructions

---

## ✅ Deployment Checklist

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Enabled GitHub Pages / Deployed to Netlify
- [ ] Updated all `YOUR_USERNAME` references
- [ ] Created first GitHub Release with ZIP
- [ ] Tested website on desktop
- [ ] Tested website on mobile
- [ ] Verified all links work
- [ ] Added analytics (optional)

---

## 🎉 You're Live!

Share your website:
- Post on Reddit (r/chrome_extensions, r/productivity)
- Share on Twitter/X
- Add to GitHub readme
- Share in developer communities

---

## 📊 Monitor Your Site

### Free Analytics Options

1. **Google Analytics** - Most popular
2. **Plausible** - Privacy-focused
3. **Netlify Analytics** - Built-in (paid plan)

Add tracking code to `website/index.html` before `</head>`

---

## 🔄 Updating Your Website

### Quick Update
```bash
# Edit files in website/
git add website/
git commit -m "Update website"
git push

# Auto-deploys in 1-2 minutes!
```

---

## 🆘 Troubleshooting

### Site not showing up?
- Wait 5 minutes for deployment
- Check deployment logs
- Verify files are in correct folder

### 404 Error?
- Check file paths
- Ensure `index.html` exists in `website/`
- Verify deployment settings

### CSS not loading?
- Check file paths in HTML
- Ensure `styles.css` is in `website/` folder
- Clear browser cache

---

## 💡 Pro Tips

1. **Add a favicon** - Create `website/favicon.png`
2. **Use screenshots** - Add actual extension screenshots
3. **SEO optimization** - Update meta tags in `index.html`
4. **Social sharing** - Add Open Graph tags
5. **Performance** - Compress images before uploading

---

**Need help?** Check the `website/README.md` for more details!
