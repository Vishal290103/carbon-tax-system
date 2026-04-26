import { Terminal, AlertCircle, CheckCircle } from 'lucide-react';

export function TokenIssueGuide() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-800">Token Distribution Issue</h3>
      </div>
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Terminal className="h-5 w-5 text-gray-500 mt-1" />
          <p className="text-sm text-red-700">
            It appears your wallet doesn't have enough CTT tokens to participate in the Carbon Tax System.
          </p>
        </div>
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
          <p className="text-sm text-gray-600">
            You can obtain test tokens from the Mock Token Faucet below to test the system.
          </p>
        </div>
      </div>
    </div>
  );
}
