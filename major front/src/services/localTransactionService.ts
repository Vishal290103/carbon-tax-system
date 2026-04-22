export interface INRTransaction {
  id: string;
  productId: number;
  productName: string;
  basePrice: number;
  carbonTax: number;
  totalAmount: number;
  currency: 'INR';
  paymentTransactionId: string;
  paymentMethod: string;
  blockchainTxHash?: string;
  timestamp: number;
  co2Emission: number;
}

class LocalTransactionService {
  private readonly STORAGE_KEY = 'carbon_tax_inr_transactions';

  /**
   * Save an INR transaction to local storage
   */
  saveTransaction(transaction: INRTransaction): void {
    try {
      const existingTransactions = this.getAllTransactions();
      const updatedTransactions = [transaction, ...existingTransactions];
      
      // Keep only last 100 transactions to avoid storage issues
      const limitedTransactions = updatedTransactions.slice(0, 100);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedTransactions));
    } catch (error) {
      console.error('Error saving transaction to local storage:', error);
    }
  }

  /**
   * Get all stored INR transactions
   */
  getAllTransactions(): INRTransaction[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const transactions = JSON.parse(stored);
      return Array.isArray(transactions) ? transactions : [];
    } catch (error) {
      console.error('Error loading transactions from local storage:', error);
      return [];
    }
  }

  /**
   * Get recent transactions (last N)
   */
  getRecentTransactions(limit: number = 5): INRTransaction[] {
    const allTransactions = this.getAllTransactions();
    return allTransactions.slice(0, limit);
  }

  /**
   * Get transactions by date range
   */
  getTransactionsByDateRange(startDate: Date, endDate: Date): INRTransaction[] {
    const allTransactions = this.getAllTransactions();
    return allTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate >= startDate && txDate <= endDate;
    });
  }

  /**
   * Get total statistics from stored transactions
   */
  getTransactionStats(): {
    totalTransactions: number;
    totalAmountINR: number;
    totalCarbonTaxINR: number;
    totalCO2Emission: number;
  } {
    const transactions = this.getAllTransactions();
    
    return {
      totalTransactions: transactions.length,
      totalAmountINR: transactions.reduce((sum, tx) => sum + tx.totalAmount, 0),
      totalCarbonTaxINR: transactions.reduce((sum, tx) => sum + tx.carbonTax, 0),
      totalCO2Emission: transactions.reduce((sum, tx) => sum + tx.co2Emission, 0)
    };
  }

  /**
   * Update blockchain hash for a transaction
   */
  updateBlockchainHash(paymentTransactionId: string, blockchainTxHash: string): void {
    try {
      const transactions = this.getAllTransactions();
      const updatedTransactions = transactions.map(tx => 
        tx.paymentTransactionId === paymentTransactionId 
          ? { ...tx, blockchainTxHash }
          : tx
      );
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error updating blockchain hash:', error);
    }
  }

  /**
   * Clear all transactions (for testing)
   */
  clearAllTransactions(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing transactions:', error);
    }
  }

  /**
   * Generate a unique transaction ID
   */
  generateTransactionId(): string {
    return `inr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const localTransactionService = new LocalTransactionService();