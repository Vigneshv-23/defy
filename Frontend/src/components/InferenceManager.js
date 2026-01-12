import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { inferenceAPI } from '../utils/api';
import { formatETH, parseETH, CONTRACT_ADDRESSES } from '../utils/web3';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { FiSend, FiCheckCircle, FiClock, FiDollarSign } from 'react-icons/fi';

function InferenceManager() {
  const { account, isConnected, signer, provider } = useWeb3();
  const [modelId, setModelId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [requestId, setRequestId] = useState('');
  const [requestStatus, setRequestStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextRequestId, setNextRequestId] = useState(null);
  const [commissionAccount, setCommissionAccount] = useState(null);

  useEffect(() => {
    if (isConnected) {
      fetchNextRequestId();
      fetchCommissionAccount();
    }
  }, [isConnected]);

  const fetchNextRequestId = async () => {
    try {
      const res = await inferenceAPI.getNextRequestId();
      setNextRequestId(res.data.nextRequestId);
    } catch (error) {
      console.error('Error fetching next request ID:', error);
    }
  };

  const fetchCommissionAccount = async () => {
    try {
      const res = await inferenceAPI.getCommissionAccount();
      setCommissionAccount(res.data.commissionAccount);
    } catch (error) {
      console.error('Error fetching commission account:', error);
    }
  };

  const handleRequestInference = async () => {
    if (!modelId || !durationMinutes) {
      toast.error('Please enter model ID and duration');
      return;
    }

    if (!isConnected || !signer) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      // Get transaction parameters from backend
      const res = await inferenceAPI.request({
        modelId,
        wallet: account,
        durationMinutes
      });

      const { transaction, totalCost } = res.data;

      // Send transaction using MetaMask
      const tx = await signer.sendTransaction({
        to: transaction.to,
        data: transaction.data,
        value: transaction.value
      });

      toast.success('Transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      toast.success(`Inference requested! Request ID: ${receipt.logs[0]?.topics[1] || 'N/A'}`);
      
      setModelId('');
      setDurationMinutes('');
      fetchNextRequestId();
    } catch (error) {
      console.error('Error requesting inference:', error);
      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else {
        toast.error(error.message || 'Failed to request inference');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!requestId) {
      toast.error('Please enter a request ID');
      return;
    }

    setLoading(true);
    try {
      const res = await inferenceAPI.getStatus(requestId);
      setRequestStatus(res.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch request status');
      setRequestStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResult = async () => {
    if (!requestId) {
      toast.error('Please enter a request ID');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      await inferenceAPI.submit(requestId, account);
      toast.success('Result submitted! Payment distributed (75% model owner, 25% commission)');
      setRequestId('');
      setRequestStatus(null);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inference Manager</h1>
        <p className="text-gray-600">Request inferences and manage results</p>
      </div>

      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please connect your wallet to request inferences</p>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FiClock className="text-blue-600" />
            <h3 className="font-bold text-gray-900">Next Request ID</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{nextRequestId || '0'}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FiDollarSign className="text-green-600" />
            <h3 className="font-bold text-gray-900">Commission Account</h3>
          </div>
          <p className="text-sm font-mono text-gray-600 break-all">
            {commissionAccount ? `${commissionAccount.slice(0, 6)}...${commissionAccount.slice(-4)}` : 'Loading...'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <FiCheckCircle className="text-purple-600" />
            <h3 className="font-bold text-gray-900">Payment Split</h3>
          </div>
          <p className="text-sm text-gray-600">75% Model Owner<br />25% Commission</p>
        </div>
      </div>

      {/* Request Inference */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Request Inference</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model ID
            </label>
            <input
              type="number"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          onClick={handleRequestInference}
          disabled={loading || !isConnected}
          className="mt-4 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <FiSend />
          Request Inference
        </button>
      </div>

      {/* Check Status / Submit Result */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Check Status */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Check Request Status</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request ID
              </label>
              <input
                type="number"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleCheckStatus}
              disabled={loading || !requestId}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              Check Status
            </button>
            {requestStatus && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">User: <span className="font-mono">{requestStatus.user}</span></p>
                <p className="text-sm text-gray-600">Model ID: {requestStatus.modelId}</p>
                <p className="text-sm text-gray-600">Paid: {formatETH(requestStatus.paidAmount)} ETH</p>
                <p className="text-sm text-gray-600">Expires: {new Date(requestStatus.expiresAt).toLocaleString()}</p>
                <p className="text-sm">
                  Status: <span className={requestStatus.fulfilled ? 'text-green-600 font-bold' : 'text-yellow-600 font-bold'}>
                    {requestStatus.fulfilled ? 'Fulfilled' : 'Pending'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Result */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Result</h2>
          <p className="text-sm text-gray-600 mb-4">
            Submit inference result to distribute payment (75% model owner, 25% commission)
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Request ID
              </label>
              <input
                type="number"
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSubmitResult}
              disabled={loading || !isConnected || !requestId}
              className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              Submit Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InferenceManager;
