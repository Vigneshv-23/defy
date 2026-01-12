import React, { createContext, useContext, useState, useEffect } from 'react';
import { connectWallet, isMetaMaskInstalled, onAccountsChanged, onChainChanged, removeListeners } from '../utils/web3';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connect();
        }

        // Get current chain ID
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        setChainId(currentChainId);
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();

    // Listen for account changes
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    // Listen for chain changes
    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);
      window.location.reload(); // Reload to update network
    };

    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    return () => {
      removeListeners();
    };
  }, []);

  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    setIsConnecting(true);
    try {
      const { provider, signer, address } = await connectWallet();
      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setIsConnected(true);
      toast.success('Wallet connected!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setIsConnected(false);
    toast.success('Wallet disconnected');
  };

  const value = {
    account,
    provider,
    signer,
    isConnected,
    isConnecting,
    chainId,
    connect,
    disconnect
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};
