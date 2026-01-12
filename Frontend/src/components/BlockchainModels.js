import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { modelAPI } from '../utils/api';
import { formatETH } from '../utils/web3';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiDollarSign, FiEdit, FiExternalLink } from 'react-icons/fi';

function BlockchainModels() {
  const { account, isConnected, signer } = useWeb3();
  const [models, setModels] = useState([]);
  const [blockchainModels, setBlockchainModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchModels();
    fetchBlockchainModels();
  }, []);

  const fetchModels = async () => {
    try {
      const res = await modelAPI.getAll();
      setModels(res.data);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchBlockchainModels = async () => {
    setLoading(true);
    try {
      const nextIdRes = await modelAPI.getNextId();
      const nextId = parseInt(nextIdRes.data.nextModelId);
      
      const blockchainData = [];
      for (let i = 0; i < nextId; i++) {
        try {
          const modelRes = await modelAPI.getFromBlockchain(i);
          blockchainData.push({ ...modelRes.data, modelId: i });
        } catch (error) {
          console.error(`Error fetching model ${i}:`, error);
        }
      }
      setBlockchainModels(blockchainData);
    } catch (error) {
      toast.error('Failed to fetch blockchain models');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = async (modelId) => {
    if (!newPrice || parseFloat(newPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    if (!isConnected || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Convert ETH to wei (assuming price is in ETH)
      const priceInWei = (parseFloat(newPrice) * 1e18).toString();
      
      await modelAPI.updatePrice(modelId, priceInWei, account);
      toast.success('Price updated successfully!');
      setEditingModel(null);
      setNewPrice('');
      fetchBlockchainModels();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update price');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = (model) => {
    return account && model.owner && account.toLowerCase() === model.owner.toLowerCase();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Models</h1>
          <p className="text-gray-600">View and manage models on the blockchain</p>
        </div>
        <button
          onClick={fetchBlockchainModels}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && blockchainModels.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : blockchainModels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-gray-600">No models found on blockchain</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blockchainModels.map((model) => (
            <div key={model.modelId} className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Model #{model.modelId}</h3>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    {model.owner.slice(0, 6)}...{model.owner.slice(-4)}
                  </p>
                </div>
                {isOwner(model) && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Owner
                  </span>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-sm text-gray-600">IPFS CID</p>
                  <p className="text-sm font-mono text-gray-900 break-all">{model.ipfsCid}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price per Minute</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatETH(model.pricePerMinute)} ETH
                  </p>
                </div>
              </div>

              {isOwner(model) && (
                <div className="border-t pt-4">
                  {editingModel === model.modelId ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="New price (ETH)"
                        step="0.001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdatePrice(model.modelId)}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingModel(null);
                            setNewPrice('');
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingModel(model.modelId);
                        setNewPrice(formatETH(model.pricePerMinute));
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <FiEdit />
                      Update Price
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlockchainModels;
