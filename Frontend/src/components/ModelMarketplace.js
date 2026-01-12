import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { modelAPI } from '../utils/api';
import ModelCard from './ModelCard';
import toast from 'react-hot-toast';

function ModelMarketplace() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  const { user } = useAuth();
  
  console.log('📦 ModelMarketplace component rendered');
  
  useEffect(() => {
    console.log('🔄 ModelMarketplace mounted/updated, fetching models...');
    console.log('📍 Filters:', { selectedCategory, sortBy, search });
    fetchModels();
  }, [selectedCategory, sortBy, search]);
  
  const fetchModels = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching models...');
      // Use the centralized API client
      const response = await modelAPI.getAll();
      console.log('✅ Models response:', response);
      
      // Ensure response.data is an array
      const modelsData = Array.isArray(response.data) ? response.data : [];
      console.log(`📦 Found ${modelsData.length} models`);
      setModels(modelsData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(modelsData.map(m => m.category || 'Uncategorized'))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('❌ Error fetching models:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      toast.error(error.response?.data?.error || error.message || 'Failed to fetch models');
      setModels([]); // Ensure models is always an array
    } finally {
      setLoading(false);
    }
  };
  
  const requestInference = async (modelId, inputData) => {
    if (!user) {
      toast.error('Please login first');
      return;
    }
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://nondisastrously-ungrazed-hang.ngrok-free.dev';
      
      // Generate API key
      const apiKeyRes = await axios.post(`${API_URL}/api/generate-api-key`, {
        modelId,
        user: user.email,
        durationHours: 1
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      const apiKey = apiKeyRes.data.apiKey;
      
      // Request inference
      const response = await axios.post(`${API_URL}/api/inference/request`, {
        modelId,
        user: user.email,
        inputData,
        apiKey
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      toast.success('Inference requested successfully!');
      return response.data;
    } catch (error) {
      toast.error('Inference failed: ' + error.message);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Model Marketplace</h1>
        <p className="text-gray-600">Browse and use verifiable AI models</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search models..."
              className="w-full px-4 py-2 border rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              className="w-full px-4 py-2 border rounded-lg"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              className="w-full px-4 py-2 border rounded-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Models Grid */}
      {Array.isArray(models) && models.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(model => (
            <ModelCard
              key={model.modelId || model._id || Math.random()}
              model={model}
              onUse={requestInference}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No models found</h3>
          <p className="text-gray-500">Try different search criteria or check back later</p>
        </div>
      )}
    </div>
  );
}

export default ModelMarketplace;