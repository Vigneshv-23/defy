import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FiPlus, FiTrendingUp, FiPackage, FiDollarSign } from 'react-icons/fi';

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentModels, setRecentModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      // Fetch user's models if creator
      if (user.role === 'creator' || user.role === 'admin') {
        const modelsRes = await axios.get(`${API_URL}/api/creator/${user.email}/models`);
        setRecentModels(modelsRes.data.slice(0, 6));
      }

      // Fetch user stats
      const userRes = await axios.get(`${API_URL}/api/user/${user.email}`);
      setStats(userRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.username || 'User'}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ${stats?.stats?.totalSpent?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <FiDollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Inferences</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.stats?.totalInferences?.toString() || '0'}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Models Used</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.stats?.modelIds?.length || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <FiPackage className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">API Keys</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {user.apiKeys?.length || 0}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <FiPackage className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          to="/marketplace"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-8 hover:shadow-xl transition"
        >
          <h3 className="text-xl font-bold mb-2">Browse Models</h3>
          <p className="text-blue-100 mb-4">
            Explore AI models and start using them for your projects
          </p>
          <div className="flex items-center text-blue-100">
            Explore Marketplace →
          </div>
        </Link>

        {(user.role === 'creator' || user.role === 'admin') && (
          <Link
            to="/upload"
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg p-8 hover:shadow-xl transition"
          >
            <h3 className="text-xl font-bold mb-2">Upload Model</h3>
            <p className="text-green-100 mb-4">
              Register your AI model and start earning from usage
            </p>
            <div className="flex items-center text-green-100">
              Upload Now →
            </div>
          </Link>
        )}
      </div>

      {/* My Models (for creators) */}
      {(user.role === 'creator' || user.role === 'admin') && recentModels.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Models</h2>
            <Link
              to="/upload"
              className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <FiPlus className="w-5 h-5 mr-1" />
              Upload New
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentModels.map((model) => (
              <Link
                key={model.modelId}
                to={`/chat/${model.modelId}`}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
              >
                <h3 className="font-bold text-gray-900 mb-2">{model.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {model.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600 font-medium">
                    ${model.pricePerInference?.toFixed(2) || '0.00'}
                  </span>
                  <span className="text-gray-500">
                    {model.totalInferences || 0} uses
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
