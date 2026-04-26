const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment of CarbonTaxSystem...");

    // Get deployer account
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    const governmentWallet = signers.length > 1 ? signers[1] : signers[0];
    
    console.log("Deploying contracts with the account:", deployer.address);
    if (signers.length > 1) {
        console.log("Government wallet address:", governmentWallet.address);
    } else {
        console.log("Using the same account for Government wallet:", governmentWallet.address);
    }
    console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

    // Deploy the contract
    const CarbonTaxSystem = await ethers.getContractFactory("CarbonTaxSystem");
    const carbonTaxSystem = await CarbonTaxSystem.deploy(governmentWallet.address);

    await carbonTaxSystem.waitForDeployment();
    const contractAddress = await carbonTaxSystem.getAddress();

    console.log("CarbonTaxSystem deployed to:", contractAddress);
    console.log("Government wallet address:", governmentWallet.address);

    // Transfer some CTT tokens to the government wallet for operational use
    console.log("\nVerifying token balances before transfer...");
    let deployerBalance = await carbonTaxSystem.balanceOf(deployer.address);
    let govBalance = await carbonTaxSystem.balanceOf(governmentWallet.address);
    console.log(`   - Deployer Balance: ${ethers.formatEther(deployerBalance)} CTT`);
    console.log(`   - Government Wallet Balance: ${ethers.formatEther(govBalance)} CTT`);

    console.log("\nExecuting CTT token transfer...");
    const initialTokenAmount = ethers.parseEther("500000"); // 500,000 CTT
    const transferTx = await carbonTaxSystem.connect(deployer).transfer(governmentWallet.address, initialTokenAmount);
    await transferTx.wait();
    console.log(`Transfer transaction successful.`);

    console.log("\nVerifying token balances after transfer...");
    deployerBalance = await carbonTaxSystem.balanceOf(deployer.address);
    govBalance = await carbonTaxSystem.balanceOf(governmentWallet.address);
    console.log(`   - Deployer Balance: ${ethers.formatEther(deployerBalance)} CTT`);
    console.log(`   - Government Wallet Balance: ${ethers.formatEther(govBalance)} CTT`);

    // Save contract addresses and ABI for frontend integration
    const contractInfo = {
        network: network.name,
        contractAddress: contractAddress,
        governmentWallet: governmentWallet.address,
        deployer: deployer.address,
        deploymentTimestamp: new Date().toISOString(),
        abi: JSON.parse(carbonTaxSystem.interface.formatJson())
    };

    // Save to contracts directory
    const contractsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(contractsDir, `${network.name}-deployment.json`),
        JSON.stringify(contractInfo, null, 2)
    );

    // Also save to frontend directory for easy access
    const frontendDir = path.join(__dirname, "../../major front/src/contracts");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(frontendDir, "CarbonTaxSystem.json"),
        JSON.stringify(contractInfo, null, 2)
    );

    // Add some initial products for testing
    console.log("\nAdding initial products...");
    
    const initialProducts = [
        {
            name: "Eco-Friendly Laptop",
            basePrice: ethers.parseEther("0.5"), // 0.5 ETH
            carbonEmission: 125
        },
        {
            name: "Solar Power Bank",
            basePrice: ethers.parseEther("0.03"), // 0.03 ETH
            carbonEmission: 7
        },
        {
            name: "Organic Cotton T-Shirt",
            basePrice: ethers.parseEther("0.008"), // 0.008 ETH
            carbonEmission: 2
        }
    ];

    for (let i = 0; i < initialProducts.length; i++) {
        const product = initialProducts[i];
        const tx = await carbonTaxSystem.addProduct(
            product.name,
            product.basePrice,
            product.carbonEmission
        );
        await tx.wait();
        console.log(`Added product: ${product.name} (Product ID: ${i + 1})`);
    }

    // Create an initial green project
    console.log("\nCreating initial green project...");
    const createProjectTx = await carbonTaxSystem.connect(governmentWallet).createGreenProject(
        "Solar Farm Initiative",
        "Rajasthan, India",
        "Solar Energy",
        ethers.parseEther("10"), // 10 ETH funding required
        5000 // 5000 tons CO2 reduction target
    );
    await createProjectTx.wait();
    console.log("Created initial green project: Solar Farm Initiative");

    console.log("\n=== Deployment Summary ===");
    console.log("Contract Address:", contractAddress);
    console.log("Government Wallet:", governmentWallet.address);
    console.log("Network:", network.name);
    console.log("Deployment files saved to:");
    console.log("- contracts/deployments/");
    console.log("- major front/src/contracts/");
    // Contract verification on testnet
    if (network.name === "sepolia" || network.name === "holesky" || network.name === "goerli") {
        console.log("\n=== Verifying Contract on Etherscan ===");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [governmentWallet.address],
            });
            console.log("✅ Contract verified on Etherscan!");
        } catch (error) {
            console.log("⚠️  Contract verification failed:", error.message);
            console.log("You can verify manually at https://sepolia.etherscan.io/verifyContract");
        }
    }

    console.log("\n=== 🎓 Automating Configuration Setup ===");

    // 1. Update Backend Configuration
    const backendConfigPath = path.join(__dirname, "../../major back/src/main/resources/application.properties");
    try {
        let backendConfig = fs.readFileSync(backendConfigPath, 'utf8');
        const rpcUrl = network.config.url || 'http://localhost:8545';
        const chainId = network.config.chainId || 1337;

        backendConfig = backendConfig.replace(/^blockchain\.contract\.address=.*$/m, `blockchain.contract.address=${contractAddress}`);
        backendConfig = backendConfig.replace(/^blockchain\.rpc\.url=.*$/m, `blockchain.rpc.url=${rpcUrl}`);
        backendConfig = backendConfig.replace(/^blockchain\.chain\.id=.*$/m, `blockchain.chain.id=${chainId}`);

        fs.writeFileSync(backendConfigPath, backendConfig, 'utf8');
        console.log("✅ Backend configuration updated:", backendConfigPath);
    } catch (error) {
        console.log("⚠️  Could not update backend configuration:", error.message);
        console.log("   Please update manually:");
        console.log(`   - blockchain.contract.address=${contractAddress}`);
    }

    // 2. Update Frontend Configuration File Name
    const oldFrontendPath = path.join(frontendDir, "CarbonTaxSystem.json");
    const newFrontendPath = path.join(frontendDir, "contract-config.json");
    fs.renameSync(oldFrontendPath, newFrontendPath);
    console.log(`✅ Frontend configuration saved to: major front/src/contracts/contract-config.json`);
    
    console.log("\n🚀 Next Steps:");
    console.log("1. Start Backend: cd 'major back' && ./mvnw spring-boot:run");
    console.log("2. Start Frontend: cd 'major front' && npm run dev");
    console.log("3. Open browser: http://localhost:5173");
    console.log("4. Connect MetaMask to", network.name === "hardhat" ? "localhost:8545" : `${network.name} testnet`);
    
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log(`\n🔍 View on Block Explorer:`);
        console.log(`   Contract: https://${network.name}.etherscan.io/address/${contractAddress}`);
        console.log(`   Government Wallet: https://${network.name}.etherscan.io/address/${governmentWallet.address}`);
        
        console.log(`\n💰 Get Test ETH:`);
        console.log(`   - Sepolia: https://sepolia-faucet.pk910.de/`);
        console.log(`   - Holesky: https://holesky-faucet.pk910.de/`);
        console.log(`   - Or use: https://faucets.chain.link/`);
    }
    
    console.log(`\n📊 Demo Scenarios for College Project:`);
    console.log(`1. Product Purchase: Add product → Buy with tax → Track transaction`);
    console.log(`2. Validator Staking: Stake CTT tokens → Earn PoS rewards`);
    console.log(`3. Green Projects: Create project → Fund with tax revenue`);
    console.log(`4. Transparency: View all transactions → Download reports`);
    
    console.log(`\n⚠️  Important for College Presentation:`);
    console.log(`- This uses TESTNET tokens (no real value)`);
    console.log(`- Demonstrates Ethereum Proof of Stake consensus`);
    console.log(`- All transactions are transparent and immutable`);
    console.log(`- Smart contracts prevent corruption and ensure fund allocation`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });