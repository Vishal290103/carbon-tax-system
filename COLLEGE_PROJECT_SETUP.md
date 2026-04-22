# Carbon Tax Blockchain System - College Project Setup Guide

## 🎓 Overview
This is a comprehensive blockchain-based Carbon Tax Management System built for educational purposes, demonstrating:
- **Ethereum Proof of Stake (PoS)** consensus mechanism
- **Smart contract development** with Solidity
- **Full-stack blockchain integration** (React + Spring Boot + Ethereum)
- **Transparency and anti-corruption** mechanisms
- **Real-time transaction tracking**

## 📋 Prerequisites

### Required Software
1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Java 17** - [Download](https://adoptium.net/)
3. **PostgreSQL** - [Download](https://postgresql.org/download/)
4. **Git** - [Download](https://git-scm.com/)
5. **MetaMask Browser Extension** - [Install](https://metamask.io/)

### Required Accounts (All Free)
1. **Infura Account** - [Sign up](https://infura.io/)
2. **Etherscan Account** - [Sign up](https://etherscan.io/apis)
3. **Test Wallet** - Create via MetaMask (DEDICATED FOR TESTING ONLY)

## 🚀 Step-by-Step Setup

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd "majorproject 2"

# Install smart contract dependencies
cd contracts
npm install

# Install frontend dependencies  
cd "../major front"
npm install

# Backend dependencies are managed by Maven
```

### Step 2: Blockchain Network Setup

#### Option A: Using Sepolia Testnet (Recommended for College Projects)

1. **Get Infura Project ID:**
   - Go to [Infura.io](https://infura.io/)
   - Create account and new project
   - Copy your Project ID

2. **Create Test Wallet:**
   - Open MetaMask
   - Create a NEW wallet (don't use existing one)
   - Save the private key securely
   - **⚠️ NEVER use this wallet for real funds**

3. **Get Test ETH:**
   - Visit [Sepolia Faucet](https://sepolia-faucet.pk910.de/)
   - Enter your test wallet address
   - Complete the proof-of-work mining
   - Get 0.05 ETH (enough for testing)

4. **Configure Environment:**
   ```bash
   cd contracts
   cp .env.example .env
   # Edit .env with your values:
   ```
   
   ```env
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=your_test_wallet_private_key_here
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

#### Option B: Local Development Network

```bash
# Start local Hardhat network (simulates PoS)
cd contracts
npx hardhat node

# Keep this terminal open - it's your blockchain!
```

### Step 3: Deploy Smart Contracts

#### Deploy to Sepolia Testnet:
```bash
cd contracts
npm run deploy:testnet
```

#### Deploy to Local Network:
```bash
cd contracts
npm run deploy
```

**Expected Output:**
```
✅ CarbonTaxSystem deployed to: 0x1234...abcd
✅ Government wallet address: 0x5678...efgh
✅ Initial products added
✅ Green project created
✅ Contract verified on Etherscan
```

### Step 4: Update Backend Configuration

Edit `major back/src/main/resources/application.properties`:

```properties
# Update these with your deployed contract details
blockchain.rpc.url=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
blockchain.contract.address=YOUR_DEPLOYED_CONTRACT_ADDRESS
blockchain.private.key=YOUR_TEST_WALLET_PRIVATE_KEY
blockchain.chain.id=11155111
```

### Step 5: Database Setup

```bash
# Start PostgreSQL service
# macOS with Homebrew:
brew services start postgresql

# Create database
psql -U postgres
CREATE DATABASE carbontax_db;
\q
```

### Step 6: Start All Services

**Terminal 1 - Backend:**
```bash
cd "major back"
./mvnw spring-boot:run
```

**Terminal 2 - Frontend:**
```bash
cd "major front" 
npm run dev
```

**Terminal 3 - Blockchain (if using local):**
```bash
cd contracts
npx hardhat node
```

## 🧪 Testing Your Setup

### 1. Verify Blockchain Connection
```bash
cd contracts
npx hardhat test
```

### 2. Test Contract Functions
```bash
# Check contract on Sepolia
npx hardhat run scripts/verify-deployment.js --network sepolia
```

### 3. Frontend Testing
1. Open http://localhost:5173
2. Connect MetaMask to Sepolia testnet
3. Connect your test wallet
4. Try purchasing a product
5. Check transaction on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## 🔍 Key Features to Demonstrate

### 1. Transparency & Anti-Corruption
- **Real-time transaction tracking**: Every carbon tax payment is recorded on blockchain
- **Public fund allocation**: Green project funding is transparent and verifiable
- **Immutable records**: No one can alter or delete transaction history
- **Validator consensus**: PoS mechanism ensures network security

### 2. Proof of Stake Implementation
- **Validator staking**: Users can stake CTT tokens to become validators
- **Reward distribution**: Validators earn rewards for maintaining the network
- **Slashing prevention**: Honest validators are rewarded, dishonest ones lose stake

### 3. Carbon Tax Automation
- **Automatic calculation**: Tax calculated based on product carbon footprint
- **Smart distribution**: Base price goes to manufacturer, tax to government
- **Green project funding**: Collected taxes automatically fund environmental projects

## 📊 College Project Demo Scenarios

### Scenario 1: Product Purchase with Tax Collection
1. Manufacturer adds eco-friendly laptop (₹50,000 base price, 125g CO2)
2. System automatically calculates 5% carbon tax (₹2,500)
3. Consumer purchases product for total ₹52,500
4. Smart contract splits payment:
   - ₹50,000 → Manufacturer
   - ₹2,500 → Government wallet for green projects

### Scenario 2: Validator Participation
1. User stakes 1000 CTT tokens to become validator
2. Participates in network consensus (PoS)
3. Earns 5% annual rewards for honest validation
4. Can unstake tokens anytime (demonstrates decentralization)

### Scenario 3: Green Project Funding
1. Government creates "Solar Farm Initiative" project
2. Requires ₹10 crore funding for 5000 tons CO2 reduction
3. Tax collected from product sales automatically funds project
4. Citizens can track funding progress in real-time
5. Project completion triggers automatic fund distribution

### Scenario 4: Transparency Portal
1. Any citizen can view all transactions
2. Filter by date, product type, region
3. Download transaction data as CSV
4. Verify government spending on green projects
5. Check validator performance and rewards

## 📈 Performance Metrics to Track

### Blockchain Metrics
- **Transaction throughput**: ~15 TPS (Ethereum PoS)
- **Block time**: ~12 seconds (Ethereum PoS)
- **Gas costs**: Optimized for educational use
- **Finality**: 2 block confirmations

### System Metrics
- **Tax collection transparency**: 100%
- **Transaction immutability**: Guaranteed by blockchain
- **Fund utilization tracking**: Real-time
- **Carbon footprint reduction**: Measurable impact

## 🛡️ Security Features

### Smart Contract Security
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Pausable**: Emergency stop mechanism
- **Access Control**: Role-based permissions
- **Input validation**: Comprehensive parameter checking

### Application Security
- **Wallet integration**: Secure MetaMask connection
- **Private key management**: Environment variable protection
- **CORS configuration**: Frontend-backend security
- **SQL injection prevention**: JPA/Hibernate protection

## 🎯 Learning Outcomes

Students will learn:
1. **Blockchain fundamentals**: PoS consensus, smart contracts, gas optimization
2. **Full-stack development**: React, Spring Boot, PostgreSQL integration
3. **Web3 integration**: MetaMask, ethers.js, blockchain connectivity
4. **Security practices**: Private key management, smart contract security
5. **Real-world applications**: Environmental impact, transparency, governance

## 📝 Project Documentation

### For College Submission
1. **Technical Report**: Architecture, implementation details, security analysis
2. **User Manual**: Step-by-step usage guide with screenshots
3. **Demo Video**: 10-15 minute presentation of all features
4. **Code Comments**: Detailed inline documentation
5. **Test Results**: Unit tests, integration tests, performance benchmarks

### Research Papers References
- Ethereum Proof of Stake: [Gasper Paper](https://arxiv.org/abs/2003.03052)
- Carbon Tax Economics: IPCC Climate Change Reports
- Blockchain for Governance: World Bank DLT Reports

## 🆘 Troubleshooting

### Common Issues

**"Contract not deployed" Error:**
- Verify contract address in backend config
- Check if deployment transaction succeeded
- Ensure correct network (Sepolia vs localhost)

**"Insufficient funds" Error:**
- Get more test ETH from faucet
- Check wallet balance in MetaMask
- Verify gas price settings

**"RPC Error" Issues:**
- Check Infura project limits
- Verify RPC URL format
- Try switching to backup RPC

**Database Connection Issues:**
- Verify PostgreSQL is running
- Check database credentials
- Create database if not exists

### Getting Help
1. Check contract on [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Review Hardhat console for deployment logs
3. Use browser developer tools for frontend debugging
4. Check Spring Boot logs for backend issues

## 🏆 Advanced Extensions

### For Outstanding Projects
1. **Multi-token support**: Add different carbon credit types
2. **Oracle integration**: Real-time carbon price feeds
3. **Layer 2 scaling**: Deploy on Polygon for lower fees
4. **Mobile app**: React Native frontend
5. **AI integration**: Machine learning for carbon footprint prediction
6. **Cross-chain bridges**: Multi-blockchain support

## 📄 License & Academic Use

This project is designed for educational purposes. Students are encouraged to:
- Modify and enhance the codebase
- Use as reference for blockchain learning
- Cite in academic papers and presentations
- Share improvements with the community

**Citation Format:**
```
Carbon Tax Blockchain System - Educational Implementation
Ethereum Proof of Stake Demonstration
[Your Name], [College Name], [Year]
GitHub: [Repository URL]
```

---

**Remember**: This is a learning project using testnet tokens. Never use real money or main network for educational projects!