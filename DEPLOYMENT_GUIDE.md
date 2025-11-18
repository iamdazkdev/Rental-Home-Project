# 🚀 Deployment Guide - Dream Nest

## 🎯 **Recommended: Hybrid Deployment**

### **Frontend: Vercel**
### **Backend: Railway** 
### **Database: MongoDB Atlas** (already configured)

---

## 📱 **Frontend Deployment (Vercel)**

### Step 1: Prepare React App
```bash
cd client
npm run build  # Test build locally first
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Connect your GitHub account
3. Import your repository
4. Set root directory to `client`
5. Deploy!

### Step 3: Environment Variables
Add these in Vercel dashboard:
```env
REACT_APP_API_URL=https://your-backend-url.railway.app
```

---

## 🖥️ **Backend Deployment (Railway)**

### Step 1: Prepare for Railway
Create `railway.json` in server folder:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

### Step 2: Add Health Check
Add to your `server/index.js`:
```javascript
// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});
```

### Step 3: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Connect GitHub
3. Deploy from `server` folder
4. Set environment variables (copy from your .env)

### Step 4: Environment Variables for Railway
```env
NODE_ENV=production
MONGO_URL=your_mongodb_atlas_url
JWT_SECRET=your_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_gmail
EMAIL_APP_PASSWORD=your_app_password
CLIENT_URL=https://your-vercel-app.vercel.app
PORT=3001
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

---

## 🔄 **Connect Frontend to Backend**

### Update API Base URL
Create `client/src/config/api.js`:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-railway-app.railway.app' 
  : 'http://localhost:3001';

export default API_BASE_URL;
```

### Update Your API Calls
Replace hardcoded localhost URLs:
```javascript
// Before
fetch('http://localhost:3001/auth/login', ...)

// After  
import API_BASE_URL from '../config/api';
fetch(`${API_BASE_URL}/auth/login`, ...)
```

---

## 📧 **Email Service in Production**

Your Gmail SMTP will work perfectly in production! Just make sure:
1. ✅ 2FA enabled on Gmail
2. ✅ App Password generated
3. ✅ Environment variables set on Railway
4. ✅ `CLIENT_URL` points to your Vercel app

---

## 📁 **File Upload Solution**

### Option 1: Cloudinary (Recommended)
```bash
npm install cloudinary multer-storage-cloudinary
```

### Option 2: AWS S3
```bash
npm install aws-sdk multer-s3
```

### Option 3: Keep local storage
- Railway has persistent storage
- Files will survive deployments

---

## ✅ **Deployment Checklist**

### Before Deploying:
- [ ] Test build locally: `npm run build`
- [ ] Environment variables ready
- [ ] MongoDB Atlas connection string updated
- [ ] Email credentials configured
- [ ] API URLs updated in React app

### After Deploying:
- [ ] Test user registration
- [ ] Test login/logout  
- [ ] Test forgot password email
- [ ] Test file uploads
- [ ] Test all major features

---

## 🆓 **Cost Breakdown (Free Tiers)**

| Service | Free Tier | Perfect For |
|---------|-----------|-------------|
| **Vercel** | 100GB bandwidth/month | Frontend |
| **Railway** | $5 credit/month | Backend API |
| **MongoDB Atlas** | 512MB storage | Database |
| **Cloudinary** | 25 credits/month | Images |

**Total Cost: FREE** for development and small projects!

---

## 🚀 **Alternative: Full Vercel Deployment**

If you want everything on Vercel, you'll need to:
1. Convert Express.js to Vercel API Routes
2. Update file upload to Vercel Blob
3. Refactor some backend code

**This requires more work but gives you:**
- Single platform management
- Better integration
- Vercel's excellent DX

---

## 🎯 **Which Option Do You Want?**

**Quick & Easy (Recommended):**
- Frontend: Vercel
- Backend: Railway 
- Ready in 30 minutes!

**Full Vercel (More Advanced):**
- Everything on Vercel
- Requires code refactoring
- Takes 2-3 hours

Let me know which path you'd like to take and I'll help you deploy! 🚀