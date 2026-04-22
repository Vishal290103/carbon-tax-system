# 🚀 Complete Setup Guide - Carbon Tax System

## Problem Solved ✅

The error `could not decode result data (value="0x")` has been fixed! This was caused by the smart contract not being properly deployed to the local blockchain network.

## ✅ **Current Status**

- ✅ Smart contract deployed successfully to `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- ✅ Hardhat node running on `localhost:8545`
- ✅ Token purchase functionality working (`buyTokensWithETH`)
- ✅ Validator system fully functional
- ✅ Backend API endpoints operational
- ✅ Frontend components updated

## 🔧 **Step-by-Step Setup**

### **1. Start Hardhat Blockchain Node**
```bash
# Terminal 1: Start local blockchain
cd "contracts"
npx hardhat node --port 8545
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

### **2. Deploy Smart Contract**
```bash
# Terminal 2: Deploy contract
cd "contracts"
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
✅ CarbonTaxSystem deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
✅ Government wallet address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✅ Backend configuration updated
✅ Frontend configuration saved
```

### **3. Start Backend Server**
```bash
# Terminal 3: Start Spring Boot backend
cd "major back"
mvn spring-boot:run
```

**Expected Output:**
```
Started ApiApplication in X.XXX seconds (JVM running for X.XXX)
Tomcat started on port(s): 8081 (http)
```

### **4. Start Frontend Development Server**
```bash
# Terminal 4: Start React frontend
cd "major front"
npm run dev
```

**Expected Output:**
```
Local:   http://localhost:5173/
Network: use --host to expose
```

### **5. Configure MetaMask**

#### **Add Hardhat Network to MetaMask:**
1. Open MetaMask extension
2. Click network dropdown → "Add network" → "Add a network manually"
3. Enter these details:
   ```
   Network Name: Hardhat Local
   New RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency Symbol: ETH
   Block Explorer URL: (leave empty)
   ```
4. Click "Save"

#### **Import Test Account:**
1. Click account icon → "Import Account"
2. Select "Private Key"
3. Enter: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. This gives you the deployer account with 500,000 CTT tokens

## 🧪 **Testing the System**

### **1. Test Contract Connection**
```bash
cd "major front"
node -e "
const { ethers } = require('ethers');
const config = require('./src/contracts/contract-config.json');
const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const contract = new ethers.Contract(config.contractAddress, config.abi, provider);
contract.name().then(name => console.log('✅ Contract connected:', name));
"
```

### **2. Test Token Purchase**
1. Open `http://localhost:5173`
2. Connect MetaMask wallet
3. Go to "Validator" tab
4. Click "💳 Buy CTT with ETH"
5. Purchase 1000 CTT tokens for 1 ETH

### **3. Test Backend API**
```bash
# Test exchange rate endpoint
curl http://localhost:8081/api/blockchain/tokens/exchange-rate

# Expected response:
{
  "success": true,
  "ethToTokenRate": "1000",
  "tokenToEthRate": "0.001",
  "minimumPurchase": "100",
  "maximumPurchase": "10000"
}
```

## 🔧 **Troubleshooting**

### **Problem: "could not decode result data"**
**Solution:** 
1. Stop all processes
2. Kill any process on port 8545: `lsof -ti:8545 | xargs kill -9`
3. Restart Hardhat node: `npx hardhat node --port 8545`
4. Redeploy contract: `npx hardhat run scripts/deploy.js --network localhost`

### **Problem: MetaMask "Internal JSON-RPC error"**
**Solution:**
1. Go to MetaMask Settings → Advanced
2. Click "Reset Account" (this clears transaction history)
3. Switch to Hardhat Local network
4. Retry transaction

### **Problem: "Insufficient funds"**
**Solution:**
1. Import the test account with private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
2. This account has 10,000 ETH and 500,000 CTT tokens

### **Problem: Frontend not connecting**
**Solution:**
1. Clear browser cache
2. Refresh the page
3. Reconnect MetaMask wallet

## 📊 **System Architecture**

```
Frontend (React)     Backend (Spring Boot)     Smart Contract (Solidity)
localhost:5173  →    localhost:8081      →     localhost:8545
                                              
├─ Token Purchase Modal  ├─ Token Purchase API      ├─ buyTokensWithETH()
├─ Validator Dashboard   ├─ Validator Endpoints     ├─ stakeTokens()
├─ Product Purchase      ├─ Validation Service      ├─ purchaseProduct()
└─ Transparency Portal   └─ Blockchain Controller   └─ getSystemStats()
```

## 🎯 **Available Features**

### **✅ Token Purchase System**
- **Exchange Rate**: 1 ETH = 1000 CTT tokens
- **Min Purchase**: 100 CTT tokens  
- **Max Purchase**: 10,000 CTT tokens
- **Auto Balance Check**: Prevents insufficient fund errors

### **✅ Validator System**
- **Minimum Stake**: 1000 CTT tokens
- **Annual Rewards**: 5% for active validators
- **Stake/Unstake**: Full control over validator status
- **Real-time Stats**: Live validator count and statistics

### **✅ Product Management**
- **Add Products**: With carbon emissions and pricing
- **Purchase Products**: Automatic carbon tax calculation
- **Tax Collection**: Transparent fund allocation

### **✅ Green Projects**
- **Create Projects**: Government-only function
- **Fund Projects**: Using collected carbon tax
- **Track Progress**: Monitor CO2 reduction goals

## 🌟 **Demo Scenarios**

### **Scenario 1: New User Becomes Validator**
1. User connects wallet (has 0 CTT tokens)
2. User clicks "Buy CTT with ETH"
3. Purchases 2000 CTT for 2 ETH
4. User stakes 1000 CTT to become validator
5. User earns rewards and participates in consensus

### **Scenario 2: Product Purchase with Carbon Tax**
1. Manufacturer adds "Eco Laptop" (500g CO2, $1000)
2. Customer purchases laptop
3. System calculates 5% carbon tax ($50)
4. Payment split: $1000 to manufacturer, $50 to government
5. Transaction recorded immutably on blockchain

### **Scenario 3: Green Project Funding**
1. Government creates "Solar Farm" project (needs $100K)
2. Carbon tax revenue accumulates from product sales
3. Government allocates funds to solar project
4. Progress tracked transparently on blockchain
5. CO2 reduction targets monitored

## 🎓 **College Project Benefits**

### **Technical Learning:**
- **Blockchain Development**: Smart contract programming
- **Full-Stack Development**: React + Spring Boot + Ethereum
- **Proof-of-Stake**: Modern consensus mechanism implementation
- **API Integration**: RESTful services with blockchain

### **Environmental Impact:**
- **Carbon Tax Automation**: Reduces bureaucratic overhead
- **Transparent Fund Allocation**: Prevents corruption
- **Green Project Funding**: Direct environmental benefit
- **Immutable Records**: Permanent environmental accounting

### **Real-World Applications:**
- **Government Systems**: Tax collection automation
- **Corporate Sustainability**: Carbon footprint tracking
- **Environmental Compliance**: Automated regulatory reporting
- **Green Finance**: Sustainable investment tracking

## 🚀 **Next Steps**

1. **✅ Setup Complete**: All systems operational
2. **✅ Test Token Purchase**: Buy CTT with ETH working
3. **✅ Test Validator Staking**: Become validator working
4. **📋 Demo Preparation**: Create presentation scenarios
5. **🎯 Future Enhancements**: Dynamic pricing, mobile app, etc.

The Carbon Tax System is now fully functional with working token purchase, validator staking, and transparent carbon tax collection! 🌱💚