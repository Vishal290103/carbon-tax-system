import { Code, Terminal, AlertCircle, CheckCircle } from 'lucide-react';

export function TokenIssueGuide() {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-800">Token Distribution Issue</h3>
      </div>
      
      <p className="text-red-700 mb-4">
        The contract's token distribution function isn't working because either:
      </p>
      
      <ul className="list-disc list-inside text-red-700 space-y-1 mb-4">
        <li>The contract doesn't have pre-minted tokens to distribute</li>
        <li>You're not connected as the contract owner/deployer</li>
        <li>The contract's initial token supply went to the deployer's address</li>
      </ul>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <Terminal className="h-4 w-4 text-blue-600" />
            <h4 className="font-medium text-gray-800">Quick Fix (Hardhat)</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>1. In your terminal, run:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              npx hardhat console --network localhost
            </code>
            <p>2. Then in the console:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              {`const contract = await ethers.getContractAt("YourContract", "0x5FbDB...80aa3");`}
              <br />
              {`await contract.transfer("YOUR_WALLET_ADDRESS", ethers.parseEther("10000"));`}
            </code>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h4 className="font-medium text-gray-800">Better Solution</h4>
          </div>
          <div className="text-sm text-gray-600 space-y-2">
            <p>Add a faucet function to your contract:</p>
            <code className="block bg-gray-100 p-2 rounded text-xs">
              {`function faucet() external {`}
              <br />
              {`  require(balanceOf(msg.sender) == 0, "Already received");`}
              <br />
              {`  _mint(msg.sender, 2000 * 10**decimals());`}
              <br />
              {`}`}
            </code>
            <p>Then redeploy the contract.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-xs text-yellow-700">
          <strong>For now:</strong> You can test the validator UI functionality with the mock faucet above, 
          even though it won't actually give you real tokens. The staking/unstaking/rewards UI will work 
          once you have real tokens.
        </p>
      </div>
    </div>
  );
}