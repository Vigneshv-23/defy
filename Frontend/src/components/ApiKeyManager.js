import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiKey, FiCopy, FiRefreshCw, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

function ApiKeyManager() {
  const { account, isConnected } = useWeb3();
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [durationHours, setDurationHours] = useState('24');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState([]);
  const [newApiKey, setNewApiKey] = useState(null);

  useEffect(() => {
    if (account || user?.wallet) {
      fetchApiKeys();
      fetchModels();
    }
  }, [account, user]);

  const fetchApiKeys = async () => {
    try {
      const wallet = account || user?.wallet;
      if (!wallet) return;

      const API_URL = process.env.REACT_APP_API_URL || 'https://nondisastrously-ungrazed-hang.ngrok-free.dev';
      const res = await api.get('/api-keys', { params: { wallet } });
      setApiKeys(res.data);
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchModels = async () => {
    try {
      const res = await api.get('/models');
      setModels(res.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!selectedModelId) {
      toast.error('Please select a model');
      return;
    }

    const wallet = account || user?.wallet;
    if (!wallet) {
      toast.error('Please connect your wallet or login');
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://nondisastrously-ungrazed-hang.ngrok-free.dev';
      const res = await api.post('/api-keys/generate', {
        wallet,
        modelId: selectedModelId,
        durationHours: parseInt(durationHours)
      });

      setNewApiKey(res.data);
      toast.success('API key generated!');
      fetchApiKeys();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard!');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const isExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">API Key Manager</h1>
        <p className="text-gray-600">Generate and manage API keys for model access</p>
      </div>

      {!isConnected && !user && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please connect your wallet or login to generate API keys</p>
        </div>
      )}

      {/* Generate New API Key */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Generate New API Key</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Model
            </label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a model...</option>
              {models.map((model) => (
                <option key={model._id || model.blockchainModelId} value={model.blockchainModelId || model._id}>
                  {model.name} (ID: {model.blockchainModelId || model._id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (hours)
            </label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
              min="1"
              max="720"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleGenerateApiKey}
            disabled={loading || !selectedModelId}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FiKey />
            {loading ? 'Generating...' : 'Generate API Key'}
          </button>
        </div>

        {newApiKey && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">✅ API Key Generated!</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded text-sm font-mono break-all">
                {newApiKey.apiKey}
              </code>
              <button
                onClick={() => copyApiKey(newApiKey.apiKey)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
              >
                <FiCopy />
              </button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              Expires: {formatDate(newApiKey.expiresAt)}
            </p>
          </div>
        )}
      </div>

      {/* My API Keys */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">My API Keys</h2>
          <button
            onClick={fetchApiKeys}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiKey className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No API keys generated yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${
                  key.isExpired
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {key.isExpired ? (
                      <FiXCircle className="text-red-600" />
                    ) : (
                      <FiCheckCircle className="text-green-600" />
                    )}
                    <span className="font-mono text-sm break-all">{key.apiKey}</span>
                  </div>
                  <button
                    onClick={() => copyApiKey(key.apiKey)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <FiClock />
                    <span>Expires: {formatDate(key.expiresAt)}</span>
                  </div>
                  {key.isExpired && (
                    <span className="text-red-600 font-medium">Expired</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Usage Example */}
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">API Usage Example</h2>
        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm">
{`# Ask a question using API key
curl -X POST ${process.env.REACT_APP_API_URL || 'https://your-api-url.com'}/qa/ask \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question": "What is AI?"}'

# Response:
{
  "question": "What is AI?",
  "answer": "AI (Artificial Intelligence) is...",
  "modelId": "0",
  "timestamp": "2024-01-01T12:00:00.000Z"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyManager;
