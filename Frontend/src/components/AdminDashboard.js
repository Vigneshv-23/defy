import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('daily');
  
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);
  
  const fetchStats = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/admin/stats`, {
        params: { email: user.email }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Chart data
  const revenueData = {
    labels: ['Platform (30%)', 'Creators (70%)'],
    datasets: [
      {
        data: [
          parseFloat(stats.blockchainStats.totalVolume || 0) * 0.3,
          parseFloat(stats.blockchainStats.totalVolume || 0) * 0.7
        ],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#3B82F6', '#10B981'],
        borderWidth: 1
      }
    ]
  };
  
  const activityData = {
    labels: ['Models', 'Inferences', 'Users', 'Volume'],
    datasets: [
      {
        label: 'Platform Statistics',
        data: [
          stats.databaseStats.totalModels,
          stats.databaseStats.totalInferences,
          stats.databaseStats.totalUsers,
          parseFloat(stats.blockchainStats.totalVolume || 0)
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: '#3B82F6',
        borderWidth: 1
      }
    ]
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor platform activity and revenue</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats.blockchainStats.totalModels}
          </div>
          <div className="text-gray-600">Total Models</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats.blockchainStats.totalInferences}
          </div>
          <div className="text-gray-600">Total Inferences</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            {stats.blockchainStats.activeUsers}
          </div>
          <div className="text-gray-600">Active Users</div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <div className="text-2xl font-bold text-gray-900">
            ${parseFloat(stats.blockchainStats.totalVolume || 0).toFixed(2)}
          </div>
          <div className="text-gray-600">Total Volume</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Distribution</h3>
          <Pie data={revenueData} />
        </div>
        
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Activity</h3>
          <Bar data={activityData} />
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Inferences</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.recentInferences.map((inf) => (
                <tr key={inf._id}>
                  <td className="px-6 py-4 text-sm text-gray-900">{inf.inferenceId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">Model #{inf.modelId || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{inf.user}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">${inf.amount?.toFixed(2) || '0.00'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${inf.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {inf.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(inf.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;