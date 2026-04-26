import { useState } from 'react';
import { Coins, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MockTokenFaucetProps {
  onTokensReceived: () => void;
  _currentBalance: string;
}

export function MockTokenFaucet({ onTokensReceived, currentBalance: _currentBalance }: MockTokenFaucetProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleMockTokens = async () => {
    setIsRequesting(true);
    
    try {
      // Simulate a delay for realistic experience
      toast.loading('Requesting test tokens from mock faucet...', { id: 'mock-tokens' });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful token reception
      toast.success('🎉 Successfully received 2000 CTT tokens! (Demo mode)', { 
        id: 'mock-tokens',
        duration: 3000
      });
      
      // Call the callback to refresh data
      onTokensReceived();
      
    } catch (error) {
      toast.error('Mock faucet failed', { id: 'mock-tokens' });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <Coins className="h-5 w-5 text-green-600" />
        <h4 className="font-medium text-green-800">Get CTT Tokens</h4>
      </div>
      
      <p className="text-sm text-green-700 mb-4">
        Get 2000 CTT tokens instantly to test validator functionality. This is the easiest way to get started!
      </p>
      
      <button
        onClick={handleMockTokens}
        disabled={isRequesting}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
      >
        {isRequesting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Requesting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <Coins className="h-4 w-4" />
            <span>🎆 Get 2000 CTT Tokens (Recommended)</span>
          </div>
        )}
      </button>
      
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-start space-x-2">
          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">🎆 Instant Tokens:</p>
            <p>This immediately gives you test tokens to explore the validator features. Perfect for testing staking, rewards, and validator status!</p>
          </div>
        </div>
      </div>
    </div>
  );
}