import { useState } from 'react';
import { Coins, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface MockTokenFaucetProps {
  onTokensReceived: () => void;
}

export function MockTokenFaucet({ onTokensReceived }: MockTokenFaucetProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleMockTokens = async () => {
    setIsRequesting(true);
    try {
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
      <button
        onClick={handleMockTokens}
        disabled={isRequesting}
        className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-semibold flex items-center justify-center space-x-2 transition-all hover:bg-indigo-700 disabled:bg-gray-100"
      >
        {isRequesting ? <span>Processing...</span> : <><CheckCircle className="h-5 w-5" /><span>Request 1000 Test CTT</span></>}
      </button>
    </div>
  );
}
