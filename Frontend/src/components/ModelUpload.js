import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWeb3 } from '../contexts/Web3Context';
import axios from 'axios';
import toast from 'react-hot-toast';
import { parseETH } from '../utils/web3';
import { modelAPI } from '../utils/api';

function ModelUpload() {
  const { user } = useAuth();
  const { account, isConnected } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricePerMinute: '0.001', // Price in ETH per minute
    category: 'text-generation',
    tags: '',
    modelFile: null,
    imageFile: null
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login first');
      return;
    }

    if (!isConnected || !account) {
      toast.error('Please connect your wallet first to register a model');
      return;
    }
    
    try {
      setLoading(true);
      
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Upload model to IPFS
      const modelFormData = new FormData();
      modelFormData.append('file', formData.modelFile);
      
      const ipfsRes = await axios.post(`${API_URL}/api/ipfs/upload`, modelFormData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
      
      const ipfsCid = ipfsRes.data.hash;
      
      // Upload image to IPFS if provided
      let imageHash = '';
      if (formData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', formData.imageFile);
        const imageRes = await axios.post(`${API_URL}/api/ipfs/upload`, imageFormData);
        imageHash = imageRes.data.hash;
      }
      
      // Convert price from ETH to wei
      const pricePerMinuteInWei = parseETH(formData.pricePerMinute).toString();
      
      // HARDCODED FOR HACKATHON: Always use dev account
      const DEV_ACCOUNT = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
      
      // Register model on blockchain via backend
      // Backend will register using dev account automatically
      const response = await modelAPI.register({
        wallet: DEV_ACCOUNT, // Hardcoded dev account
        name: formData.name,
        description: formData.description,
        ipfsCid: ipfsCid,
        pricePerMinute: pricePerMinuteInWei
      });
      
      toast.success('Model registered successfully on blockchain!');
      setFormData({
        name: '',
        description: '',
        pricePerMinute: '0.001',
        category: 'text-generation',
        tags: '',
        modelFile: null,
        imageFile: null
      });
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error registering model:', error);
      toast.error('Failed to register model: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload AI Model</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Name *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.name}
                onChange={handleChange}
                placeholder="GPT-4 Fine-tuned Model"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                required
                rows="3"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your model's capabilities, training data, and use cases..."
              />
            </div>
            
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Minute (ETH) *
              </label>
              <input
                type="number"
                name="pricePerMinute"
                required
                min="0.0001"
                step="0.0001"
                className="w-full px-4 py-2 border rounded-lg"
                value={formData.pricePerMinute}
                onChange={handleChange}
              />
              <p className="text-sm text-gray-500 mt-1">
                Models will be owned by dev account (0xf39F...92266) and receive 75% of payments
              </p>
            </div>
            
            {/* Category & Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="text-generation">Text Generation</option>
                  <option value="image-generation">Image Generation</option>
                  <option value="translation">Translation</option>
                  <option value="summarization">Summarization</option>
                  <option value="classification">Classification</option>
                  <option value="qa">Question Answering</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  name="tags"
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="gpt, nlp, chatbot, ai"
                />
              </div>
            </div>
            
            {/* File Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model File *
                </label>
                <input
                  type="file"
                  name="modelFile"
                  required
                  accept=".pt,.pth,.bin,.h5,.json"
                  onChange={handleChange}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Upload your model weights and configuration
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thumbnail Image
                </label>
                <input
                  type="file"
                  name="imageFile"
                  accept="image/*"
                  onChange={handleChange}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Display image for your model
                </p>
              </div>
            </div>
            
            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Uploading to IPFS... {uploadProgress}%
                </p>
              </div>
            )}
            
            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Registering Model...' : 'Register Model'}
              </button>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Model will be registered and available in the marketplace
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ModelUpload;