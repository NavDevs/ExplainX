# ExplainX Website - Landing Page

Professional landing page for the ExplainX Chrome extension.

## 🚀 Quick Deploy (Free)

### Option 1: GitHub Pages (Recommended)

1. **Create a GitHub repository** (if you haven't already)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Select **main** branch
   - Click **Save**

3. **Your site will be live at:**
   ```
   https://YOUR_USERNAME.github.io/ExplainX
   ```

---

### Option 2: Netlify (Easiest)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `website` folder
3. Done! Your site is live

**Custom domain:** You can add a free custom domain later

---

### Option 3: Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy automatically

---

## 📁 File Structure

```
website/
├── index.html          # Main landing page
├── styles.css          # All styles
├── script.js           # Interactive features
└── README.md           # This file
```

---

## 🎨 Features

✅ **Fully Responsive** - Works on all devices  
✅ **Fast Loading** - No frameworks, pure HTML/CSS/JS  
✅ **SEO Optimized** - Meta tags and semantic HTML  
✅ **Modern Design** - Clean, professional UI  
✅ **Interactive** - Smooth animations and transitions  
✅ **Free Hosting** - Multiple free deployment options  

---

## 🔧 Customization

### Update Download Links

In `index.html`, replace `YOUR_USERNAME` with your GitHub username:

```html
<!-- Line ~196 -->
<a href="https://github.com/YOUR_USERNAME/ExplainX/releases/latest" ...>

<!-- Line ~240 -->
<a href="https://github.com/YOUR_USERNAME/ExplainX" ...>

<!-- Line ~244 -->
<a href="https://github.com/YOUR_USERNAME/ExplainX/issues" ...>
```

### Update Version Number

In `index.html`, line ~205:
```html
<span>Version 1.0.0</span>
```

### Change Colors

In `styles.css`, edit the CSS variables at the top:
```css
:root {
  --primary-color: #1a73e8;      /* Main blue */
  --primary-dark: #1557b0;       /* Darker blue */
  --bg-color: #ffffff;           /* Background */
  /* ... more colors ... */
}
```

---

## 📸 Screenshots

Add screenshots to a `screenshots/` folder and update the hero section to show actual extension UI.

---

## 🚀 Updating the Website

### Quick Updates
1. Edit the HTML/CSS files
2. Commit changes
3. Push to GitHub
4. Site updates automatically (GitHub Pages)

### Adding Screenshots
```bash
mkdir screenshots
# Add your screenshots here
# Update index.html to reference them
```

---

## 📊 Analytics (Optional)

Add Google Analytics or Plausible by inserting the tracking code in `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_ID');
</script>
```

---

## 🎯 Next Steps

1. ✅ Deploy to GitHub Pages
2. ✅ Add real screenshots
3. ✅ Update GitHub links
4. ✅ Set up GitHub Releases
5. ✅ Add analytics (optional)
6. ✅ Share with users!

---

## 📝 License

MIT License - Free to use and modify
