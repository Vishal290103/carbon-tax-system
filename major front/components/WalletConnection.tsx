import { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Copy,
  Coins,
  Activity
} from 'lucide-react';
import { web3Service } from '../src/services/web3Service';
import toast from 'react-hot-toast';

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
}

export function WalletConnection({ onWalletConnected, onWalletDisconnected }: WalletConnectionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState('');
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ name: '', chainId: 0 });

  useEffect(() => {
    const init = async () => {
      await web3Service.initialize();
      checkConnection();
    };
    init();
  }, []);

  const checkConnection = async () => {
    if (web3Service.isConnected()) {
      const userAddress = web3Service.getUserAddress();
      setIsConnected(true);
      setAddress(userAddress);
      await loadBalances();
      await loadNetworkInfo();
      onWalletConnected?.(userAddress);
    }
  };

  const loadBalances = async () => {
    try {
      const [eth, token] = await Promise.all([
        web3Service.getBalance(),
        web3Service.getTokenBalance()
      ]);
      setEthBalance(eth);
      setTokenBalance(token);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const loadNetworkInfo = async () => {
    try {
      // For demo purposes, showing local network info
      setNetworkInfo({ name: 'Localhost 8545', chainId: 31337 });
    } catch (error) {
      console.error('Error loading network info:', error);
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const userAddress = await web3Service.connectWallet();
      if (userAddress) {
        setIsConnected(true);
        setAddress(userAddress);
        await loadBalances();
        await loadNetworkInfo();
        onWalletConnected?.(userAddress);
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast.error('Failed to connect wallet. Make sure MetaMask is installed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    web3Service.disconnect();
    setIsConnected(false);
    setAddress('');
    setEthBalance('0');
    setTokenBalance('0');
    setNetworkInfo({ name: '', chainId: 0 });
    onWalletDisconnected?.();
    toast.success('Wallet disconnected');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num === 0) return '0.0000';
    if (num < 0.0001) return '<0.0001';
    return num.toFixed(4);
  };

  if (!isConnected) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-6 w-6" />
            <span>Connect Wallet</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">MetaMask Required</p>
                <p>Please install MetaMask browser extension to interact with the Carbon Tax Blockchain System.</p>
              </div>
            </div>
            
            <Button 
              onClick={handleConnect} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
            
            <div className="text-xs text-gray-500 text-center">
              By connecting, you agree to interact with our blockchain smart contracts
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Wallet Connected</span>
          </div>
          <Button 
            onClick={handleDisconnect}
            variant="secondary"
            size="sm"
          >
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Address */}
          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            <div className="mt-1 flex items-center space-x-2">
              <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">
                {formatAddress(address)}
              </span>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy address"
              >
                <Copy className="h-4 w-4" />
              </button>
              <a
                href={`https://etherscan.io/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-gray-100 rounded"
                title="View on Etherscan"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="text-sm font-medium text-gray-700">Network</label>
            <div className="mt-1 flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">{networkInfo.name}</span>
              <span className="text-xs text-gray-500">({networkInfo.chainId})</span>
            </div>
          </div>

          {/* Balances */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">ETH</span>
              </div>
              <p className="text-lg font-bold">{formatBalance(ethBalance)}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">CTT</span>
              </div>
              <p className="text-lg font-bold">{formatBalance(tokenBalance)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button 
              onClick={loadBalances}
              variant="secondary"
              size="sm"
              className="flex-1"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}