import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ModelMarketplace from './components/ModelMarketplace';
import ModelUpload from './components/ModelUpload';
import Profile from './components/Profile';
import AdminDashboard from './components/AdminDashboard';
import ChatInterface from './components/ChatInterface';
import NodeManagement from './components/NodeManagement';
import BlockchainModels from './components/BlockchainModels';
import InferenceManager from './components/InferenceManager';
import ApiKeyManager from './components/ApiKeyManager';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Web3Provider } from './contexts/Web3Context';

// Blockchain/Contract features removed - using simplified backend

function App() {
  return (
    <Web3Provider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right" />
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ModelMarketplace />} />
              <Route path="/upload" element={<ProtectedRoute><ModelUpload /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/chat/:modelId" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
              <Route path="/blockchain/nodes" element={<NodeManagement />} />
              <Route path="/blockchain/models" element={<BlockchainModels />} />
              <Route path="/blockchain/inference" element={<InferenceManager />} />
              <Route path="/api-keys" element={<ProtectedRoute><ApiKeyManager /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </Web3Provider>
  );
}

function Home() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Decentralized AI Marketplace
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Own your AI models. Monetize with pay-per-use. Verify every inference.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/marketplace"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Browse Models
          </a>
          {!user && (
            <a
              href="/login"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Get Started
            </a>
          )}
        </div>
      </div>
      
      {/* Features */}
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="text-blue-600 text-3xl mb-4">🔐</div>
          <h3 className="text-xl font-bold mb-2">Crypto Ownership</h3>
          <p className="text-gray-600">
            Register AI models on-chain with cryptographic proof of ownership
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="text-blue-600 text-3xl mb-4">💰</div>
          <h3 className="text-xl font-bold mb-2">Pay-Per-Use</h3>
          <p className="text-gray-600">
            No subscriptions. Pay only for the inferences you actually use
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="text-blue-600 text-3xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Verifiable Inference</h3>
          <p className="text-gray-600">
            Every inference is recorded on-chain with cryptographic verification
          </p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
}

export default App;