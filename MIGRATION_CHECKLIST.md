# ✅ Migration Checklist: Netlify → Vercel

## Pre-Migration

- [x] Build project successfully
- [x] Create `vercel.json` configuration
- [x] Update `.gitignore`
- [x] Initialize git repository
- [ ] Copy `.env` values (you'll need these!)

---

## Step 1: GitHub Setup (5 minutes)

### 1.1 Create GitHub Repository
- [ ] Go to https://github.com/new
- [ ] Name: `1729-teaming-ecosystem`
- [ ] Visibility: Private (recommended)
- [ ] **Don't** initialize with README
- [ ] Click "Create repository"

### 1.2 Push Code
```bash
# Option A: Use the script
bash deploy-to-github.sh

# Option B: Manual commands
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/1729-teaming-ecosystem.git
git branch -M main
git push -u origin main
```

- [ ] Code pushed to GitHub
- [ ] Verify files are visible on GitHub

---

## Step 2: Vercel Setup (5 minutes)

### 2.1 Sign Up
- [ ] Go to https://vercel.com/signup
- [ ] Click "Continue with GitHub"
- [ ] Authorize Vercel

### 2.2 Import Project
- [ ] Click "Add New..." → "Project"
- [ ] Select `1729-teaming-ecosystem`
- [ ] Click "Import"

### 2.3 Configure
- [ ] Framework: Create React App (auto-detected)
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`
- [ ] Root Directory: `./`

### 2.4 Environment Variables
Add these from your `.env` file:

- [ ] `REACT_APP_SUPABASE_URL` = `_______________`
- [ ] `REACT_APP_SUPABASE_ANON_KEY` = `_______________`

### 2.5 Deploy
- [ ] Click "Deploy"
- [ ] Wait 2-3 minutes
- [ ] Note your URL: `https://________________.vercel.app`

---

## Step 3: Test Deployment (10 minutes)

### 3.1 Basic Tests
- [ ] Visit Vercel URL
- [ ] Login page loads
- [ ] Can create account
- [ ] Payment page works
- [ ] Onboarding flow works
- [ ] Dashboard loads
- [ ] All 5 pages accessible

### 3.2 Functionality Tests
- [ ] Can answer questions
- [ ] Gift card auto-creation works
- [ ] Trust team displays
- [ ] Can create new gift cards
- [ ] Can request support

---

## Step 4: Update Supabase (5 minutes)

### 4.1 Add Vercel URLs
Go to Supabase Dashboard → Settings → Authentication

- [ ] Site URL: `https://your-project.vercel.app`
- [ ] Redirect URLs: Add `https://your-project.vercel.app/**`

### 4.2 Test Authentication
- [ ] Logout and login again
- [ ] Verify auth works with new URL

---

## Step 5: Custom Domain (Optional, 15 minutes)

### 5.1 Add Domain in Vercel
- [ ] Project Settings → Domains
- [ ] Enter domain name
- [ ] Click "Add"

### 5.2 Configure DNS
Choose one:

**Option A: Vercel Nameservers (Recommended)**
- [ ] Copy nameservers from Vercel
- [ ] Update at your domain registrar
- [ ] Wait for propagation (5-30 min)

**Option B: DNS Records**
- [ ] Add A record: `76.76.21.21`
- [ ] Add CNAME: `cname.vercel-dns.com`
- [ ] Wait for propagation

### 5.3 Update Supabase
- [ ] Add custom domain to Supabase redirect URLs
- [ ] Test authentication with custom domain

---

## Step 6: Cleanup Netlify (5 minutes)

### 6.1 Before Canceling
- [ ] Verify Vercel deployment works 100%
- [ ] Test all features on Vercel
- [ ] Update any external links

### 6.2 Cancel Netlify
- [ ] Go to Netlify site settings
- [ ] Delete deployment
- [ ] Cancel domain subscription
- [ ] Cancel account (optional)

---

## Troubleshooting

### Build Fails
```bash
# Check locally first
npm run build

# If it works locally, check:
# - Environment variables in Vercel
# - Build logs in Vercel dashboard
```

### Environment Variables Not Working
- Must start with `REACT_APP_`
- Redeploy after adding variables
- Check spelling and values

### 404 on Page Refresh
- Should be fixed by `vercel.json`
- Check rewrites configuration
- Redeploy if needed

### Authentication Issues
- Verify Supabase URLs are updated
- Check redirect URLs include Vercel domain
- Clear browser cache and cookies

---

## Quick Reference

### Your URLs
- GitHub: `https://github.com/YOUR_USERNAME/1729-teaming-ecosystem`
- Vercel: `https://________________.vercel.app`
- Custom Domain: `https://________________` (if applicable)

### Environment Variables
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

### Deploy Commands
```bash
# Push to GitHub (auto-deploys to Vercel)
git add .
git commit -m "Your changes"
git push

# Manual deploy (if needed)
vercel --prod
```

---

## Cost Savings

| Service | Before (Netlify) | After (Vercel) | Savings |
|---------|------------------|----------------|---------|
| Hosting | Free | Free | $0 |
| Domain | $19-29/year | Free | $19-29/year |
| **Total** | **$19-29/year** | **$0/year** | **$19-29/year** |

---

## Timeline

- **GitHub Setup**: 5 minutes
- **Vercel Deployment**: 5 minutes
- **Testing**: 10 minutes
- **Supabase Update**: 5 minutes
- **Custom Domain** (optional): 15 minutes
- **Total**: 25-40 minutes

---

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- This Project: See `VERCEL_DEPLOYMENT.md`

---

**Ready to migrate?** Start with Step 1! 🚀
