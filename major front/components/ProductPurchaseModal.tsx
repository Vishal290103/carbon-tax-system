import { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { 
  CheckCircle
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
  const [blockchainTxHash, setBlockchainTxHash] = useState<string | null>(null);

  if (!product) return null;

  const ethBasePriceINR = paymentService.convertEthToINR(product.basePrice);
  const ethCarbonTaxINR = paymentService.convertEthToINR(product.carbonTax);
  
  const totalBasePrice = ethBasePriceINR * quantity;
  const totalCarbonTax = ethCarbonTaxINR * quantity;
  const totalCO2 = product.co2Emission * quantity;
  const grandTotal = totalBasePrice + totalCarbonTax;

  const handlePurchase = async () => {
    if (!web3Service.isConnected()) {
      toast.error('Connect wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      toast.loading('Approving blockchain record...', { id: 'blockchain' });
      
      const hash = await web3Service.recordTransactionOnBlockchain(
        product.id,
        grandTotal,
        totalCarbonTax,
        'pending'
      );
      
      if (!hash) throw new Error('Failed');
      
      setBlockchainTxHash(hash);
      
      const payment = await paymentService.processINRPayment({
        amount: grandTotal,
        productId: product.id,
        productName: product.name,
        carbonTax: totalCarbonTax
      });
      
      if (payment?.success) {
        localTransactionService.saveTransaction({
          id: localTransactionService.generateTransactionId(),
          productId: product.id,
          productName: product.name,
          basePrice: totalBasePrice,
          carbonTax: totalCarbonTax,
          totalAmount: grandTotal,
          currency: 'INR',
          paymentTransactionId: payment.transactionId,
          paymentMethod: payment.paymentMethod,
          blockchainTxHash: hash,
          timestamp: Date.now(),
          co2Emission: totalCO2
        });
        setShowConfirmation(true);
      }
    } catch (e) {
      toast.error('Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showConfirmation) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Success">
        <div className="text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <p>Transaction successful!</p>
          {blockchainTxHash && <p className="text-xs font-mono">{blockchainTxHash}</p>}
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Purchase">
      <div className="space-y-4">
        <h3>{product.name}</h3>
        <div className="flex items-center space-x-2">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
          <span>{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)}>+</button>
        </div>
        <div className="border-t pt-2">
          <div className="flex justify-between"><span>Base</span><span>{paymentService.formatINR(totalBasePrice)}</span></div>
          <div className="flex justify-between"><span>Tax</span><span>{paymentService.formatINR(totalCarbonTax)}</span></div>
          <div className="flex justify-between font-bold"><span>Total</span><span>{paymentService.formatINR(grandTotal)}</span></div>
        </div>
        <Button onClick={handlePurchase} disabled={isProcessing} className="w-full">
          {isProcessing ? 'Processing...' : `Pay ${paymentService.formatINR(grandTotal)}`}
        </Button>
      </div>
    </Modal>
  );
}
