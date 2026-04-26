import { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { 
  Leaf, 
  AlertTriangle, 
  Calculator,
  TreePine,
  CheckCircle,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { web3Service } from '../src/services/web3Service';
import { paymentService } from '../src/services/paymentService';
import { localTransactionService } from '../src/services/localTransactionService';

interface Product {
  id: number;
  name: string;
  basePrice: number;
  carbonTax: number;
  co2Emission: number;
  category: string;
  description?: string;
  manufacturer?: string;
}

interface ProductPurchaseModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductPurchaseModal({ 
  product, 
  isOpen, 
  onClose
}: ProductPurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);

  if (!product) return null;

  // Convert ETH prices to INR for display
  const ethBasePriceINR = paymentService.convertEthToINR(product.basePrice);
  const ethCarbonTaxINR = paymentService.convertEthToINR(product.carbonTax);
  
  const totalBasePrice = ethBasePriceINR * quantity;
  const totalCarbonTax = ethCarbonTaxINR * quantity;
  const totalCO2 = product.co2Emission * quantity;
  const grandTotal = totalBasePrice + totalCarbonTax;

  const handlePurchase = async () => {
    if (!web3Service.isConnected()) {
      toast.error('Please connect your wallet first - blockchain recording is required for all transactions');
      return;
    }

    if (!paymentService.validatePaymentAmount(grandTotal)) {
      toast.error('Invalid payment amount');
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading('Please approve blockchain transaction in MetaMask...', { id: 'blockchain-approval' });
      
      const blockchainHash = await web3Service.recordTransactionOnBlockchain(
        product.id,
        grandTotal,
        totalCarbonTax,
        'pending'
      );
      
      if (!blockchainHash) {
        throw new Error('Blockchain recording failed');
      }
      
      toast.success('Blockchain transaction approved!', { id: 'blockchain-approval' });
      setBlockchainTxHash(blockchainHash);
      
      const paymentDetails = {
        amount: grandTotal,
        productId: product.id,
        productName: product.name,
        carbonTax: totalCarbonTax,
        customerEmail: 'customer@example.com',
        blockchainTxHash: blockchainHash
      };

      const payment = await paymentService.processINRPayment(paymentDetails);
      
      if (!payment || !payment.success) {
        toast.error('Payment failed');
        return;
      }

      setPaymentResult(payment);
      
      const localTransaction = {
        id: localTransactionService.generateTransactionId(),
        productId: product.id,
        productName: product.name,
        basePrice: totalBasePrice,
        carbonTax: totalCarbonTax,
        totalAmount: grandTotal,
        currency: 'INR' as const,
        paymentTransactionId: payment.transactionId,
        paymentMethod: payment.paymentMethod,
        blockchainTxHash: blockchainHash,
        timestamp: Date.now(),
        co2Emission: totalCO2
      };
      
      localTransactionService.saveTransaction(localTransaction);
      setShowConfirmation(true);
      toast.success('Purchase completed successfully!');
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setShowConfirmation(false);
    setIsProcessing(false);
    setPaymentResult(null);
    setBlockchainTxHash(null);
    onClose();
  };

  const getEmissionLevel = (co2: number) => {
    if (co2 < 50) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (co2 < 200) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  if (showConfirmation) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Confirmed">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3>Transaction Successful!</h3>
          <p>Your INR payment has been processed successfully.</p>
          {blockchainTxHash && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm font-mono break-all">
              Hash: {blockchainTxHash}
            </div>
          )}
          <div className="bg-green-50 p-4 rounded-lg">
            <TreePine className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-sm">Emission offset: {totalCO2}g CO₂</p>
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>Closing automatically...</span>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Product">
      <div className="space-y-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
          <p className="text-sm text-gray-500">{product.category}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center space-x-3">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border border-gray-300">-</button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full border border-gray-300">+</button>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${getEmissionLevel(totalCO2).bgColor}`}>
          <Leaf className="h-5 w-5 text-gray-600 mb-2" />
          <p className="font-semibold">{totalCO2}g CO₂</p>
        </div>
        <div className="border rounded-lg p-4">
          <Calculator className="h-5 w-5 text-gray-600 mb-3" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base</span>
              <span>{paymentService.formatINR(totalBasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tax</span>
              <AlertTriangle className="h-4 w-4 text-orange-500 inline mx-1" />
              <span className="text-red-600">{paymentService.formatINR(totalCarbonTax)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{paymentService.formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleClose} variant="secondary" className="flex-1">Cancel</Button>
          <Button onClick={handlePurchase} disabled={isProcessing} className="flex-1">
            {isProcessing ? 'Processing...' : `Pay ${paymentService.formatINR(grandTotal)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
