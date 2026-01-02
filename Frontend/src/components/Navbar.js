import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiHome, FiPackage, FiUpload, FiShield } from 'react-icons/fi';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfileMenu(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              InferChain
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/marketplace" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Marketplace
            </Link>
            
            {user && (
              <>
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600 transition font-medium">
                  Dashboard
                </Link>
                <Link to="/upload" className="text-gray-700 hover:text-blue-600 transition font-medium">
                  Upload Model
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-blue-600 transition font-medium">
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Right Side - Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="font-medium">
                    {user.username || user.walletAddress?.substring(0, 6)}...
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                    >
                      <FiUser className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
                      >
                        <FiShield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 transition"
                    >
                      <FiLogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-700 hover:text-blue-600 transition"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/marketplace"
              onClick={() => setIsOpen(false)}
              className="block text-gray-700 hover:text-blue-600 transition font-medium"
            >
              Marketplace
            </Link>
            
            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upload"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Upload Model
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Profile
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className="block text-gray-700 hover:text-blue-600 transition font-medium"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-red-600 hover:text-red-700 transition font-medium"
                >
                  Logout
                </button>
              </>
            )}
            
            {!user && (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;

