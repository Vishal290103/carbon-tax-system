import { ExternalLink, Zap, AlertTriangle } from 'lucide-react';
import { web3Service } from '../src/services/web3Service';
import { useState, useEffect } from 'react';

export function EthRequirement() {
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const updateBalance = async () => {
      if (web3Service.isConnected()) {
        setIsConnected(true);
        const balance = await web3Service.getBalance();
        setEthBalance(balance);
      } else {
        setIsConnected(false);
        setEthBalance('0');
      }
    };

    updateBalance();
    
    // Update balance every 10 seconds
    const interval = setInterval(updateBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  // Need ETH for actual blockchain transactions (products cost ETH in the contract)
  const minRequiredEth = 0.05; // Minimum for small products + gas
  const hasEnoughEth = parseFloat(ethBalance) >= minRequiredEth;

  if (!isConnected) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Wallet Connection Required</h3>
        </div>
        <p className="text-sm text-blue-800">
          Connect your MetaMask wallet to make purchases. Blockchain recording is required for all transactions.
        </p>
      </div>
    );
  }

  if (!hasEnoughEth) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <h3 className="font-semibold text-orange-900">ETH Required for Gas Fees</h3>
        </div>
        
        <div className="mb-3">
          <p className="text-sm text-orange-800 mb-2">
            Current balance: <strong>{parseFloat(ethBalance).toFixed(6)} ETH</strong>
          </p>
          <p className="text-sm text-orange-700">
            You need ETH to pay for blockchain recording (products have ETH prices in the smart contract).
            MetaMask will show the exact amount + gas fees for each product.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-orange-900 text-sm mb-2">Get Test ETH (Recommended: 0.1 ETH):</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <a
                href="https://sepoliafaucet.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-orange-100 rounded text-sm text-orange-800 hover:bg-orange-200 transition-colors"
              >
                <span>Sepolia Faucet</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href="https://faucets.chain.link/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2 bg-orange-100 rounded text-sm text-orange-800 hover:bg-orange-200 transition-colors"
              >
                <span>Chainlink Faucet</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          
          <p className="text-xs text-orange-600">
            💡 These are test networks - the ETH is free and has no real value. 
            It's only used to pay for transaction fees on the blockchain.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <Zap className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900">Ready for Transactions</h3>
      </div>
      <p className="text-sm text-green-800">
        Wallet connected with <strong>{parseFloat(ethBalance).toFixed(6)} ETH</strong>. 
        You can now make purchases! MetaMask will show you the exact gas fees before each transaction.
      </p>
    </div>
  );
}