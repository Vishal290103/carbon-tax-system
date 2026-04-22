const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    // Contract configuration from the deployed contract
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    // Get contract instance
    const CarbonTaxSystem = await ethers.getContractFactory("CarbonTaxSystem");
    const contract = CarbonTaxSystem.attach(contractAddress);
    
    console.log("=== Contract State Debug ===");
    
    try {
        // Check product counter
        const productCounter = await contract.productCounter();
        console.log("Product Counter:", productCounter.toString());
        
        // Check system stats
        const stats = await contract.getSystemStats();
        console.log("System Stats:");
        console.log("  Total Tax Collected:", ethers.formatEther(stats._totalTaxCollected));
        console.log("  Total Funds Allocated:", ethers.formatEther(stats._totalFundsAllocated));
        console.log("  Active Products:", stats._activeProducts.toString());
        console.log("  Active Projects:", stats._activeProjects.toString());
        console.log("  Total Validators:", stats._totalValidators.toString());
        
        // Check if we have any products
        if (parseInt(productCounter.toString()) > 0) {
            console.log("\n=== Existing Products ===");
            for (let i = 1; i <= parseInt(productCounter.toString()); i++) {
                try {
                    const product = await contract.products(i);
                    console.log(`Product ${i}:`);
                    console.log("  Name:", product.name);
                    console.log("  Base Price:", ethers.formatEther(product.basePrice));
                    console.log("  Carbon Tax:", ethers.formatEther(product.carbonTax));
                    console.log("  CO2 Emission:", product.carbonEmission.toString());
                    console.log("  Is Active:", product.isActive);
                    console.log("  Manufacturer:", product.manufacturer);
                    console.log("---");
                } catch (error) {
                    console.log(`Product ${i}: Error reading -`, error.message);
                }
            }
        } else {
            console.log("\n=== No products found in contract ===");
            console.log("This explains why purchases are failing!");
        }
        
        // Check validator count
        const validatorCount = await contract.validatorCount();
        console.log("\nValidator Count:", validatorCount.toString());
        
        // Check carbon tax rate
        const taxRate = await contract.carbonTaxRate();
        console.log("Carbon Tax Rate:", taxRate.toString() + "%");
        
    } catch (error) {
        console.error("Error reading contract state:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });