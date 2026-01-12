import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get API URL from centralized config - use port 5000 for backend
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL && typeof window !== 'undefined' && 
        !window.location.hostname.includes('localhost')) {
      return process.env.REACT_APP_API_URL;
    }
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      }
    }
    return 'https://nondisastrously-ungrazed-hang.ngrok-free.dev';
  };

  const API_URL = getApiUrl();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Signed in successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Sign in failed');
      throw error;
    }
  };

  const signUp = async (email, password, username, role = 'user') => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        username,
        role
      });
      
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      toast.success('Account created successfully');
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Sign up failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
