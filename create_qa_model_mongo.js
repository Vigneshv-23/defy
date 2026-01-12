// Script to create Q&A model in MongoDB directly
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Model from './backend/src/models/Model.js';

dotenv.config();

async function createQAModel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inferchain');
    console.log('Connected to MongoDB');

    // Create the Q&A model
    const qaModel = await Model.create({
      ownerWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      name: 'Basic Q&A Model',
      description: 'A simple Q&A model that answers basic questions about AI, blockchain, and how this platform works. Perfect for testing and demonstrations.',
      ipfsCid: 'QmQAModelBasicQuestions',
      pricePerMinute: '1000000000000000',
      blockchainModelId: '1', // The model ID from blockchain
      active: true
    });

    console.log('✅ Q&A Model created in MongoDB:');
    console.log(JSON.stringify(qaModel.toObject(), null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createQAModel();
