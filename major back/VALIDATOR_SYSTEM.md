# Carbon Tax System - Validator Functionality

## Overview

The validator system implements a Proof-of-Stake (PoS) consensus mechanism for the Carbon Tax blockchain system. Validators stake tokens to participate in the network and earn rewards for their participation.

## Key Features

### ✅ Staking System
- **Minimum Stake**: 1000 tokens required to become a validator
- **Validator Rewards**: 5% annual reward rate
- **Dynamic Validator List**: Automatically managed active validators

### ✅ Validation & Security
- **Input Validation**: All requests validated using Jakarta Bean Validation
- **Address Validation**: Ethereum address format validation (42 chars, starts with 0x)
- **Amount Validation**: Positive amounts, minimum thresholds
- **Error Handling**: Comprehensive error responses with detailed messages

### ✅ API Endpoints

#### Staking Operations
- `POST /api/blockchain/stake` - Stake tokens to become a validator
- `POST /api/blockchain/unstake` - Unstake tokens and stop being a validator
- `POST /api/blockchain/claim-rewards` - Claim validator rewards

#### Validator Information
- `GET /api/blockchain/validators` - Get list of all active validators
- `GET /api/blockchain/validators/{address}` - Get specific validator information
- `GET /api/blockchain/validators/stats` - Get validator system statistics
- `GET /api/blockchain/validators/{address}/rewards` - Get pending rewards for a validator

#### System Information
- `GET /api/blockchain/status` - Get blockchain connection status
- `GET /api/blockchain/stats` - Get overall system statistics

## Request/Response Examples

### Stake Tokens
```bash
curl -X POST http://localhost:8081/api/blockchain/stake \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500}'
```

**Success Response:**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "message": "Tokens staked successfully. You are now a validator!",
  "blockNumber": 12345
}
```

**Validation Error Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "amount": "Minimum stake amount is 1000 tokens"
  },
  "timestamp": "2025-09-26T17:46:20Z"
}
```

### Get Validator Info
```bash
curl -X GET http://localhost:8081/api/blockchain/validators/0x1234567890123456789012345678901234567890
```

**Response:**
```json
{
  "success": true,
  "validator": {
    "stakedAmount": "1500",
    "rewardDebt": "0",
    "lastRewardBlock": 12340,
    "isActive": true
  },
  "address": "0x1234567890123456789012345678901234567890"
}
```

## Validation Rules

### Amount Validations
- **Stake Amount**: Must be ≥ 1000 tokens
- **Funding Amount**: Must be ≥ 0.001 ETH
- **All amounts**: Must be positive numbers

### Address Validations
- **Format**: Must be 42 characters long
- **Prefix**: Must start with '0x'
- **Characters**: Must contain only hexadecimal characters (0-9, a-f, A-F)

### String Validations
- **Names**: Required, max 255 characters
- **Project Type**: Required, max 100 characters
- **Location**: Required, max 255 characters

## Error Handling

The system provides comprehensive error handling with detailed error messages:

### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "fieldName": "Specific error message"
  },
  "timestamp": "2025-09-26T17:46:20Z"
}
```

### Blockchain Errors (400/500)
```json
{
  "success": false,
  "error": "Blockchain operation failed",
  "details": "Specific blockchain error message",
  "timestamp": "2025-09-26T17:46:20Z"
}
```

### Address Format Errors (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation error",
  "details": "Invalid Ethereum address format. Address must be 42 characters long and start with '0x'",
  "timestamp": "2025-09-26T17:46:20Z"
}
```

## Testing the Validator System

### 1. Start the Application
```bash
cd "major back"
mvn spring-boot:run
```

### 2. Run the Test Script
```bash
./test-validator-endpoints.sh
```

### 3. Manual Testing Examples

#### Test Valid Staking
```bash
curl -X POST http://localhost:8081/api/blockchain/stake \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500}'
```

#### Test Invalid Staking (Below Minimum)
```bash
curl -X POST http://localhost:8081/api/blockchain/stake \
  -H "Content-Type: application/json" \
  -d '{"amount": 500}'
```

#### Test Invalid Address Format
```bash
curl -X GET http://localhost:8081/api/blockchain/validators/invalid-address
```

## Smart Contract Integration

The validator system integrates with the Solidity smart contract (`CarbonTaxSystem.sol`) which includes:

- **MIN_STAKE**: 1000 tokens minimum
- **VALIDATOR_REWARD_RATE**: 5% annual rewards
- **Validator struct**: Tracks staked amount, rewards, and status
- **Active validator tracking**: Maintains list of current validators

## Architecture Components

### 1. ValidationService
- Handles all validation logic
- Provides reusable validation methods
- Custom error message generation

### 2. GlobalExceptionHandler
- Centralized error handling
- Consistent error response format
- Proper HTTP status codes

### 3. BlockchainController
- RESTful API endpoints
- Request/response DTOs with validation annotations
- Async operations with CompletableFuture

### 4. Web3Service
- Blockchain interaction layer
- Smart contract function calls
- Transaction management

## Dependencies Added

```xml
<!-- Spring Boot Validation Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

<!-- Apache Commons Validator -->
<dependency>
    <groupId>commons-validator</groupId>
    <artifactId>commons-validator</artifactId>
    <version>1.7</version>
</dependency>
```

## Configuration

The validator system is configured through `application.properties`:

```properties
# Proof of Stake Configuration
blockchain.pos.enabled=true
blockchain.pos.min.stake=1000
blockchain.pos.validator.reward.rate=5

# Smart Contract Configuration
blockchain.contract.address=0x5FbDB2315678afecb367f032d93F642f64180aa3
blockchain.rpc.url=http://127.0.0.1:8545/
blockchain.private.key=${BLOCKCHAIN_PRIVATE_KEY:}
blockchain.chain.id=31337
```

## Next Steps

1. **Deploy Smart Contract**: Deploy the CarbonTaxSystem contract to your local blockchain
2. **Set Private Key**: Configure the blockchain private key in environment variables
3. **Start Local Blockchain**: Run Hardhat or Ganache for local testing
4. **Test Integration**: Use the provided test script to verify functionality

## Security Considerations

- Private keys are loaded from environment variables
- Input validation prevents injection attacks
- Comprehensive error handling prevents information leakage
- Address format validation prevents invalid transactions
- Amount validation prevents negative or zero stakes