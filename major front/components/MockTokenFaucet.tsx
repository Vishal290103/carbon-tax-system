import { useState } from 'react';
import { Coins, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MockTokenFaucetProps {
  onTokensReceived: () => void;
  currentBalance: string;
}

export function MockTokenFaucet({ onTokensReceived, currentBalance: _currentBalance }: MockTokenFaucetProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleMockTokens = async () => {
    setIsRequesting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Demo tokens added to your account!');
      onTokensReceived();
    } catch (error) {
      console.error('Error requesting tokens:', error);
      toast.error('Failed to request demo tokens');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Coins className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Need Demo Tokens?</h3>
          <p className="text-sm text-gray-600">Get free CTT tokens for testing the system</p>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="p-3 bg-white bg-opacity-60 rounded-lg border border-indigo-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Available in Faucet</span>
            <span className="font-medium text-indigo-700">50,000 CTT</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
          </div>
        </div>

        <button
          onClick={handleMockTokens}
          disabled={isRequesting}
          className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all ${
            isRequesting 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          {isRequesting ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Request 1000 Test CTT</span>
            </>
          )}
        </button>
        
        <p className="text-xs text-center text-gray-400">
          Demo tokens have no real-world value and are for testing only.
        </p>
      </div>
    </div>
  );
}
