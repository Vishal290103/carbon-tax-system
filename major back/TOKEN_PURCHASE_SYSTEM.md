# Token Purchase System - Buy CTT with ETH

## Overview

The token purchase system allows users to buy CTT (Carbon Tax Tokens) using Ethereum (ETH) through both the backend API and smart contract integration. This creates a seamless user experience for acquiring tokens needed for validator staking.

## ✅ **Key Features**

### **Exchange Rate System**
- **Fixed Rate**: 1 ETH = 1000 CTT tokens
- **Reverse Rate**: 1 CTT = 0.001 ETH
- **Minimum Purchase**: 100 CTT tokens
- **Maximum Purchase**: 10,000 CTT tokens per transaction

### **Smart Contract Integration**
- Direct interaction with `buyTokensWithETH()` function
- Automatic token minting upon ETH payment
- Built-in validation for purchase limits
- Transparent, immutable transactions

### **Dual-Layer Implementation**
- **Backend API**: Validation, error handling, and transaction management
- **Smart Contract**: Direct blockchain interaction as fallback
- **Frontend Modal**: User-friendly purchase interface

## 🚀 **API Endpoints**

### **1. Get Exchange Rate**
```bash
GET /api/blockchain/tokens/exchange-rate
```

**Response:**
```json
{
  "success": true,
  "ethToTokenRate": "1000",
  "tokenToEthRate": "0.001",
  "minimumPurchase": "100",
  "maximumPurchase": "10000"
}
```

### **2. Estimate Purchase Cost**
```bash
POST /api/blockchain/tokens/estimate
Content-Type: application/json

{
  "tokenAmount": 1000
}
```

**Response:**
```json
{
  "success": true,
  "tokenAmount": 1000,
  "ethRequired": 1.0,
  "estimatedGasFee": 0.01,
  "totalEthRequired": 1.01,
  "exchangeRate": "1000 CTT per 1 ETH"
}
```

### **3. Purchase Tokens**
```bash
POST /api/blockchain/tokens/buy
Content-Type: application/json

{
  "tokenAmount": 1000,
  "ethAmount": 1.0
}
```

**Success Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "Tokens purchased successfully with ETH!",
  "blockNumber": 12345,
  "tokensReceived": 1000,
  "ethSpent": 1.0
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "tokenAmount": "Minimum token purchase is 100 CTT"
  },
  "timestamp": "2025-09-26T18:03:29Z"
}
```

## 🔧 **Smart Contract Functions**

### **Token Purchase Function**
```solidity
function buyTokensWithETH() external payable nonReentrant whenNotPaused {
    require(msg.value > 0, "Must send ETH to buy tokens");
    
    // Calculate token amount: 1 ETH = 1000 CTT tokens
    uint256 tokenAmount = (msg.value * TOKEN_PRICE * 10**18) / (1 ether);
    
    require(tokenAmount >= MIN_PURCHASE, "Below minimum purchase amount");
    require(tokenAmount <= MAX_PURCHASE, "Exceeds maximum purchase amount");
    
    // Mint tokens to the buyer
    _mint(msg.sender, tokenAmount);
    
    emit TokensPurchased(msg.sender, msg.value, tokenAmount, block.timestamp);
}
```

### **Helper Functions**
```solidity
// Get purchase information
function getTokenPurchaseInfo() external pure returns (
    uint256 _tokenPrice,
    uint256 _minPurchase,
    uint256 _maxPurchase
);

// Calculate tokens for ETH amount
function calculateTokenAmount(uint256 ethAmount) external pure returns (uint256);

// Calculate ETH required for token amount
function calculateETHRequired(uint256 tokenAmount) external pure returns (uint256);
```

## 💻 **Frontend Integration**

### **TokenPurchaseModal Component**
The frontend provides a comprehensive modal for token purchases:

- **Real-time Exchange Rate**: Fetched from backend API
- **Balance Validation**: Checks user's ETH balance
- **Amount Calculation**: Automatic conversion between ETH and CTT
- **Preset Amounts**: Quick selection buttons (1000, 2000, 5000 CTT)
- **Cost Breakdown**: Shows token cost, gas fees, and total required
- **Validation Messages**: Real-time feedback on purchase validity

### **Usage in ValidatorDashboard**
```typescript
// Open token purchase modal
<button onClick={() => setShowTokenPurchaseModal(true)}>
  💳 Buy CTT with ETH
</button>

// Modal component
<TokenPurchaseModal
  isOpen={showTokenPurchaseModal}
  onClose={() => setShowTokenPurchaseModal(false)}
  onPurchaseComplete={() => {
    loadValidatorData(); // Refresh balances
    setShowTokenPurchaseModal(false);
  }}
/>
```

## 🔄 **Purchase Flow**

### **1. User Initiates Purchase**
- User clicks "Buy CTT with ETH" button
- TokenPurchaseModal opens
- Exchange rate is fetched from backend

### **2. User Configures Purchase**
- Enter desired CTT token amount (or use presets)
- ETH amount is automatically calculated
- System validates against minimum/maximum limits
- User balance is checked for sufficiency

### **3. Transaction Processing**
```typescript
// Backend API call (preferred)
const response = await fetch('/api/blockchain/tokens/buy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tokenAmount: 1000,
    ethAmount: 1.0
  })
});

