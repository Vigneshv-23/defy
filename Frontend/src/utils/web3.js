import { ethers } from 'ethers';

// Contract addresses (update these after deployment)
export const CONTRACT_ADDRESSES = {
  nodeRegistry: '0x663F3ad617193148711d28f5334eE4Ed07016602',
  modelRegistry: '0x2E983A1Ba5e8b38AAAeC4B440B9dDcFBf72E15d1',
  inferenceManager: '0x8438Ad1C834623CfF278AB6829a248E37C2D7E3f'
};

// Local Anvil network config
export const ANVIL_NETWORK = {
  chainId: '0x7a69', // 31337 in hex
  chainName: 'Localhost 8545',
  rpcUrls: ['http://localhost:8545'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  }
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

// Connect to MetaMask
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    // Check if we're on the correct network
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    
    if (chainId !== ANVIL_NETWORK.chainId) {
      // Try to switch to Anvil network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ANVIL_NETWORK.chainId }]
        });
      } catch (switchError) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ANVIL_NETWORK]
          });
        } else {
          throw switchError;
        }
      }
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { provider, signer, address, accounts };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

// Get provider and signer
export const getProvider = () => {
  if (!isMetaMaskInstalled()) {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum);
};

export const getSigner = async () => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('MetaMask not installed');
  }
  return await provider.getSigner();
};

// Format ETH from wei
export const formatETH = (wei) => {
  if (!wei) return '0';
  
  // If it's already a decimal number (less than 1e18), assume it's already in ETH
  const weiValue = typeof wei === 'string' ? wei : wei.toString();
  const numValue = parseFloat(weiValue);
  
  // If the number is less than 1e18, it's likely already in ETH format
  if (numValue < 1e18 && numValue > 0 && weiValue.includes('.')) {
    return weiValue;
  }
  
  // Otherwise, treat it as wei and convert
  try {
    return ethers.formatEther(weiValue);
  } catch (error) {
    // If conversion fails, return the original value as string
    console.warn('formatETH: Could not convert value, returning as-is:', weiValue);
    return weiValue;
  }
};

// Parse ETH to wei
export const parseETH = (eth) => {
  return ethers.parseEther(eth.toString());
};

// Listen for account changes
export const onAccountsChanged = (callback) => {
  if (!isMetaMaskInstalled()) return;
  window.ethereum.on('accountsChanged', callback);
};

// Listen for chain changes
export const onChainChanged = (callback) => {
  if (!isMetaMaskInstalled()) return;
  window.ethereum.on('chainChanged', callback);
};

// Remove listeners
export const removeListeners = () => {
  if (!isMetaMaskInstalled()) return;
  window.ethereum.removeAllListeners('accountsChanged');
  window.ethereum.removeAllListeners('chainChanged');
};
