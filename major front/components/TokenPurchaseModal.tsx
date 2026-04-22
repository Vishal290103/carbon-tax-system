import { useState, useEffect } from 'react';
import { web3Service } from '../src/services/web3Service';
import { X, Coins, DollarSign, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

interface ExchangeRate {
  ethToTokenRate: string;
  tokenToEthRate: string;
  minimumPurchase: string;
  maximumPurchase: string;
}

export function TokenPurchaseModal({ isOpen, onClose, onPurchaseComplete }: TokenPurchaseModalProps) {
  const [tokenAmount, setTokenAmount] = useState<string>('1000');
  const [ethAmount, setEthAmount] = useState<string>('1.0');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userEthBalance, setUserEthBalance] = useState<string>('0');
  const [estimatedGasFee] = useState<string>('0.01');

  useEffect(() => {
    if (isOpen) {
      loadExchangeRate();
      loadUserBalance();
    }
  }, [isOpen]);

  useEffect(() => {
    if (tokenAmount && exchangeRate) {
      calculateEthAmount();
    }
  }, [tokenAmount, exchangeRate]);

  const loadExchangeRate = async () => {
    try {
      const response = await fetch('http://localhost:8081/api/blockchain/tokens/exchange-rate');
      const data = await response.json();
      if (data.success) {
        setExchangeRate(data);
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      toast.error('Failed to load exchange rate');
    }
  };

  const loadUserBalance = async () => {
    try {
      const balance = await web3Service.getBalance();
      setUserEthBalance(balance);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  const calculateEthAmount = () => {
    if (!tokenAmount || !exchangeRate) return;
    
    const tokens = parseFloat(tokenAmount);
    const rate = parseFloat(exchangeRate.ethToTokenRate); // 1000 CTT per 1 ETH
    const ethRequired = tokens / rate;
    setEthAmount(ethRequired.toFixed(6));
  };

  const calculateTokenAmount = () => {
    if (!ethAmount || !exchangeRate) return;
    
    const eth = parseFloat(ethAmount);
    const rate = parseFloat(exchangeRate.ethToTokenRate); // 1000 CTT per 1 ETH
    const tokensReceived = eth * rate;
    setTokenAmount(tokensReceived.toString());
  };

  const handleTokenAmountChange = (value: string) => {
    setTokenAmount(value);
  };

  const handleEthAmountChange = (value: string) => {
    setEthAmount(value);
    if (value && exchangeRate) {
      const eth = parseFloat(value);
      const rate = parseFloat(exchangeRate.ethToTokenRate);
      const tokensReceived = eth * rate;
      setTokenAmount(tokensReceived.toString());
    }
  };

  const validatePurchase = (): string | null => {
    if (!exchangeRate) return 'Exchange rate not loaded';
    
    const tokens = parseFloat(tokenAmount);
    const eth = parseFloat(ethAmount);
    const userBalance = parseFloat(userEthBalance);
    const gas = parseFloat(estimatedGasFee);
    
    if (tokens < parseFloat(exchangeRate.minimumPurchase)) {
      return `Minimum purchase is ${exchangeRate.minimumPurchase} CTT tokens`;
    }
    
    if (tokens > parseFloat(exchangeRate.maximumPurchase)) {
      return `Maximum purchase is ${exchangeRate.maximumPurchase} CTT tokens per transaction`;
    }
    
    if (eth + gas > userBalance) {
      return `Insufficient ETH balance. Required: ${(eth + gas).toFixed(6)} ETH (including gas)`;
    }
    
    return null;
  };

  const handlePurchase = async () => {
    if (!web3Service.isConnected()) {
      toast.error('Please connect your wallet first');
      return;
    }

    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsPurchasing(true);
    
    try {
      // First try the backend API approach with validation
      const response = await fetch('http://localhost:8081/api/blockchain/tokens/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAmount: parseFloat(tokenAmount),
          ethAmount: parseFloat(ethAmount)
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`Successfully purchased ${tokenAmount} CTT tokens for ${ethAmount} ETH!`, {
          duration: 5000
        });
        onPurchaseComplete();
        onClose();
      } else {
        // If backend fails, try direct smart contract call
        toast.loading('Backend unavailable, trying direct blockchain transaction...', { id: 'purchase' });
        
        const success = await web3Service.buyTokensWithETH(tokenAmount);
        if (success) {
          toast.success(`Successfully purchased ${tokenAmount} CTT tokens!`, { id: 'purchase' });
          onPurchaseComplete();
          onClose();
        } else {
          toast.error('Purchase failed', { id: 'purchase' });
        }
      }
    } catch (error) {
      console.error('Error purchasing tokens:', error);
      
      // Fallback to direct smart contract interaction
      try {
        toast.loading('Trying direct blockchain transaction...', { id: 'purchase' });
        const success = await web3Service.buyTokensWithETH(tokenAmount);
        if (success) {
          toast.success(`Successfully purchased ${tokenAmount} CTT tokens!`, { id: 'purchase' });
          onPurchaseComplete();
          onClose();
        } else {
          toast.error('Purchase failed', { id: 'purchase' });
        }
      } catch (fallbackError) {
        toast.error('Token purchase failed. Please try again.', { id: 'purchase' });
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const setPresetAmount = (tokens: number) => {
    setTokenAmount(tokens.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Coins className="h-6 w-6 text-green-600" />
              <span>Buy CTT Tokens</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Exchange Rate Info */}
          {exchangeRate && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Current Exchange Rate</span>
              </div>
              <p className="text-blue-700 text-sm">
                1 ETH = {exchangeRate.ethToTokenRate} CTT tokens
              </p>
              <p className="text-blue-700 text-sm">
                1 CTT = {exchangeRate.tokenToEthRate} ETH
              </p>
            </div>
          )}

          {/* Token Amount Input */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CTT Tokens to Purchase
              </label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={tokenAmount}
                onChange={(e) => handleTokenAmountChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="1000"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: {exchangeRate?.minimumPurchase || '100'} CTT • Max: {exchangeRate?.maximumPurchase || '10000'} CTT
              </p>
              
              {/* Preset Amounts */}
              <div className="flex space-x-2 mt-2">
                {[1000, 2000, 5000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setPresetAmount(amount)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-sm rounded transition-colors"
                  >
                    {amount} CTT
                  </button>
                ))}
              </div>
            </div>

            {/* ETH Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ETH Required
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.000001"
                  value={ethAmount}
                  onChange={(e) => handleEthAmountChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1.0"
                />
                <DollarSign className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Balance and Cost Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your ETH Balance:</span>
                <span className="font-medium">{parseFloat(userEthBalance).toFixed(6)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Token Cost:</span>
                <span className="font-medium">{ethAmount} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Gas:</span>
                <span className="font-medium">{estimatedGasFee} ETH</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Required:</span>
                <span>{(parseFloat(ethAmount) + parseFloat(estimatedGasFee)).toFixed(6)} ETH</span>
              </div>
            </div>

            {/* Validation Messages */}
            {(() => {
              const error = validatePurchase();
              if (error) {
                return (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                );
              } else if (tokenAmount && ethAmount) {
                return (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-green-700 text-sm">Ready to purchase {tokenAmount} CTT tokens</span>
                  </div>
                );
              }
              return null;
            })()}

            {/* Purchase Button */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={isPurchasing || !!validatePurchase()}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isPurchasing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4" />
                    <span>Buy Tokens</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">How Token Purchase Works</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Send ETH to the smart contract</li>
              <li>• Contract automatically mints CTT tokens to your wallet</li>
              <li>• Fixed exchange rate: 1 ETH = 1000 CTT tokens</li>
              <li>• Minimum purchase: 100 CTT tokens</li>
              <li>• Your ETH helps fund green projects</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}