// Fallback to direct contract interaction
if (!response.ok) {
  const success = await web3Service.buyTokensWithETH("1000");
}
```

### **4. Smart Contract Execution**
- ETH is sent to contract
- Contract validates purchase limits
- Tokens are minted to user's wallet
- Event is emitted for transparency
- Transaction receipt is returned

## 🛡️ **Validation & Security**

### **Backend Validation**
- **Amount Limits**: 100 ≤ tokens ≤ 10,000
- **Exchange Rate**: 5% tolerance for rate validation
- **Input Sanitization**: Jakarta Bean Validation annotations
- **Error Handling**: Comprehensive exception management

### **Smart Contract Security**
- **Reentrancy Guard**: Prevents reentrancy attacks
- **Pausable**: Can be paused in emergency
- **Min/Max Limits**: Built-in purchase constraints
- **Event Emission**: Transparent transaction logging

### **Frontend Validation**
- **Real-time Feedback**: Immediate validation messages
- **Balance Checks**: Prevents insufficient balance transactions
- **Rate Validation**: Ensures correct exchange calculations
- **Error Handling**: Graceful fallback mechanisms

## 📊 **Example Usage Scenarios**

### **Scenario 1: New Validator Setup**
```bash
# User wants to become a validator
# Needs 1000 CTT tokens for minimum stake

1. Click "Buy CTT with ETH"
2. Enter 1000 CTT tokens
3. System calculates: 1.0 ETH + 0.01 ETH gas = 1.01 ETH total
4. User confirms purchase
5. MetaMask prompts for transaction approval
6. Tokens are minted to user's wallet
7. User can now stake and become a validator
```

### **Scenario 2: Bulk Token Purchase**
```bash
# User wants to buy tokens for trading/holding

1. Open token purchase modal
2. Select preset amount: 5000 CTT
3. System shows: 5.0 ETH required + gas
4. Validate user has sufficient balance
5. Process purchase through smart contract
6. Tokens available immediately in wallet
```

### **Scenario 3: Error Handling**
```bash
# User tries to buy below minimum

1. User enters 50 CTT tokens
2. System shows error: "Minimum purchase is 100 CTT tokens"
3. Purchase button is disabled
4. User must adjust amount to proceed

# User has insufficient balance
1. User wants 2000 CTT (2.0 ETH) but only has 1.5 ETH
2. System shows: "Insufficient ETH balance. Required: 2.01 ETH"
3. User can either reduce amount or add more ETH to wallet
```

## 🧪 **Testing**

### **Run Backend Tests**
```bash
cd "major back"
./test-token-purchase.sh
```

### **Manual Testing Steps**
1. **Start Backend**: `mvn spring-boot:run`
2. **Start Frontend**: `npm run dev` 
3. **Connect MetaMask**: Use localhost:8545 network
4. **Navigate to Validator Tab**
5. **Click "Buy CTT with ETH"**
6. **Test Various Scenarios**:
   - Valid purchase (1000 CTT)
   - Below minimum (50 CTT)
   - Above maximum (15000 CTT)
   - Insufficient balance
   - Rate validation

### **API Testing**
```bash
# Test exchange rate
curl -X GET http://localhost:8081/api/blockchain/tokens/exchange-rate

# Test estimation  
curl -X POST http://localhost:8081/api/blockchain/tokens/estimate \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 1000}'

# Test purchase
curl -X POST http://localhost:8081/api/blockchain/tokens/buy \
  -H "Content-Type: application/json" \
  -d '{"tokenAmount": 1000, "ethAmount": 1.0}'
```

## 🎯 **Benefits of This Implementation**

### **For Users**
- **Simple Interface**: One-click token purchases
- **Fair Pricing**: Fixed, transparent exchange rate
- **Real-time Validation**: Immediate feedback
- **Multiple Options**: Backend API + direct contract interaction

### **For Validators**
- **Easy Onboarding**: Quick way to get required tokens
- **Reliable Supply**: Always available token source
- **Integrated Experience**: Built into validator dashboard

### **For the System**
- **Liquidity**: Provides token supply for ecosystem
- **Revenue**: ETH collected can fund green projects
- **Adoption**: Removes barriers to participation
- **Transparency**: All purchases recorded on blockchain

## 🔮 **Future Enhancements**

- **Dynamic Pricing**: Market-based token pricing
- **Batch Purchases**: Buy tokens for multiple addresses
- **Payment Options**: Support for other cryptocurrencies
- **Referral System**: Rewards for bringing new users
- **Vesting**: Lock tokens for better rates
- **Integration**: Connect with DEX aggregators

This token purchase system provides a robust, user-friendly way to acquire CTT tokens, essential for participating in the validator network and contributing to the carbon tax ecosystem! 🌱💚