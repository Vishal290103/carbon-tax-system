const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CarbonTaxSystem", function () {
    let carbonTaxSystem;
    let owner, governmentWallet, user1, user2, manufacturer;
    let contractAddress;

    const MIN_STAKE = ethers.parseEther("1000");
    const PRODUCT_PRICE = ethers.parseEther("1");
    const CARBON_EMISSION = 100;

    beforeEach(async function () {
        // Get signers
        [owner, governmentWallet, user1, user2, manufacturer] = await ethers.getSigners();

        // Deploy contract
        const CarbonTaxSystem = await ethers.getContractFactory("CarbonTaxSystem");
        carbonTaxSystem = await CarbonTaxSystem.deploy(governmentWallet.address);
        await carbonTaxSystem.waitForDeployment();
        contractAddress = await carbonTaxSystem.getAddress();

        // Transfer some tokens to users for testing
        await carbonTaxSystem.transfer(user1.address, MIN_STAKE);
        await carbonTaxSystem.transfer(user2.address, MIN_STAKE);
        await carbonTaxSystem.transfer(manufacturer.address, MIN_STAKE);
    });

    describe("Deployment", function () {
        it("Should set the correct owner and government wallet", async function () {
            expect(await carbonTaxSystem.owner()).to.equal(owner.address);
            expect(await carbonTaxSystem.governmentWallet()).to.equal(governmentWallet.address);
        });

        it("Should mint initial supply to owner", async function () {
            const totalSupply = await carbonTaxSystem.totalSupply();
            const ownerBalance = await carbonTaxSystem.balanceOf(owner.address);
            expect(totalSupply).to.equal(ethers.parseEther("1000000"));
        });
    });

    describe("Proof of Stake", function () {
        it("Should allow staking with minimum amount", async function () {
            await carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE);
            const validator = await carbonTaxSystem.validators(user1.address);
            
            expect(validator.isActive).to.be.true;
            expect(validator.stakedAmount).to.equal(MIN_STAKE);
            expect(await carbonTaxSystem.validatorCount()).to.equal(1);
        });

        it("Should reject staking below minimum", async function () {
            const belowMinimum = ethers.parseEther("500");
            await expect(
                carbonTaxSystem.connect(user1).stakeTokens(belowMinimum)
            ).to.be.revertedWith("Insufficient stake amount");
        });

        it("Should allow unstaking and return tokens", async function () {
            await carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE);
            
            const balanceBefore = await carbonTaxSystem.balanceOf(user1.address);
            await carbonTaxSystem.connect(user1).unstakeTokens();
            const balanceAfter = await carbonTaxSystem.balanceOf(user1.address);
            
            const validator = await carbonTaxSystem.validators(user1.address);
            expect(validator.isActive).to.be.false;
            expect(balanceAfter).to.be.above(balanceBefore);
        });

        it("Should calculate rewards correctly", async function () {
            await carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE);
            
            // Mine some blocks to simulate time passing
            await ethers.provider.send("hardhat_mine", ["0x100"]); // Mine 256 blocks
            
            const reward = await carbonTaxSystem.calculateReward(user1.address);
            expect(reward).to.be.above(0);
        });
    });

    describe("Product Management", function () {
        it("Should add products correctly", async function () {
            await carbonTaxSystem.connect(manufacturer).addProduct(
                "Test Product",
                PRODUCT_PRICE,
                CARBON_EMISSION
            );

            const product = await carbonTaxSystem.products(1);
            expect(product.name).to.equal("Test Product");
            expect(product.basePrice).to.equal(PRODUCT_PRICE);
            expect(product.carbonEmission).to.equal(CARBON_EMISSION);
            expect(product.manufacturer).to.equal(manufacturer.address);
            expect(product.isActive).to.be.true;
        });

        it("Should calculate carbon tax correctly", async function () {
            await carbonTaxSystem.connect(manufacturer).addProduct(
                "Test Product",
                PRODUCT_PRICE,
                CARBON_EMISSION
            );

            const product = await carbonTaxSystem.products(1);
            const expectedTax = (PRODUCT_PRICE * 5n) / 100n; // 5% tax
            expect(product.carbonTax).to.equal(expectedTax);
        });
    });

    describe("Purchase and Tax Collection", function () {
        beforeEach(async function () {
            // Add a product for testing
            await carbonTaxSystem.connect(manufacturer).addProduct(
                "Test Product",
                PRODUCT_PRICE,
                CARBON_EMISSION
            );
        });

        it("Should process purchase with correct tax collection", async function () {
            const product = await carbonTaxSystem.products(1);
            const totalAmount = product.basePrice + product.carbonTax;
            
            const govBalanceBefore = await ethers.provider.getBalance(governmentWallet.address);
            const mfgBalanceBefore = await ethers.provider.getBalance(manufacturer.address);

            await carbonTaxSystem.connect(user1).purchaseProduct(1, {
                value: totalAmount
            });

            const govBalanceAfter = await ethers.provider.getBalance(governmentWallet.address);
            const mfgBalanceAfter = await ethers.provider.getBalance(manufacturer.address);

            // Check that tax went to government and base price to manufacturer
            expect(govBalanceAfter - govBalanceBefore).to.equal(product.carbonTax);
            expect(mfgBalanceAfter - mfgBalanceBefore).to.equal(product.basePrice);

            // Check transaction was recorded
            const transaction = await carbonTaxSystem.transactions(1);
            expect(transaction.buyer).to.equal(user1.address);
            expect(transaction.productId).to.equal(1);
        });

        it("Should reject purchase with insufficient payment", async function () {
            const product = await carbonTaxSystem.products(1);
            const insufficientAmount = product.basePrice; // Missing tax amount

            await expect(
                carbonTaxSystem.connect(user1).purchaseProduct(1, {
                    value: insufficientAmount
                })
            ).to.be.revertedWith("Insufficient payment");
        });

        it("Should return excess payment", async function () {
            const product = await carbonTaxSystem.products(1);
            const totalAmount = product.basePrice + product.carbonTax;
            const excessAmount = ethers.parseEther("0.1");
            const paymentAmount = totalAmount + excessAmount;

            const balanceBefore = await ethers.provider.getBalance(user1.address);
            const tx = await carbonTaxSystem.connect(user1).purchaseProduct(1, {
                value: paymentAmount
            });
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(user1.address);

            // User should get back excess minus gas costs
            const actualSpent = balanceBefore - balanceAfter;
            const expectedSpent = totalAmount + gasUsed;
            expect(actualSpent).to.be.closeTo(expectedSpent, ethers.parseEther("0.001"));
        });
    });

    describe("Green Project Management", function () {
        it("Should allow government to create green projects", async function () {
            const fundingRequired = ethers.parseEther("10");
            
            await carbonTaxSystem.connect(governmentWallet).createGreenProject(
                "Solar Farm",
                "California",
                "Solar Energy",
                fundingRequired,
                5000
            );

            const project = await carbonTaxSystem.greenProjects(1);
            expect(project.name).to.equal("Solar Farm");
            expect(project.location).to.equal("California");
            expect(project.fundingRequired).to.equal(fundingRequired);
            expect(project.isActive).to.be.true;
        });

        it("Should not allow non-government to create projects", async function () {
            await expect(
                carbonTaxSystem.connect(user1).createGreenProject(
                    "Solar Farm",
                    "California",
                    "Solar Energy",
                    ethers.parseEther("10"),
                    5000
                )
            ).to.be.revertedWith("Only government wallet");
        });

        it("Should fund green projects correctly", async function () {
            const fundingRequired = ethers.parseEther("10");
            
            // Create project
            await carbonTaxSystem.connect(governmentWallet).createGreenProject(
                "Solar Farm",
                "California",
                "Solar Energy",
                fundingRequired,
                5000
            );

            // Fund project
            const fundingAmount = ethers.parseEther("5");
            await carbonTaxSystem.connect(governmentWallet).fundGreenProject(1, {
                value: fundingAmount
            });

            const project = await carbonTaxSystem.greenProjects(1);
            expect(project.fundsReceived).to.equal(fundingAmount);
            expect(project.isCompleted).to.be.false;

            // Complete funding
            const remainingFunding = fundingRequired - fundingAmount;
            await carbonTaxSystem.connect(governmentWallet).fundGreenProject(1, {
                value: remainingFunding
            });

            const completedProject = await carbonTaxSystem.greenProjects(1);
            expect(completedProject.fundsReceived).to.equal(fundingRequired);
            expect(completedProject.isCompleted).to.be.true;
        });
    });

    describe("Transparency Functions", function () {
        beforeEach(async function () {
            // Add product and make purchase for testing
            await carbonTaxSystem.connect(manufacturer).addProduct(
                "Test Product",
                PRODUCT_PRICE,
                CARBON_EMISSION
            );

            const product = await carbonTaxSystem.products(1);
            const totalAmount = product.basePrice + product.carbonTax;
            
            await carbonTaxSystem.connect(user1).purchaseProduct(1, {
                value: totalAmount
            });
        });

        it("Should return user transactions", async function () {
            const userTransactions = await carbonTaxSystem.getUserTransactions(user1.address);
            expect(userTransactions.length).to.equal(1);
            expect(userTransactions[0]).to.equal(1);
        });

        it("Should return system statistics", async function () {
            const stats = await carbonTaxSystem.getSystemStats();
            expect(stats._totalTaxCollected).to.be.above(0);
            expect(stats._activeProducts).to.equal(1);
            expect(stats._totalValidators).to.equal(0);
        });

        it("Should return active validators", async function () {
            await carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE);
            await carbonTaxSystem.connect(user2).stakeTokens(MIN_STAKE);

            const validators = await carbonTaxSystem.getActiveValidators();
            expect(validators.length).to.equal(2);
            expect(validators).to.include(user1.address);
            expect(validators).to.include(user2.address);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update tax rate", async function () {
            await carbonTaxSystem.updateTaxRate(10); // 10%
            
            // Add product to test new rate
            await carbonTaxSystem.connect(manufacturer).addProduct(
                "Test Product",
                PRODUCT_PRICE,
                CARBON_EMISSION
            );

            const product = await carbonTaxSystem.products(1);
            const expectedTax = (PRODUCT_PRICE * 10n) / 100n; // 10% tax
            expect(product.carbonTax).to.equal(expectedTax);
        });

        it("Should reject tax rate above maximum", async function () {
            await expect(
                carbonTaxSystem.updateTaxRate(25) // 25% is above 20% max
            ).to.be.revertedWith("Tax rate too high");
        });

        it("Should allow owner to pause and unpause", async function () {
            await carbonTaxSystem.pauseContract();
            
            await expect(
                carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE)
            ).to.be.revertedWithCustomError(carbonTaxSystem, "EnforcedPause");

            await carbonTaxSystem.unpauseContract();
            
            // Should work after unpausing
            await expect(
                carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE)
            ).to.not.be.reverted;
        });
    });

    describe("Events", function () {
        it("Should emit ValidatorAdded event", async function () {
            await expect(carbonTaxSystem.connect(user1).stakeTokens(MIN_STAKE))
                .to.emit(carbonTaxSystem, "ValidatorAdded")
                .withArgs(user1.address, MIN_STAKE);
        });

        it("Should emit ProductAdded event", async function () {
            await expect(
                carbonTaxSystem.connect(manufacturer).addProduct(
                    "Test Product",
                    PRODUCT_PRICE,
                    CARBON_EMISSION
                )
            ).to.emit(carbonTaxSystem, "ProductAdded")
             .withArgs(1, "Test Product", CARBON_EMISSION);
        });

        it("Should emit PurchaseMade and TaxCollected events", async function () {
            await carbonTaxSystem.connect(manufacturer).addProduct(
                "Test Product",
                PRODUCT_PRICE,
                CARBON_EMISSION
            );

            const product = await carbonTaxSystem.products(1);
            const totalAmount = product.basePrice + product.carbonTax;

            const tx = carbonTaxSystem.connect(user1).purchaseProduct(1, {
                value: totalAmount
            });

            await expect(tx)
                .to.emit(carbonTaxSystem, "PurchaseMade")
                .withArgs(1, user1.address, 1, totalAmount);

            await expect(tx)
                .to.emit(carbonTaxSystem, "TaxCollected")
                .withArgs(1, product.carbonTax);
        });
    });
});