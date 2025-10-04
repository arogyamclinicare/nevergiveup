# Environment Variables Configuration Guide

## 🔧 Local Development Setup

### 1. Create Local Environment File
Create `frontend/.env.local` with the following content:

```bash
# Supabase Configuration
VITE_REACT_APP_SUPABASE_URL=your-supabase-url-here
VITE_REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Authentication Credentials (CHANGE THESE!)
VITE_REACT_APP_OWNER_USERNAME=your-secure-username
VITE_REACT_APP_OWNER_PASSWORD=your-secure-password
VITE_REACT_APP_STAFF_USERNAME=your-staff-username
VITE_REACT_APP_STAFF_PASSWORD=your-staff-password

# Settings PIN (CHANGE THIS!)
VITE_REACT_APP_DEFAULT_PIN=your-secure-pin

# Session Configuration
VITE_REACT_APP_SESSION_TIMEOUT=1800000
VITE_REACT_APP_MAX_LOGIN_ATTEMPTS=3
VITE_REACT_APP_LOCKOUT_DURATION=300000

# App Configuration
VITE_REACT_APP_APP_NAME=Milk Delivery App
VITE_REACT_APP_VERSION=1.0.0
VITE_REACT_APP_ENVIRONMENT=development
```

## 🚀 Vercel Production Setup

### 1. Access Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### 2. Add Environment Variables

#### **Required Variables (Must Set):**

```bash
# Supabase Configuration
VITE_REACT_APP_SUPABASE_URL
Value: https://cqltkqwxbtbnunaiknau.supabase.co

VITE_REACT_APP_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxbHRrcXd4YnRibnVuYWlrbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzk0MTMsImV4cCI6MjA3NDgxNTQxM30.E2PdfGDzzLOpKUVt38DW1ojugqtMhAdMIq0lAMB2lsY
```

#### **Security Variables (CHANGE THESE!):**

```bash
# Owner Credentials
VITE_REACT_APP_OWNER_USERNAME
Value: your-secure-owner-username

VITE_REACT_APP_OWNER_PASSWORD
Value: your-secure-owner-password

# Staff Credentials
VITE_REACT_APP_STAFF_USERNAME
Value: your-secure-staff-username

VITE_REACT_APP_STAFF_PASSWORD
Value: your-secure-staff-password

# Settings PIN
VITE_REACT_APP_DEFAULT_PIN
Value: your-secure-pin
```

#### **Optional Variables (Recommended):**

```bash
# Session Configuration
VITE_REACT_APP_SESSION_TIMEOUT
Value: 1800000

VITE_REACT_APP_MAX_LOGIN_ATTEMPTS
Value: 3

VITE_REACT_APP_LOCKOUT_DURATION
Value: 300000

# App Configuration
VITE_REACT_APP_APP_NAME
Value: Milk Delivery App

VITE_REACT_APP_VERSION
Value: 1.0.0

VITE_REACT_APP_ENVIRONMENT
Value: production
```

## 🔐 Security Best Practices

### 1. Credential Security
- **Never use default credentials in production**
- Use strong, unique passwords (minimum 12 characters)
- Include numbers, symbols, and mixed case
- Consider using password managers

### 2. PIN Security
- **Change default PIN from 6969**
- Use a memorable but secure PIN
- Consider implementing PIN rotation
- Avoid sequential or repeated digits

### 3. Environment Separation
- Use different credentials for development and production
- Never commit `.env.local` to version control
- Use Vercel's environment variable encryption

## 📋 Step-by-Step Vercel Configuration

### Step 1: Access Environment Variables
1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar

### Step 2: Add Each Variable
For each variable:
1. Click **Add New**
2. Enter the **Name** (exactly as shown)
3. Enter the **Value**
4. Select **Environment**: Production, Preview, Development (or All)
5. Click **Save**

### Step 3: Verify Configuration
After adding all variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Check the build logs for any errors

## 🧪 Testing Environment Variables

### Local Testing
```bash
# Start development server
cd frontend
npm run dev

# Check if variables are loaded
# Open browser console and check:
console.log(import.meta.env.VITE_REACT_APP_APP_NAME)
```

### Production Testing
1. Deploy to Vercel
2. Open the live application
3. Test login functionality
4. Verify all features work correctly

## 🔍 Troubleshooting

### Common Issues

#### **Variable Not Loading**
- Check variable name spelling (case-sensitive)
- Ensure variable starts with `VITE_REACT_APP_`
- Verify the variable is set in the correct environment

#### **Build Failures**
- Check all required variables are set
- Verify Supabase URL and key are correct
- Check for typos in variable names

#### **Runtime Errors**
- Test authentication with correct credentials
- Verify Supabase connection
- Check browser console for errors

### Debug Commands
```bash
# Check environment variables in build
npm run build
# Look for any missing variable warnings

# Test local development
npm run dev
# Check browser console for variable values
```

## 📊 Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_REACT_APP_SUPABASE_URL` | ✅ | Supabase project URL | `https://xxx.supabase.co` |
| `VITE_REACT_APP_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `VITE_REACT_APP_OWNER_USERNAME` | ✅ | Owner login username | `admin` |
| `VITE_REACT_APP_OWNER_PASSWORD` | ✅ | Owner login password | `SecurePass123!` |
| `VITE_REACT_APP_STAFF_USERNAME` | ✅ | Staff login username | `staff` |
| `VITE_REACT_APP_STAFF_PASSWORD` | ✅ | Staff login password | `StaffPass456!` |
| `VITE_REACT_APP_DEFAULT_PIN` | ✅ | Settings access PIN | `1234` |
| `VITE_REACT_APP_SESSION_TIMEOUT` | ❌ | Session timeout (ms) | `1800000` |
| `VITE_REACT_APP_MAX_LOGIN_ATTEMPTS` | ❌ | Max login attempts | `3` |
| `VITE_REACT_APP_LOCKOUT_DURATION` | ❌ | Lockout duration (ms) | `300000` |
| `VITE_REACT_APP_APP_NAME` | ❌ | Application name | `Milk Delivery App` |
| `VITE_REACT_APP_VERSION` | ❌ | Application version | `1.0.0` |
| `VITE_REACT_APP_ENVIRONMENT` | ❌ | Environment type | `production` |

## ✅ Verification Checklist

- [ ] All required variables set in Vercel
- [ ] Security credentials changed from defaults
- [ ] Supabase connection working
- [ ] Authentication flow tested
- [ ] Settings access working
- [ ] No console errors
- [ ] Application deployed successfully

---

**Your environment is now properly configured! 🎉**

Follow this guide to set up both local development and production environments with secure credentials.
