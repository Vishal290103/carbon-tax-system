import { toast } from 'react-hot-toast';

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  paymentMethod: 'razorpay' | 'paytm' | 'phonepe' | 'stripe' | 'mock';
  amount: number;
  currency: 'INR';
  timestamp: number;
}

export interface PaymentDetails {
  amount: number;
  productId: number;
  productName: string;
  carbonTax: number;
  customerEmail?: string;
  blockchainTxHash?: string;
}

const ETH_TO_INR_RATE = 200000;

export class PaymentService {
  private mockPaymentEnabled = true;

  convertEthToINR(ethAmount: number): number {
    return ethAmount * ETH_TO_INR_RATE;
  }

  convertINRToEth(inrAmount: number): number {
    return inrAmount / ETH_TO_INR_RATE;
  }

  async processINRPayment(paymentDetails: PaymentDetails): Promise<PaymentResult | null> {
    try {
      if (this.mockPaymentEnabled) {
        return await this.processMockPayment(paymentDetails);
      }
      throw new Error('Real payment processing not implemented yet');
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed');
      return null;
    }
  }

  private async processMockPayment(paymentDetails: PaymentDetails): Promise<PaymentResult> {
    toast.loading('Processing INR payment...', { id: 'inr-payment' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    const result: PaymentResult = {
      success: true,
      transactionId: `mock_${Date.now()}`,
      paymentMethod: 'mock',
      amount: paymentDetails.amount,
      currency: 'INR',
      timestamp: Date.now()
    };
    toast.success('Payment processed successfully!', { id: 'inr-payment' });
    return result;
  }

  formatINR(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  validatePaymentAmount(amount: number): boolean {
    return amount > 0 && amount <= 500000;
  }
}

export const paymentService = new PaymentService();
