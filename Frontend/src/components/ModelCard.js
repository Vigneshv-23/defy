import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageCircle, FiKey, FiClock } from 'react-icons/fi';

function ModelCard({ model, onUse }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleGenerateApiKey = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }
    
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_URL}/api/generate-api-key`, {
        modelId: model.modelId,
        user: user.email,
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
              ${model.pricePerInference?.toFixed(2) || '0.00'}
            </span>
            <span className="text-sm text-gray-500 ml-2">per inference</span>
          </div>
          {model.category && (
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
              {model.category}
            </span>
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
            to={`/chat/${model.modelId}`}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center"
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
