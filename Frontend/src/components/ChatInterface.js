import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import { FiSend, FiArrowLeft, FiClock } from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_URL);

function ChatInterface() {
  const { modelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [model, setModel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatActive, setChatActive] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const messagesEndRef = useRef(null);
  const chatIdRef = useRef(null);

  useEffect(() => {
    fetchModelDetails();
    initializeChat();

    socket.on('new_message', (data) => {
      setMessages((prev) => [...prev, data]);
      scrollToBottom();
    });

    return () => {
      socket.off('new_message');
      if (chatIdRef.current) {
        socket.emit('leave_chat', chatIdRef.current);
      }
    };
  }, [modelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchModelDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/models?modelId=${modelId}`);
      if (response.data && response.data.length > 0) {
        setModel(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching model:', error);
      toast.error('Failed to load model details');
    }
  };

  const initializeChat = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/chat/start`, {
        modelId: parseInt(modelId),
        user: user?.email,
        durationHours: 1
      });

      chatIdRef.current = response.data.chatId;
      socket.emit('join_chat', response.data.chatId);

      // Calculate time remaining
      const expiresAt = new Date(response.data.expiresAt);
      const updateTimer = () => {
        const now = new Date();
        const remaining = Math.max(0, expiresAt - now);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          setChatActive(false);
        }
      };

      updateTimer();
      const timerInterval = setInterval(updateTimer, 1000);

      return () => clearInterval(timerInterval);
    } catch (error) {
      console.error('Error initializing chat:', error);
      toast.error('Failed to start chat session');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !chatActive || loading || !user) return;

    const userMessage = {
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Generate API key for this session
      const apiKeyRes = await axios.post(`${API_URL}/api/generate-api-key`, {
        modelId: parseInt(modelId),
        user: user.email,
        durationHours: 1
      });

      const apiKey = apiKeyRes.data.apiKey;

      // Request inference (payment tracked in database)
      const inferenceRes = await axios.post(`${API_URL}/api/inference/request`, {
        modelId: parseInt(modelId),
        user: user.email,
        inputData: userMessage.content,
        apiKey
      });

      toast.success('Message sent! Processing...');

      // Send message to backend for AI processing
      const response = await axios.post(`${API_URL}/api/chat/message`, {
        chatId: chatIdRef.current,
        message: userMessage.content,
        apiKey
      });

      // The AI response will come via socket.io or in response
      setLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!model) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/marketplace')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{model.name}</h1>
              <p className="text-sm text-gray-600">
                ${model.pricePerInference?.toFixed(2) || '0.00'} per message
              </p>
            </div>
          </div>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 text-sm">
              <FiClock className="w-4 h-4 text-gray-500" />
              <span className={chatActive ? 'text-gray-700' : 'text-red-600'}>
                {chatActive ? `Time: ${formatTime(timeRemaining)}` : 'Session Expired'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="bg-white rounded-xl shadow-lg h-[600px] flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <div className="text-4xl mb-4">💬</div>
              <p>Start a conversation with {model.name}</p>
              <p className="text-sm mt-2">
                Each message costs ${model.pricePerInference?.toFixed(2) || '0.00'}
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={chatActive ? "Type your message..." : "Chat session expired"}
              disabled={!chatActive || loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!chatActive || loading || !inputMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
            >
              <FiSend className="w-5 h-5" />
              <span>Send</span>
            </button>
          </form>
          {!chatActive && (
            <p className="text-sm text-red-600 mt-2 text-center">
              Your chat session has expired. Please start a new session.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
