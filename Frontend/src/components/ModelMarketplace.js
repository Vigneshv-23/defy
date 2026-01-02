import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
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
  
  useEffect(() => {
    fetchModels();
  }, [selectedCategory, sortBy, search]);
  
  const fetchModels = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/models`, {
        params: {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          sortBy,
          search
        }
      });
      setModels(response.data);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(response.data.map(m => m.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      toast.error('Failed to fetch models');
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
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Generate API key
      const apiKeyRes = await axios.post(`${API_URL}/api/generate-api-key`, {
        modelId,
        user: user.email,
        durationHours: 1
      });
      
      const apiKey = apiKeyRes.data.apiKey;
      
      // Request inference
      const response = await axios.post(`${API_URL}/api/inference/request`, {
        modelId,
        user: user.email,
        inputData,
        apiKey
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map(model => (
          <ModelCard
            key={model.modelId}
            model={model}
            onUse={requestInference}
          />
        ))}
      </div>
      
      {models.length === 0 && (
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