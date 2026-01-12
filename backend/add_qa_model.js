// Script to add Q&A model to MongoDB
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Model from './src/models/Model.js';

dotenv.config({ path: './.env' });

async function addQAModel() {
  try {
    // Connect to MongoDB using the same connection string as the backend
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/inferchain';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if model already exists
    const existing = await Model.findOne({ blockchainModelId: '1' });
    if (existing) {
      console.log('📝 Model already exists, updating...');
      existing.name = 'Basic Q&A Model';
      existing.description = 'A simple Q&A model that answers basic questions about AI, blockchain, and how this platform works. Perfect for testing and demonstrations.';
      existing.ipfsCid = 'QmQAModelBasicQuestions';
      existing.pricePerMinute = 1000000000000000;
      existing.active = true;
      await existing.save();
      console.log('✅ Model updated:', existing.name);
    } else {
      // Create new model
      const qaModel = await Model.create({
        ownerWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        name: 'Basic Q&A Model',
        description: 'A simple Q&A model that answers basic questions about AI, blockchain, and how this platform works. Perfect for testing and demonstrations.',
        ipfsCid: 'QmQAModelBasicQuestions',
        pricePerMinute: 1000000000000000,
        blockchainModelId: '1',
        active: true
      });
      console.log('✅ Model created:', qaModel.name);
      console.log('   Blockchain ID:', qaModel.blockchainModelId);
      console.log('   Owner:', qaModel.ownerWallet);
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addQAModel();
