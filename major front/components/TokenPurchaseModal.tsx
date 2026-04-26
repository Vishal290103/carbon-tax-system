import { useState, useEffect } from 'react';
import { web3Service } from '../src/services/web3Service';
import { BLOCKCHAIN_API_URL } from '../src/config';
import { X, Coins } from 'lucide-react';
import { Button } from './ui/Button';
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
      const response = await fetch(`${BLOCKCHAIN_API_URL}/tokens/exchange-rate`);
      const data = await response.json();
      if (data.success) {
        setExchangeRate(data);
      }
    } catch (error) {
      console.error('Error loading exchange rate:', error);
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
    const rate = parseFloat(exchangeRate.ethToTokenRate);
    const ethRequired = tokens / rate;
    setEthAmount(ethRequired.toFixed(6));
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
    if (tokens < parseFloat(exchangeRate.minimumPurchase)) return `Min ${exchangeRate.minimumPurchase} CTT`;
    if (tokens > parseFloat(exchangeRate.maximumPurchase)) return `Max ${exchangeRate.maximumPurchase} CTT`;
    if (eth > userBalance) return 'Insufficient balance';
    return null;
  };

  const handlePurchase = async () => {
    if (!web3Service.isConnected()) {
      toast.error('Connect wallet first');
      return;
    }
    const validationError = validatePurchase();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setIsPurchasing(true);
    try {
      const response = await fetch(`${BLOCKCHAIN_API_URL}/tokens/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAmount: parseFloat(tokenAmount),
          ethAmount: parseFloat(ethAmount)
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Purchased successfully!');
        onPurchaseComplete();
        onClose();
      } else {
        const success = await web3Service.buyTokensWithETH(tokenAmount);
        if (success) {
          toast.success('Purchased successfully!');
          onPurchaseComplete();
          onClose();
        }
      }
    } catch (error) {
      console.error('Purchase error:', error);
      try {
        const success = await web3Service.buyTokensWithETH(tokenAmount);
        if (success) {
          toast.success('Purchased successfully!');
          onPurchaseComplete();
          onClose();
        }
      } catch (e) {
        toast.error('Purchase failed');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center space-x-2"><Coins /><span>Buy Tokens</span></h2>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="space-y-4">
          <input type="number" value={tokenAmount} onChange={(e) => handleTokenAmountChange(e.target.value)} className="w-full p-2 border rounded" />
          <input type="number" value={ethAmount} onChange={(e) => handleEthAmountChange(e.target.value)} className="w-full p-2 border rounded" />
          <Button onClick={handlePurchase} disabled={isPurchasing} className="w-full">
            {isPurchasing ? 'Processing...' : 'Buy Tokens'}
          </Button>
        </div>
      </div>
    </div>
  );
}
