import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiCopy, FiRefreshCw } from 'react-icons/fi';

function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Get user stats from backend
      const response = await axios.get(`${API_URL}/api/user/${user.email}`);
      setUserStats(response.data.stats);
      setTransactions(response.data.inferences || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(user.email);
    toast.success('Email copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and view your activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {user.username?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {user.username || 'User'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                {user.role || 'user'}
              </span>
            </div>

            {/* Account Info */}
            <div className="border-t pt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded break-all">
                    {user.email}
                  </code>
                  <button
                    onClick={copyEmail}
                    className="p-2 text-gray-600 hover:text-blue-600 transition"
                    title="Copy email"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats and History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Statistics</h3>
              <button
                onClick={fetchUserData}
                className="p-2 text-gray-600 hover:text-blue-600 transition"
                title="Refresh"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>

            {userStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${userStats.totalSpent?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Spent</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {userStats.totalInferences?.toString() || '0'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Inferences</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {userStats.modelIds?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Models Used</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {user.apiKeys?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">API Keys</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No statistics available</p>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Inference ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Model ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.length > 0 ? (
                    transactions.map((tx, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          #{tx.inferenceId || tx.id || index}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          #{tx.modelId?.toString() || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          ${tx.amount?.toFixed(2) || '0.00'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              tx.isCompleted
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {tx.isCompleted ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {tx.timestamp
                            ? new Date(tx.timestamp).toLocaleDateString()
                            : 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                        No transactions yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
