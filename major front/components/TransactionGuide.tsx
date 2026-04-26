import { Eye, Receipt, Search, ExternalLink } from 'lucide-react';

export function TransactionGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Search className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">Where to Find Your Transactions</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          
          {/* After Purchase */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">After Purchase</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Immediately after completing a purchase, you'll see:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>✓ Payment confirmation with INR amount</li>
              <li>✓ Payment transaction ID</li>
              <li>✓ Blockchain hash (if wallet connected)</li>
              <li>✓ Carbon tax breakdown</li>
            </ul>
          </div>

          {/* Transparency Portal */}
          <div className="bg-white p-4 rounded-lg border border-blue-300">
            <div className="flex items-center space-x-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">Transparency Portal</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Click "Transparency" tab to view:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>✓ All transaction history</li>
              <li>✓ System statistics in INR</li>
              <li>✓ Carbon tax allocation</li>
              <li>✓ Blockchain links</li>
            </ul>
            <div className="mt-2 text-xs text-blue-600 font-medium">
              → This is the main location for transaction records
            </div>
          </div>

          {/* Browser Blockchain Explorer */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <ExternalLink className="h-4 w-4 text-purple-600" />
              <h4 className="font-medium text-gray-900">Blockchain Explorer</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Click blockchain links to see:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>✓ Raw blockchain data</li>
              <li>✓ Gas fees used</li>
              <li>✓ Block confirmation</li>
              <li>✓ Immutable proof</li>
            </ul>
          </div>
        </div>

        {/* Step by Step */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">📋 How to View Your Transactions:</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">For Current Purchase:</p>
              <ol className="text-xs text-gray-600 space-y-1">
                <li>1. Make a purchase with INR payment</li>
                <li>2. View confirmation modal with receipt</li>
                <li>3. Note the Payment ID and Blockchain hash</li>
              </ol>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">For All Transactions:</p>
              <ol className="text-xs text-gray-600 space-y-1">
                <li>1. Navigate to "Transparency" tab</li>
                <li>2. Click "Transactions" sub-tab</li>
                <li>3. View complete history table</li>
                <li>4. Click blockchain links for details</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Note about wallet */}
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Important:</strong> Wallet connection is required for all purchases. 
            All transactions must be recorded on blockchain for complete transparency and anti-corruption measures.
            You'll need some ETH in your wallet for gas fees.
          </p>
        </div>
      </div>
    </div>
  );
}