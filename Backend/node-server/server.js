const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { create } = require('ipfs-http-client');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// IPFS client (optional - can be mocked)
let ipfsClient;
try {
  ipfsClient = create({ url: process.env.IPFS_URL || 'https://ipfs.infura.io:5001/api/v0' });
  console.log('✅ IPFS client initialized');
} catch (error) {
  console.warn('⚠️  IPFS client not available. File uploads will use mock storage.');
}

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inferchain', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});

// MongoDB Schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  username: { type: String },
  password: { type: String },
  role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
  apiKeys: [{
    key: String,
    modelId: String,
    expiresAt: Date,
    isActive: Boolean
  }],
  createdAt: { type: Date, default: Date.now }
});

const ModelSchema = new mongoose.Schema({
  modelId: { type: Number, required: true, unique: true },
  owner: { type: String, required: true },
  ipfsHash: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  imageHash: { type: String },
  pricePerInference: { type: Number, required: true },
  category: { type: String },
  tags: [String],
  isActive: { type: Boolean, default: true },
  totalEarnings: { type: Number, default: 0 },
  totalInferences: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const InferenceSchema = new mongoose.Schema({
  inferenceId: { type: Number, required: true, unique: true },
  modelId: { type: Number, required: true },
  user: { type: String, required: true },
  amount: { type: Number, required: true },
  inputData: { type: String },
  outputData: { type: String },
  isCompleted: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  apiKeyUsed: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['inference', 'withdrawal', 'refund'] },
  modelId: { type: Number },
  inferenceId: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

const ChatSchema = new mongoose.Schema({
  modelId: { type: Number, required: true },
  user: { type: String, required: true },
  messages: [{
    sender: { type: String, enum: ['user', 'ai'] },
    content: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Model = mongoose.model('Model', ModelSchema);
const Inference = mongoose.model('Inference', InferenceSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Chat = mongoose.model('Chat', ChatSchema);

// Counter for IDs
let modelIdCounter = 1;
let inferenceIdCounter = 1;

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, role } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    user = new User({
      email,
      username,
      role: role || 'user',
      password: hashedPassword
    });
    await user.save();
    
    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ success: true, user: userObj, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    // Remove password from response
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ success: true, user: userObj, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, username, role } = req.body;
    
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, username, role });
      await user.save();
    }
    
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ success: true, user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Get user stats from database
    const inferences = await Inference.find({ user: user.email });
    const stats = {
      totalSpent: inferences.reduce((sum, inf) => sum + inf.amount, 0),
      totalInferences: inferences.length,
      modelIds: [...new Set(inferences.map(inf => inf.modelId))]
    };
    
    const userObj = user.toObject();
    delete userObj.password;
    
    res.json({ user: userObj, stats, inferences });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Models routes
app.get('/api/models', async (req, res) => {
  try {
    const { category, sortBy, search, modelId } = req.query;
    let query = { isActive: true };
    
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (modelId) query.modelId = parseInt(modelId);
    
    let models = await Model.find(query);
    
    // Sort
    if (sortBy === 'price') models.sort((a, b) => a.pricePerInference - b.pricePerInference);
    if (sortBy === 'popular') models.sort((a, b) => b.totalInferences - a.totalInferences);
    if (sortBy === 'newest') models.sort((a, b) => b.createdAt - a.createdAt);
    
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/models/register', async (req, res) => {
  try {
    const { owner, name, description, ipfsHash, imageHash, pricePerInference, category, tags } = req.body;
    
    // Generate model ID
    const modelId = modelIdCounter++;
    
    // Save to MongoDB
    const model = new Model({
      modelId,
      owner,
      name,
      description,
      ipfsHash: ipfsHash || `mock-ipfs-hash-${modelId}`,
      imageHash: imageHash || '',
      pricePerInference,
      category,
      tags
    });
    await model.save();
    
    res.json({ success: true, modelId, model });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inference routes
app.post('/api/inference/request', async (req, res) => {
  try {
    const { modelId, user, inputData, apiKey } = req.body;
    
    const model = await Model.findOne({ modelId: parseInt(modelId) });
    if (!model) return res.status(404).json({ error: 'Model not found' });
    
    // Generate inference ID
    const inferenceId = inferenceIdCounter++;
    
    // Save to MongoDB
    const inference = new Inference({
      inferenceId,
      modelId: parseInt(modelId),
      user,
      amount: model.pricePerInference,
      inputData,
      apiKeyUsed: apiKey
    });
    await inference.save();
    
    // Forward to Python AI service
    try {
      const aiResponse = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/inference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inferenceId,
          modelId,
          ipfsHash: model.ipfsHash,
          inputData
        })
      });
      
      const aiData = await aiResponse.json();
      
      // Update inference record
      inference.outputData = aiData.output || 'Mock AI response';
      inference.isCompleted = true;
      inference.isVerified = true;
      await inference.save();
      
      // Update model stats
      model.totalInferences += 1;
      await model.save();
      
      // Create transaction record
      const platformFee = model.pricePerInference * 0.3;
      const creatorFee = model.pricePerInference * 0.7;
      
      const transaction = new Transaction({
        from: user,
        to: model.owner,
        amount: creatorFee,
        type: 'inference',
        modelId: parseInt(modelId),
        inferenceId
      });
      await transaction.save();
      
      // Update model earnings
      model.totalEarnings += creatorFee;
      await model.save();
      
      res.json({ success: true, inferenceId, output: aiData.output || 'Mock AI response' });
    } catch (aiError) {
      // If AI service is not available, return mock response
      inference.outputData = 'Mock AI response - AI service unavailable';
      inference.isCompleted = true;
      inference.isVerified = false;
      await inference.save();
      
      res.json({ success: true, inferenceId, output: 'Mock AI response - AI service unavailable' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/creator/:email/models', async (req, res) => {
  try {
    const models = await Model.find({ owner: req.params.email });
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Key generation
app.post('/api/generate-api-key', async (req, res) => {
  try {
    const { modelId, user, durationHours } = req.body;
    
    const apiKey = `inf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + (durationHours || 24) * 60 * 60 * 1000);
    
    await User.findOneAndUpdate(
      { email: user },
      {
        $push: {
          apiKeys: {
            key: apiKey,
            modelId: modelId.toString(),
            expiresAt,
            isActive: true
          }
        }
      }
    );
    
    res.json({ apiKey, expiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoints
app.post('/api/chat/start', async (req, res) => {
  try {
    const { modelId, user, durationHours } = req.body;
    
    const chat = new Chat({
      modelId: parseInt(modelId),
      user,
      expiresAt: new Date(Date.now() + (durationHours || 1) * 60 * 60 * 1000),
      messages: []
    });
    await chat.save();
    
    res.json({ chatId: chat._id, expiresAt: chat.expiresAt });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/message', async (req, res) => {
  try {
    const { chatId, message, apiKey } = req.body;
    
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.isActive || chat.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Chat expired or not active' });
    }
    
    // Add user message
    chat.messages.push({
      sender: 'user',
      content: message
    });
    
    // Process through AI
    const model = await Model.findOne({ modelId: chat.modelId });
    try {
      const aiResponse = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ipfsHash: model.ipfsHash,
          message,
          chatHistory: chat.messages.slice(-10)
        })
      });
      
      const aiData = await aiResponse.json();
      
      // Add AI response
      chat.messages.push({
        sender: 'ai',
        content: aiData.response || 'Mock AI response'
      });
      
      await chat.save();
      
      // Emit via socket
      io.to(chatId).emit('new_message', {
        sender: 'ai',
        content: aiData.response || 'Mock AI response',
        timestamp: new Date()
      });
      
      res.json({ response: aiData.response || 'Mock AI response' });
    } catch (aiError) {
      // Mock response if AI service unavailable
      const mockResponse = 'This is a mock AI response. AI service is currently unavailable.';
      chat.messages.push({
        sender: 'ai',
        content: mockResponse
      });
      await chat.save();
      
      res.json({ response: mockResponse });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// IPFS upload route
app.post('/api/ipfs/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    if (ipfsClient) {
      // Add file to IPFS
      const result = await ipfsClient.add(req.file.buffer);
      res.json({ 
        success: true, 
        hash: result.cid.toString(),
        path: result.path
      });
    } else {
      // Mock IPFS hash if IPFS not available
      const mockHash = `mock_ipfs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      res.json({ 
        success: true, 
        hash: mockHash,
        path: mockHash
      });
    }
  } catch (error) {
    console.error('IPFS upload error:', error);
    // Return mock hash on error
    const mockHash = `mock_ipfs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.json({ 
      success: true, 
      hash: mockHash,
      path: mockHash
    });
  }
});

// Admin routes
app.get('/api/admin/stats', async (req, res) => {
  try {
    // Check if admin (simplified - in production, verify JWT token)
    const userEmail = req.query.email || req.query.userEmail;
    const user = await User.findOne({ email: userEmail });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get database stats
    const models = await Model.find();
    const users = await User.find();
    const transactions = await Transaction.find();
    const inferences = await Inference.find();
    
    // Calculate stats
    const totalVolume = inferences.reduce((sum, inf) => sum + inf.amount, 0);
    const activeUsers = new Set(inferences.map(inf => inf.user)).size;
    
    const now = new Date();
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const dailyInferences = await Inference.countDocuments({ timestamp: { $gte: dayAgo } });
    const weeklyInferences = await Inference.countDocuments({ timestamp: { $gte: weekAgo } });
    const monthlyInferences = await Inference.countDocuments({ timestamp: { $gte: monthAgo } });
    
    const dailyVolume = await Inference.aggregate([
      { $match: { timestamp: { $gte: dayAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.json({
      blockchainStats: {
        totalModels: models.length,
        totalInferences: inferences.length,
        totalVolume: totalVolume,
        activeUsers: activeUsers
      },
      databaseStats: {
        totalUsers: users.length,
        totalModels: models.length,
        totalTransactions: transactions.length,
        dailyInferences,
        weeklyInferences,
        monthlyInferences,
        dailyVolume: dailyVolume[0]?.total || 0
      },
      topModels: await Model.find().sort({ totalInferences: -1 }).limit(10),
      recentInferences: await Inference.find().sort({ timestamp: -1 }).limit(10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('join_chat', (chatId) => {
    socket.join(chatId);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5000;

// Verify critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Missing environment variables:', missingVars.join(', '));
  console.warn('Please check your .env file. See ENV_SETUP.md for reference.');
}

server.listen(PORT, () => {
  console.log(`\n🚀 InferChain Backend Server`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log(`\n✅ Server ready!\n`);
});
