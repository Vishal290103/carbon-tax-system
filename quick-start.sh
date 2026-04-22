#!/bin/bash

# Carbon Tax Blockchain System - College Project Quick Start
# This script helps students set up the project quickly

echo "🎓 Carbon Tax Blockchain System - College Project Setup"
echo "======================================================="
echo ""

# Check if running on macOS or Linux
OS="$(uname -s)"
case "${OS}" in
    Linux*)     MACHINE=Linux;;
    Darwin*)    MACHINE=Mac;;
    *)          MACHINE="UNKNOWN:${OS}"
esac

echo "🔍 Detected OS: $MACHINE"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking Prerequisites..."
echo ""

# Node.js check
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found. Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Java check
if command_exists java; then
    JAVA_VERSION=$(java --version | head -n 1)
    echo "✅ Java: $JAVA_VERSION"
else
    echo "❌ Java not found. Please install Java 17+ from https://adoptium.net/"
    exit 1
fi

# PostgreSQL check
if command_exists psql; then
    echo "✅ PostgreSQL: Available"
else
    echo "⚠️  PostgreSQL not found in PATH"
    if [ "$MACHINE" = "Mac" ]; then
        echo "   Install with: brew install postgresql"
    elif [ "$MACHINE" = "Linux" ]; then
        echo "   Install with: sudo apt-get install postgresql"
    fi
fi

echo ""
echo "🚀 Starting Setup Process..."
echo ""

# Step 1: Install dependencies
echo "1️⃣  Installing Dependencies..."
echo ""

echo "   Installing Smart Contract Dependencies..."
cd contracts
if [ -f "package.json" ]; then
    npm install --silent
    echo "   ✅ Smart contract dependencies installed"
else
    echo "   ❌ contracts/package.json not found"
    exit 1
fi

echo ""
echo "   Installing Frontend Dependencies..."
cd "../major front"
if [ -f "package.json" ]; then
    npm install --silent
    echo "   ✅ Frontend dependencies installed"
else
    echo "   ❌ major front/package.json not found"
    exit 1
fi

cd ..

echo ""
echo "2️⃣  Setting Up Environment Files..."
echo ""

# Copy environment files
if [ ! -f "contracts/.env" ]; then
    cp contracts/.env.example contracts/.env
    echo "   ✅ Created contracts/.env from template"
    echo "   ⚠️  Please edit contracts/.env with your Infura project ID and test wallet"
else
    echo "   ✅ contracts/.env already exists"
fi

echo ""
echo "3️⃣  Database Setup..."
echo ""

# Database setup
if command_exists createdb; then
    if createdb carbontax_db 2>/dev/null; then
        echo "   ✅ Database 'carbontax_db' created"
    else
        echo "   ℹ️  Database 'carbontax_db' may already exist"
    fi
else
    echo "   ⚠️  Please create database manually:"
    echo "      psql -U postgres"
    echo "      CREATE DATABASE carbontax_db;"
    echo "      \\q"
fi

echo ""
echo "4️⃣  Testing Local Blockchain Setup..."
echo ""

# Test blockchain setup
cd contracts
echo "   Compiling smart contracts..."
if npx hardhat compile --quiet; then
    echo "   ✅ Smart contracts compiled successfully"
else
    echo "   ❌ Smart contract compilation failed"
    exit 1
fi

echo "   Running smart contract tests..."
if npx hardhat test --silent; then
    echo "   ✅ All tests passed"
else
    echo "   ❌ Some tests failed - check your setup"
fi

cd ..

echo ""
echo "✅ SETUP COMPLETE!"
echo "=================="
echo ""
echo "🎯 NEXT STEPS FOR COLLEGE PROJECT:"
echo ""
echo "📝 1. Get Free Testnet Setup (5 minutes):"
echo "      • Go to https://infura.io/ → Create account → Get Project ID"
echo "      • Go to https://sepolia-faucet.pk910.de/ → Get test ETH"
echo "      • Update contracts/.env with your details"
echo ""
echo "🚀 2. Deploy to Sepolia Testnet:"
echo "      cd contracts"
echo "      npm run deploy:testnet"
echo ""
echo "🚀 3. OR Start Local Development:"
echo "      Terminal 1: cd contracts && npx hardhat node"
echo "      Terminal 2: cd contracts && npm run deploy"
echo "      Terminal 3: cd 'major back' && ./mvnw spring-boot:run"
echo "      Terminal 4: cd 'major front' && npm run dev"
echo ""
echo "🌐 4. Open Your App:"
echo "      Frontend: http://localhost:5173"
echo "      Backend API: http://localhost:8080"
echo ""
echo "📊 5. Demo Features for College Presentation:"
echo "      • Product purchase with automatic carbon tax"
echo "      • Validator staking (Proof of Stake)"
echo "      • Green project funding transparency"
echo "      • Real-time blockchain transaction tracking"
echo ""
echo "🎓 EDUCATIONAL HIGHLIGHTS:"
echo "   ✨ Ethereum Proof of Stake consensus"
echo "   ✨ Smart contract automation"
echo "   ✨ Anti-corruption transparency"
echo "   ✨ Full-stack blockchain integration"
echo ""
echo "📚 Need Help? Check COLLEGE_PROJECT_SETUP.md for detailed instructions!"
echo ""
echo "⚠️  IMPORTANT: This is for educational use with TESTNET only!"
echo "    Never use real money or mainnet for college projects."
echo ""

# Check if MetaMask reminder should be shown
if [ "$MACHINE" = "Mac" ]; then
    echo "🦊 Don't forget to install MetaMask browser extension!"
    echo "    https://metamask.io/download/"
fi

echo ""
echo "Happy learning! 🚀🎓"