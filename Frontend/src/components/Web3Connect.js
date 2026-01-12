import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { FiCreditCard, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

function Web3Connect() {
  const { account, isConnected, isConnecting, connect, disconnect, chainId } = useWeb3();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      toast.error(error.message || 'Failed to connect');
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isCorrectNetwork = chainId === '0x7a69'; // 31337 in hex

  return (
    <div className="flex items-center gap-4">
      {isConnected ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            {isCorrectNetwork ? (
              <FiCheckCircle className="text-green-600" />
            ) : (
              <FiXCircle className="text-red-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {formatAddress(account)}
            </span>
          </div>
          {!isCorrectNetwork && (
            <span className="text-xs text-red-600">
              Wrong network! Switch to Localhost 8545
            </span>
          )}
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <FiCreditCard />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
}

export default Web3Connect;
