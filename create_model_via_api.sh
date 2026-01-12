#!/bin/bash

# Create Q&A model via API with manual blockchainModelId

API_URL="${API_URL:-http://localhost:5000}"

echo "Creating Q&A model via direct MongoDB update..."

# First, let's try to create it via a modified API call
# Since the blockchain registration already happened, we'll use a workaround

echo ""
echo "Model is already on blockchain with ID: 1"
echo ""
echo "To add it to MongoDB, you can:"
echo "  1. Use the frontend at /upload"
echo "     - Name: Basic Q&A Model"
echo "     - Description: A simple Q&A model..."
echo "     - IPFS CID: QmQAModelBasicQuestions"
echo "     - Price: 0.001 ETH per minute"
echo "     - It will try to register on blockchain, but since it's already there,"
echo "       you can manually set blockchainModelId to '1' in MongoDB"
echo ""
echo "OR"
echo ""
echo "  2. Use MongoDB directly:"
echo "     db.models.insertOne({"
echo "       ownerWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',"
echo "       name: 'Basic Q&A Model',"
echo "       description: 'A simple Q&A model...',"
echo "       ipfsCid: 'QmQAModelBasicQuestions',"
echo "       pricePerMinute: '1000000000000000',"
echo "       blockchainModelId: '1',"
echo "       active: true"
echo "     })"
echo ""
