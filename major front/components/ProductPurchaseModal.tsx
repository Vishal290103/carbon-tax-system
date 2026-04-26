import { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { 
  ShoppingCart, 
  Leaf, 
  AlertTriangle, 
  Calculator,
  TreePine,
  Zap,
  CheckCircle,
  Clock,
  CreditCard
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
  onPurchaseComplete?: () => void;
}

export function ProductPurchaseModal({ 
  product, 
  isOpen, 
  onClose, 
  onPurchaseComplete: _onPurchaseComplete 
}: ProductPurchaseModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [_txHash, setTxHash] = useState<string | null>(null);
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
    // First check: Wallet must be connected for blockchain transparency
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
      // Step 1: First record transaction on blockchain (user sees MetaMask)
      toast.loading('Please approve blockchain transaction in MetaMask...', { id: 'blockchain-approval' });
      
      const blockchainHash = await web3Service.recordTransactionOnBlockchain(
        product.id,
        grandTotal,
        totalCarbonTax,
        'pending' // Will update with real payment ID later
      );
      
      if (!blockchainHash) {
        throw new Error('Blockchain recording failed - transaction cannot proceed without transparency record');
      }
      
      toast.success('Blockchain transaction approved!', { id: 'blockchain-approval' });
      setBlockchainTxHash(blockchainHash);
      
      // Step 2: Now process INR payment after blockchain approval
      const paymentDetails = {
        amount: grandTotal,
        productId: product.id,
        productName: product.name,
        carbonTax: totalCarbonTax,
        customerEmail: 'customer@example.com', // In real app, get from user
        blockchainTxHash: blockchainHash // Include blockchain hash in payment
      };

      const payment = await paymentService.processINRPayment(paymentDetails);
      
      if (!payment || !payment.success) {
        toast.error('Payment failed after blockchain approval. Please contact support with blockchain hash: ' + blockchainHash);
        return;
      }

      setPaymentResult(payment);
      
      // Step 3: Save complete transaction to local storage
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
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setShowConfirmation(false);
    setIsProcessing(false);
    setTxHash(null);
    setPaymentResult(null);
    setBlockchainTxHash(null);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'electronics':
        return <Zap className="h-5 w-5 text-blue-600" />;
      case 'clothing':
        return <Leaf className="h-5 w-5 text-green-600" />;
      default:
        return <ShoppingCart className="h-5 w-5 text-gray-600" />;
    }
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
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Transaction Successful!
            </h3>
            <p className="text-gray-600">
              Your INR payment has been processed successfully{blockchainTxHash ? ' and recorded on blockchain for transparency' : web3Service.isConnected() ? ' (blockchain recording attempted)' : ''}.
            </p>
            
            {web3Service.isConnected() && !blockchainTxHash && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 Blockchain recording is optional - your payment was successful via INR gateway.
                  {!blockchainTxHash && ' Recording may require ETH for gas fees.'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TreePine className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Environmental Impact</span>
            </div>
            <p className="text-sm text-green-700">
              Your carbon tax of <strong>{paymentService.formatINR(totalCarbonTax)}</strong> will fund renewable energy projects 
              to offset <strong>{totalCO2}g CO₂</strong> emissions.
            </p>
          </div>

          {/* Payment Details */}
          {paymentResult && (
            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-gray-700 mb-2">Payment Details:</p>
              <div className="space-y-1 text-gray-600">
                <p>Payment ID: <span className="font-mono text-xs">{paymentResult.transactionId}</span></p>
                <p>Amount: {paymentService.formatINR(paymentResult.amount)}</p>
                <p>Method: {paymentResult.paymentMethod.toUpperCase()}</p>
              </div>
            </div>
          )}
          
          {/* Blockchain Transaction Hash (if recorded) */}
          {blockchainTxHash && (
            <div className="bg-blue-50 p-3 rounded-lg text-sm">
              <p className="font-medium text-blue-700 mb-2">Blockchain Record:</p>
              <a 
                href={`https://sepolia.etherscan.io/tx/${blockchainTxHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all text-xs font-mono"
              >
                {blockchainTxHash}
              </a>
              <p className="text-blue-600 text-xs mt-1">Transaction recorded for transparency</p>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>This window will close automatically in a few seconds...</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Purchase Product">
      <div className="space-y-6">
        {/* Product Header */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            {getCategoryIcon(product.category)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.category}</p>
            {product.manufacturer && (
              <p className="text-xs text-gray-400">by {product.manufacturer}</p>
            )}
          </div>
        </div>

        {/* Quantity Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
            >
              +
            </button>
          </div>
        </div>

        {/* Environmental Impact */}
        <div className={`p-4 rounded-lg ${getEmissionLevel(totalCO2).bgColor}`}>
          <div className="flex items-center space-x-2 mb-2">
            <Leaf className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Environmental Impact</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getEmissionLevel(totalCO2).color} bg-white`}>
              {getEmissionLevel(totalCO2).level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">CO₂ Emissions</p>
              <p className="font-semibold">{totalCO2}g per purchase</p>
            </div>
            <div>
              <p className="text-gray-600">Annual Equivalent</p>
              <p className="font-semibold">{(totalCO2 * 52 / 1000).toFixed(1)}kg CO₂/year</p>
            </div>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calculator className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Price Breakdown</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Price ({quantity}x)</span>
              <span>{paymentService.formatINR(totalBasePrice)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Carbon Tax</span>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <span className="text-red-600 font-medium">{paymentService.formatINR(totalCarbonTax)}</span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{paymentService.formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Tax Information */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <TreePine className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Where Your Carbon Tax Goes</p>
              <p>
                Your {paymentService.formatINR(totalCarbonTax)} carbon tax will be transparently allocated to verified 
                renewable energy projects that offset your purchase's environmental impact. 
                Track the funds in real-time through our Transparency Portal.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePurchase}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4" />
                <span>Approve in MetaMask → Pay {paymentService.formatINR(grandTotal)}</span>
              </div>
            )}
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-xs text-gray-500 text-center">
          <div className="mb-2">
            <strong className="text-gray-700">Transaction Process:</strong>
          </div>
          <div className="space-y-1">
            <p>1️⃣ You'll pay the blockchain transaction fee in ETH via MetaMask (includes product price + gas)</p>
            <p>2️⃣ Then you'll pay {paymentService.formatINR(grandTotal)} via secure INR payment gateway</p>
            <p>3️⃣ Your carbon tax supports verified environmental projects with full blockchain transparency</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
