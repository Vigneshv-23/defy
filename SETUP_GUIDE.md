# InferChain Setup Guide (Simplified - No Blockchain)

Complete step-by-step guide to set up and run InferChain without blockchain dependencies.

## 🎯 Overview

This version of InferChain works entirely with:
- **MongoDB** for data storage
- **Node.js/Express** for backend API
- **React** for frontend
- **Python FastAPI** (optional) for AI inference

**No blockchain, no wallets, no smart contracts required!**

---

## ✅ Prerequisites

- [ ] Node.js (v18+) installed
- [ ] MongoDB installed (or MongoDB Atlas account)
- [ ] Python 3.10+ (optional, for AI service)
- [ ] Git (optional)

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Setup MongoDB

**Option A: Local MongoDB**
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Open MongoDB Compass
4. Create database: `inferchain`
   - **Important**: UNCHECK "Time-Series" checkbox
   - Collections will be created automatically

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster
4. Get connection string (replace `<password>` and `<dbname>`)

---

### Step 2: Setup Backend

```bash
# Navigate to backend
cd Backend/node-server

# Install dependencies
npm install

# Create .env file
copy .env.example .env
# Or create .env manually
```

**Edit `Backend/node-server/.env`:**
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/inferchain
JWT_SECRET=your_random_32_character_string_here
AI_SERVICE_URL=http://localhost:8000
```

**Generate JWT_SECRET:**
```bash
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use any random 32+ character string
```

**Start backend:**
```bash
npm start
# Or for development (auto-reload):
npm run dev
```

✅ Backend running on http://localhost:5000

---

### Step 3: Setup Frontend

```bash
# Navigate to frontend (new terminal)
cd Frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
# Or create .env manually
```

**Edit `Frontend/.env`:**
```env
REACT_APP_API_URL=http://localhost:5000
```

**Start frontend:**
```bash
npm start
```

✅ Frontend opens at http://localhost:3000

---

### Step 4: (Optional) Setup Python AI Service

```bash
# Navigate to python service (new terminal)
cd Backend

# Install Python dependencies
pip install -r requirements.txt

# Start Python service
cd python-ai
python app.py
```

✅ AI service runs on http://localhost:8000

**Note**: If AI service is not running, the backend will return mock responses.

---

## 🎉 You're Done!

### Test Your Setup

1. **Open browser**: http://localhost:3000
2. **Sign Up**:
   - Click "Login" → "Sign Up"
   - Enter email, username, password
   - Click "Sign Up"
3. **Browse Models**: Click "Marketplace"
4. **Upload Model** (as creator):
   - Go to "Upload Model"
   - Fill in details and upload
5. **Test Chat**: Click on any model → "Start Chat"

---

## 📋 Environment Variables Summary

### Backend (`Backend/node-server/.env`)
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/inferchain
JWT_SECRET=your_secret_key_32_chars_min
AI_SERVICE_URL=http://localhost:8000
IPFS_URL=https://ipfs.infura.io:5001/api/v0  # Optional
```

### Frontend (`Frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000
```

---

## 👤 Creating Admin User

**Option 1: Through MongoDB**

```javascript
// In MongoDB Compass or mongosh
use inferchain
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: During Registration**

Temporarily modify the registration endpoint or sign up first, then update role in MongoDB.

---

## 🔍 Verification Checklist

- [ ] MongoDB running
- [ ] Backend server running (port 5000)
- [ ] Frontend running (port 3000)
- [ ] Can sign up new user
- [ ] Can login
- [ ] Can browse marketplace
- [ ] Can upload model (as creator)
- [ ] Can start chat
- [ ] Admin dashboard accessible (if admin)

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: MongoDB connection error
- ✅ Check MongoDB is running
- ✅ Verify MONGODB_URI in .env
- ✅ Check connection string format

**Problem**: Port already in use
- ✅ Change PORT in .env
- ✅ Or stop other services using port 5000

**Problem**: Dependencies not installed
- ✅ Run `npm install` in Backend/node-server

### Frontend Issues

**Problem**: Can't connect to backend
- ✅ Verify REACT_APP_API_URL in Frontend/.env
- ✅ Check backend is running
- ✅ Check browser console for errors

**Problem**: CORS errors
- ✅ Verify FRONTEND_URL in backend .env
- ✅ Check backend CORS settings

### General Issues

**Problem**: Models not appearing
- ✅ Check MongoDB collections exist
- ✅ Verify models in database
- ✅ Check API response in browser dev tools

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Models
- `GET /api/models` - Get all models
- `POST /api/models/register` - Register model

### Inference
- `POST /api/inference/request` - Request inference
- `POST /api/generate-api-key` - Generate API key

### Chat
- `POST /api/chat/start` - Start chat
- `POST /api/chat/message` - Send message

### Admin
- `GET /api/admin/stats` - Get statistics

---

## 🎨 Features

✅ User authentication (email/password)
✅ Model upload and management
✅ Model marketplace
✅ Chat interface with AI models
✅ API key generation
✅ Transaction tracking (in database)
✅ Admin dashboard
✅ 70/30 revenue split (tracked in database)

---

## 📝 Next Steps

1. **Customize**: Update branding, colors, styles
2. **Add Real AI Models**: Integrate your AI models
3. **Deploy**: Deploy to cloud hosting
4. **Add Features**: Enhance with additional functionality

---

## 🆘 Need Help?

- Check console logs for errors
- Verify all environment variables
- Ensure MongoDB is running
- Check all services are started
- Review SIMPLIFIED_IMPLEMENTATION.md for details

**Happy Coding! 🚀**

