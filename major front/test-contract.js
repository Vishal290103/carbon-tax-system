import { ethers } from 'ethers';
import config from './src/contracts/contract-config.json' assert { type: 'json' };

async function testContract() {
  console.log('🧪 Testing Contract Connection and Token Functions...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const contract = new ethers.Contract(config.contractAddress, config.abi, provider);
    
    console.log('📍 Contract Address:', config.contractAddress);
    console.log('🌐 Network:', config.network);
    console.log('👤 Deployer:', config.deployer);
    console.log('');
    
    // Test token info functions
    console.log('🪙 TESTING TOKEN FUNCTIONS:');
    
    const name = await contract.name();
    console.log('✅ Token Name:', name);
    
    const symbol = await contract.symbol();
    console.log('✅ Token Symbol:', symbol);
    
    const decimals = await contract.decimals();
    console.log('✅ Token Decimals:', decimals.toString());
    
    const totalSupply = await contract.totalSupply();
    console.log('✅ Total Supply:', ethers.formatEther(totalSupply), symbol);
    
    console.log('');
    console.log('🏭 TESTING SYSTEM FUNCTIONS:');
    
    // Test system stats
    const stats = await contract.getSystemStats();
    console.log('✅ Active Products:', stats._activeProducts.toString());
    console.log('✅ Active Projects:', stats._activeProjects.toString());
    console.log('✅ Total Validators:', stats._totalValidators.toString());
    console.log('✅ Tax Collected:', ethers.formatEther(stats._totalTaxCollected), 'ETH');
    
    // Test product counter
    const productCount = await contract.productCounter();
    console.log('✅ Product Counter:', productCount.toString());
    
    if (productCount > 0) {
      console.log('');
      console.log('🛍️ TESTING PRODUCTS:');
      
      for (let i = 1; i <= Math.min(Number(productCount), 3); i++) {
        const product = await contract.products(i);
        console.log(`✅ Product ${i}:`, {
          name: product.name,
          basePrice: ethers.formatEther(product.basePrice) + ' ETH',
          carbonTax: ethers.formatEther(product.carbonTax) + ' ETH',
          isActive: product.isActive
        });
      }
    }
    
    console.log('');
    console.log('🎯 TESTING TOKEN PURCHASE FUNCTIONS:');
    
    // Test token purchase info
    const purchaseInfo = await contract.getTokenPurchaseInfo();
    console.log('✅ Token Price:', ethers.formatEther(purchaseInfo._tokenPrice), 'ETH per token');
    console.log('✅ Min Purchase:', ethers.formatEther(purchaseInfo._minPurchase), 'tokens');
    console.log('✅ Max Purchase:', ethers.formatEther(purchaseInfo._maxPurchase), 'tokens');
    
    console.log('');
    console.log('🎉 ALL TESTS PASSED! Contract is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('could not detect network')) {
      console.log('💡 Suggestion: Make sure Hardhat node is running on port 8545');
      console.log('   Run: npx hardhat node --port 8545');
    } else if (error.message.includes('call revert exception')) {
      console.log('💡 Suggestion: Contract might not be deployed or ABI mismatch');
      console.log('   Run: npx hardhat run scripts/deploy.js --network localhost');
    }
  }
}

testContract();