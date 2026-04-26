import { Eye, Receipt, Search, ExternalLink } from 'lucide-react';

export function TransactionGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Where to Find Your Transactions</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Eye className="h-5 w-5 text-gray-500 mt-1" />
          <div>
            <p className="text-sm font-medium text-blue-900">Transparency Portal</p>
            <p className="text-xs text-blue-700">View the complete history of all carbon tax payments and fund allocations.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Receipt className="h-5 w-5 text-gray-500 mt-1" />
          <div>
            <p className="text-sm font-medium text-blue-900">MetaMask Activity</p>
            <p className="text-xs text-blue-700">Check your wallet's activity tab for technical details of blockchain interactions.</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-100">
          <a 
            href="https://sepolia.etherscan.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <span>View on Sepolia Etherscan</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
