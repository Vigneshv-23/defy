import axios from 'axios';

// FORCE localhost:3000 in development - ignore ngrok
const getApiUrl = () => {
  // In development, ALWAYS use localhost:3000
  // Only use environment variable if explicitly set AND not in development
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If running on localhost, ALWAYS use localhost:5000 (backend port)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const backendUrl = 'http://localhost:5000';
      console.log('📌 FORCING localhost backend (development mode):', backendUrl);
      console.log('⚠️  Ignoring REACT_APP_API_URL and ngrok in development');
      return backendUrl;
    }
  }
  
  // Only use env var or ngrok if NOT on localhost (production)
  if (process.env.REACT_APP_API_URL && typeof window !== 'undefined' && 
      !window.location.hostname.includes('localhost')) {
    console.log('📌 Using REACT_APP_API_URL (production):', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to ngrok only for production/external access
  const ngrokUrl = 'https://nondisastrously-ungrazed-hang.ngrok-free.dev';
  console.log('📌 Using ngrok URL (production):', ngrokUrl);
  return ngrokUrl;
};

const API_URL = getApiUrl();

// Log the API URL being used (for debugging)
if (typeof window !== 'undefined') {
  console.log('🔗 API URL configured:', API_URL);
  console.log('📍 Current hostname:', window.location.hostname);
  console.log('📍 Current port:', window.location.port);
  console.log('📍 Full location:', window.location.href);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Skip ngrok browser warning
  },
});

// Add request interceptor to log actual URLs being used
api.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log('🌐 Making API request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: fullUrl
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors better
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // If ngrok fails and we're using it, try localhost fallback
    if (error.code === 'ERR_NETWORK' && API_URL.includes('ngrok')) {
      console.warn('Ngrok failed, this might be a network issue. Check ngrok status.');
    }
    
    // Provide more helpful error messages
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - check if backend is running on', API_URL);
    }
    
    return Promise.reject(error);
  }
);

// Node Registry APIs
export const nodeAPI = {
  addNode: (nodeAddress) => api.post('/nodes/add', { nodeAddress }),
  removeNode: (nodeAddress) => api.post('/nodes/remove', { nodeAddress }),
  checkNode: (address) => api.get(`/nodes/check/${address}`),
  getAdmin: () => api.get('/nodes/admin')
};

// Model Registry APIs
export const modelAPI = {
  register: (data) => api.post('/models', data),
  getAll: () => api.get('/models'),
  updatePrice: (modelId, newPricePerMinute, wallet) => 
    api.put(`/models/${modelId}/price`, { newPricePerMinute, wallet }),
  getFromBlockchain: (modelId) => api.get(`/models/blockchain/${modelId}`),
  getNextId: () => api.get('/models/blockchain/next-id')
};

// Inference Manager APIs
export const inferenceAPI = {
  request: (data) => api.post('/inference/request', data),
  getStatus: (requestId) => api.get(`/inference/status/${requestId}`),
  submit: (requestId, wallet) => api.post('/inference/submit', { requestId, wallet }),
  getNextRequestId: () => api.get('/inference/next-request-id'),
  getCommissionAccount: () => api.get('/inference/commission-account')
};

// IPFS APIs
export const ipfsAPI = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ipfs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export default api;

