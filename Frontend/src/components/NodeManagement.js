import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { nodeAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiSearch, FiShield } from 'react-icons/fi';

function NodeManagement() {
  const { account, isConnected } = useWeb3();
  const [nodeAddress, setNodeAddress] = useState('');
  const [checkAddress, setCheckAddress] = useState('');
  const [isApproved, setIsApproved] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAdmin();
  }, []);

  const fetchAdmin = async () => {
    // Try API first, then fallback to direct blockchain call
    try {
      const res = await nodeAPI.getAdmin();
      if (res.data && res.data.admin) {
        setAdmin(res.data.admin);
        return;
      }
    } catch (error) {
      console.log('API call failed, trying direct blockchain call...', error.message);
    }

    // Fallback: Read directly from blockchain
    try {
      const { ethers } = await import('ethers');
      const { CONTRACT_ADDRESSES, getProvider } = await import('../utils/web3');
      
      // Use MetaMask provider if available, otherwise use RPC provider
      let provider;
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        provider = getProvider();
      }

      if (provider) {
        const nodeRegistryABI = [
          {
            "inputs": [],
            "name": "admin",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
          }
        ];
        const contract = new ethers.Contract(CONTRACT_ADDRESSES.nodeRegistry, nodeRegistryABI, provider);
        const adminAddress = await contract.admin();
        setAdmin(adminAddress);
        console.log('Admin fetched from blockchain:', adminAddress);
      }
    } catch (blockchainError) {
      console.error('Error fetching admin from blockchain:', blockchainError);
      toast.error('Failed to fetch admin address');
    }
  };

  const handleAddNode = async () => {
    if (!nodeAddress) {
      toast.error('Please enter a node address');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const res = await nodeAPI.addNode(nodeAddress);
      toast.success('Node added successfully!');
      setNodeAddress('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add node');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveNode = async () => {
    if (!nodeAddress) {
      toast.error('Please enter a node address');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const res = await nodeAPI.removeNode(nodeAddress);
      toast.success('Node removed successfully!');
      setNodeAddress('');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove node');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNode = async () => {
    if (!checkAddress) {
      toast.error('Please enter an address to check');
      return;
    }

    setLoading(true);
    try {
      const res = await nodeAPI.checkNode(checkAddress);
      setIsApproved(res.data.isApproved);
      toast.success(`Node is ${res.data.isApproved ? 'approved' : 'not approved'}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to check node');
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = account && admin && account.toLowerCase() === admin.toLowerCase();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Node Management</h1>
        <p className="text-gray-600">Manage approved inference nodes</p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please connect your wallet to manage nodes</p>
        </div>
      )}

      {isConnected && !isAdmin && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">
            Only the admin ({admin ? `${admin.slice(0, 6)}...${admin.slice(-4)}` : 'N/A'}) can manage nodes
          </p>
        </div>
      )}

      {/* Admin Info */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FiShield className="text-blue-600 text-xl" />
          <h2 className="text-xl font-bold text-gray-900">Admin Information</h2>
        </div>
        <p className="text-gray-600">
          Admin Address: <span className="font-mono text-sm">{admin || 'Loading...'}</span>
        </p>
        {isAdmin && (
          <p className="text-green-600 mt-2 font-medium">✓ You are the admin</p>
        )}
      </div>

      {/* Add/Remove Node */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add/Remove Node</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Node Address
              </label>
              <input
                type="text"
                value={nodeAddress}
                onChange={(e) => setNodeAddress(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleAddNode}
                disabled={loading || !nodeAddress}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <FiPlus />
                Add Node
              </button>
              <button
                onClick={handleRemoveNode}
                disabled={loading || !nodeAddress}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <FiTrash2 />
                Remove Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check Node Status */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Check Node Status</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address to Check
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={checkAddress}
                onChange={(e) => setCheckAddress(e.target.value)}
                placeholder="0x..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCheckNode}
                disabled={loading || !checkAddress}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <FiSearch />
                Check
              </button>
            </div>
          </div>
          {isApproved !== null && (
            <div className={`p-4 rounded-lg ${isApproved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-medium ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
                {isApproved ? '✓ Node is approved' : '✗ Node is not approved'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NodeManagement;
