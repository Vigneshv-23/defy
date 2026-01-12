import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import { FiMessageCircle, FiKey, FiClock, FiEdit } from 'react-icons/fi';
import { formatETH, parseETH } from '../utils/web3';
import { modelAPI } from '../utils/api';

function ModelCard({ model, onUse }) {
  const { user } = useAuth();
  const { account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');

  const handleGenerateApiKey = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }
    
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api-keys/generate`, {
        wallet: user.wallet || user.email, // Use wallet if available, else email
        modelId: model.blockchainModelId || model.modelId || model._id,
        durationHours: 24
      });
      
      setApiKey(response.data.apiKey);
      setShowApiKey(true);
      toast.success('API Key generated!');
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success('API Key copied to clipboard!');
  };

  // Check if current user is the model owner
  const isOwner = () => {
    if (!account || !model.ownerWallet) return false;
    return account.toLowerCase() === model.ownerWallet.toLowerCase();
  };

  const handleUpdatePrice = async () => {
    if (!isConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!model.blockchainModelId) {
      toast.error('This model is not on the blockchain yet');
      return;
    }

    try {
      setLoading(true);
      const priceInWei = parseETH(newPrice).toString();
      await modelAPI.updatePrice(model.blockchainModelId, priceInWei, account);
      toast.success('Price updated successfully!');
      setEditingPrice(false);
      setNewPrice('');
      // Refresh the model data
      if (onUse) onUse();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error.response?.data?.error || 'Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
      {/* Image */}
      <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
        {model.imageHash ? (
          <img 
            src={`https://ipfs.io/ipfs/${model.imageHash}`}
            alt={model.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="text-6xl">🤖</div>';
            }}
          />
        ) : (
          <div className="text-6xl">🤖</div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{model.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {model.description || 'No description available'}
        </p>

        {/* Price */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-2xl font-bold text-blue-600">
              {(() => {
                // Get price - could be in wei (string/number) or already in ETH (decimal)
                const price = model.pricePerMinute || model.pricePerInference || '0';
                
                // If price is a number less than 1, assume it's already in ETH
                const priceNum = typeof price === 'number' ? price : parseFloat(price);
                if (priceNum < 1 && priceNum > 0) {
                  return priceNum.toFixed(6);
                }
                
                // Otherwise, convert from wei to ETH
                const priceInETH = formatETH(price);
                return parseFloat(priceInETH).toFixed(6);
              })()} ETH
            </span>
            <span className="text-sm text-gray-500 ml-2">per minute</span>
          </div>
          {model.category && (
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
              {model.category}
            </span>
          )}
        </div>
        
        {/* Owner Info & Price Update */}
        <div className="mb-4">
          {model.ownerWallet && (
            <div className="text-xs text-gray-400 mb-2">
              Owner: {model.ownerWallet.slice(0, 6)}...{model.ownerWallet.slice(-4)}
            </div>
          )}
          
          {/* Price Update (Owner Only) */}
          {isOwner() && model.blockchainModelId && (
            <div className="mt-2">
              {editingPrice ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="New price (ETH)"
                    step="0.001"
                    min="0.001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdatePrice}
                      disabled={loading || !newPrice}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingPrice(false);
                        setNewPrice('');
                      }}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const currentPrice = model.pricePerMinute || '0';
                    setNewPrice(formatETH(currentPrice));
                    setEditingPrice(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  <FiEdit className="w-3 h-3" />
                  Update Price
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <FiClock className="w-4 h-4 mr-1" />
            {model.totalInferences || 0} uses
          </div>
          <div>
            Earnings: ${model.totalEarnings?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Link
            to={`/chat/${model.blockchainModelId || model._id}`}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center"
            onClick={(e) => {
              const id = model.blockchainModelId || model._id;
              if (!id) {
                e.preventDefault();
                toast.error('Model ID not available');
              } else {
                console.log('🔗 Navigating to chat with model:', { 
                  blockchainModelId: model.blockchainModelId, 
                  _id: model._id,
                  finalId: id 
                });
              }
            }}
          >
            <FiMessageCircle className="w-4 h-4 mr-2" />
            Start Chat
          </Link>

          <button
            onClick={handleGenerateApiKey}
            disabled={loading || !user}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center disabled:opacity-50"
          >
            <FiKey className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate API Key'}
          </button>

          {showApiKey && apiKey && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">API Key:</span>
                <button
                  onClick={copyApiKey}
                  className="text-xs text-green-600 hover:text-green-700"
                >
                  Copy
                </button>
              </div>
              <code className="text-xs text-green-700 break-all">{apiKey}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModelCard;
