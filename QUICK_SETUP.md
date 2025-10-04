# 🚀 Quick Environment Setup Guide

## 📋 Prerequisites
- Node.js installed
- Git repository cloned
- Vercel account (for deployment)

## ⚡ Quick Start (Local Development)

### 1. Setup Environment Variables
```bash
# Run the setup script
cd frontend
npm run setup-env

# Or manually create .env.local with the content from ENVIRONMENT_SETUP.md
```

### 2. Install Dependencies & Start Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Test Application
- Open http://localhost:5173
- Login with owner credentials: `owner` / `owner123`
- Test all features

## 🌐 Vercel Deployment Setup

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub: `arogyamclinicare/nevergiveup`
4. Configure:
   - **Framework**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2. Set Environment Variables
Go to **Settings** → **Environment Variables** and add:**

#### Required Variables (Copy & Paste):
```bash
VITE_REACT_APP_SUPABASE_URL = https://cqltkqwxbtbnunaiknau.supabase.co
VITE_REACT_APP_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbHRrcXd4YnRibnVuYWlrbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzk0MTMsImV4cCI6MjA3NDgxNTQxM30.E2PdfGDzzLOpKUVt38DW1ojugqtMhAdMIq0lAMB2lsY
```

#### Security Variables (CHANGE THESE!):
```bash
VITE_REACT_APP_OWNER_USERNAME = your-secure-username
VITE_REACT_APP_OWNER_PASSWORD = your-secure-password
VITE_REACT_APP_STAFF_USERNAME = your-staff-username
VITE_REACT_APP_STAFF_PASSWORD = your-staff-password
VITE_REACT_APP_DEFAULT_PIN = your-secure-pin
```

#### Optional Variables:
```bash
VITE_REACT_APP_SESSION_TIMEOUT = 1800000
VITE_REACT_APP_MAX_LOGIN_ATTEMPTS = 3
VITE_REACT_APP_LOCKOUT_DURATION = 300000
VITE_REACT_APP_APP_NAME = Milk Delivery App
VITE_REACT_APP_VERSION = 1.0.0
VITE_REACT_APP_ENVIRONMENT = production
```

### 3. Deploy
1. Click **Deploy** in Vercel Dashboard
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

## 🔐 Security Checklist

### Before Production:
- [ ] Change all default credentials
- [ ] Use strong passwords (12+ characters)
- [ ] Update PIN from 6969
- [ ] Test authentication flow
- [ ] Verify settings access
- [ ] Check no console errors

### After Deployment:
- [ ] Test live application
- [ ] Verify all features work
- [ ] Test on mobile devices
- [ ] Check performance
- [ ] Monitor for errors

## 🛠️ Troubleshooting

### Common Issues:

#### **Build Fails**
- Check all environment variables are set
- Verify Supabase credentials
- Check for typos in variable names

#### **Login Not Working**
- Verify credentials are correct
- Check Supabase connection
- Clear browser cache

#### **Settings Access Denied**
- Verify PIN is correct
- Check environment variable is set
- Test with different PIN

### Debug Commands:
```bash
# Check environment variables
npm run dev
# Open browser console and check:
console.log(import.meta.env.VITE_REACT_APP_APP_NAME)

# Test build
npm run build
# Check for any missing variable warnings
```

## 📞 Support

If you encounter issues:
1. Check the detailed `ENVIRONMENT_SETUP.md` guide
2. Verify all environment variables are set correctly
3. Test locally first before deploying
4. Check Vercel build logs for errors

---

**Ready to deploy! 🎉**

Follow these steps for a smooth setup and deployment process.
