// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CarbonTaxSystem
 * @dev Main contract for the Carbon Tax blockchain system with Proof of Stake
 * @notice This contract manages carbon tax collection, transparency, and green project funding
 */
contract CarbonTaxSystem is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    uint256 public constant MIN_STAKE = 1000 * 10**18; // Minimum 1000 tokens to become validator
    uint256 public constant VALIDATOR_REWARD_RATE = 5; // 5% annual reward for validators
    uint256 public carbonTaxRate = 5; // 5% carbon tax on products
    uint256 public totalTaxCollected;
    uint256 public totalFundsAllocated;
    
    // Staking mechanism for Proof of Stake
    struct Validator {
        uint256 stakedAmount;
        uint256 rewardDebt;
        uint256 lastRewardBlock;
        bool isActive;
    }
    
    struct Product {
        string name;
        uint256 basePrice;
        uint256 carbonEmission; // in grams of CO2
        uint256 carbonTax;
        address manufacturer;
        bool isActive;
    }
    
    struct Transaction {
        uint256 productId;
        address buyer;
        uint256 amount;
        uint256 carbonTax;
        uint256 timestamp;
        string txHash;
    }
    
    struct GreenProject {
        string name;
        string location;
        string projectType;
        uint256 fundingRequired;
        uint256 fundsReceived;
        uint256 co2ReductionTarget;
        address projectManager;
        bool isActive;
        bool isCompleted;
    }
    
    // Mappings
    mapping(address => Validator) public validators;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => GreenProject) public greenProjects;
    mapping(address => uint256[]) public userTransactions;
    mapping(uint256 => uint256[]) public projectTransactions;
    
    // Counters
    uint256 public productCounter;
    uint256 public transactionCounter;
    uint256 public projectCounter;
    uint256 public validatorCount;
    
    address[] public validatorList;
    address public governmentWallet;
    
    // ============ Events ============
    
    event ValidatorAdded(address indexed validator, uint256 stakedAmount);
    event ValidatorRemoved(address indexed validator);
    event ProductAdded(uint256 indexed productId, string name, uint256 carbonEmission);
    event PurchaseMade(uint256 indexed transactionId, address indexed buyer, uint256 productId, uint256 totalAmount);
    event TaxCollected(uint256 indexed transactionId, uint256 taxAmount);
    event ProjectFunded(uint256 indexed projectId, uint256 amount);
    event ProjectCreated(uint256 indexed projectId, string name, uint256 fundingRequired);
    event RewardsDistributed(address indexed validator, uint256 amount);
    
    // ============ Modifiers ============
    
    modifier onlyValidator() {
        require(validators[msg.sender].isActive, "Not an active validator");
        _;
    }
    
    modifier onlyGovernment() {
        require(msg.sender == governmentWallet, "Only government wallet");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _governmentWallet) ERC20("CarbonTaxToken", "CTT") Ownable(msg.sender) {
        governmentWallet = _governmentWallet;
        _mint(msg.sender, 1000000 * 10**18); // Initial supply of 1M tokens
    }
    
    // ============ Staking Functions (Proof of Stake) ============
    
    /**
     * @dev Stake tokens to become a validator
     * @param amount Amount of tokens to stake
     */
    function stakeTokens(uint256 amount) external nonReentrant whenNotPaused {
        require(amount >= MIN_STAKE, "Insufficient stake amount");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        _transfer(msg.sender, address(this), amount);
        
        if (!validators[msg.sender].isActive) {
            validators[msg.sender] = Validator({
                stakedAmount: amount,
                rewardDebt: 0,
                lastRewardBlock: block.number,
                isActive: true
            });
            validatorList.push(msg.sender);
            validatorCount++;
            emit ValidatorAdded(msg.sender, amount);
        } else {
            validators[msg.sender].stakedAmount += amount;
        }
    }
    
    /**
     * @dev Unstake tokens and stop being a validator
     */
    function unstakeTokens() external nonReentrant {
        Validator storage validator = validators[msg.sender];
        require(validator.isActive, "Not a validator");
        
        // Calculate and distribute rewards before unstaking
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            validator.lastRewardBlock = block.number;
            _mint(msg.sender, reward);
            emit RewardsDistributed(msg.sender, reward);
        }
        
        uint256 amount = validator.stakedAmount;
        validator.isActive = false;
        validator.stakedAmount = 0;
        validatorCount--;
        
        _transfer(address(this), msg.sender, amount);
        
        // Remove from validator list
        for (uint i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == msg.sender) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }
        
        emit ValidatorRemoved(msg.sender);
    }
    
    /**
     * @dev Calculate and claim staking rewards
     */
    function claimRewards() public nonReentrant {
        Validator storage validator = validators[msg.sender];
        require(validator.isActive, "Not a validator");
        
        uint256 reward = calculateReward(msg.sender);
        if (reward > 0) {
            validator.lastRewardBlock = block.number;
            _mint(msg.sender, reward);
            emit RewardsDistributed(msg.sender, reward);
        }
    }
    
    /**
     * @dev Calculate pending rewards for a validator
     */
    function calculateReward(address validatorAddress) public view returns (uint256) {
        Validator memory validator = validators[validatorAddress];
        if (!validator.isActive) return 0;
        
        uint256 blocksPassed = block.number - validator.lastRewardBlock;
        uint256 annualBlocks = 2628000; // Approximate blocks in a year
        uint256 reward = (validator.stakedAmount * VALIDATOR_REWARD_RATE * blocksPassed) / (100 * annualBlocks);
        
        return reward;
    }
    
    // ============ Product Management ============
    
    /**
     * @dev Add a new product to the system
     */
    function addProduct(
        string memory name,
        uint256 basePrice,
        uint256 carbonEmission
    ) external whenNotPaused returns (uint256) {
        productCounter++;
        uint256 carbonTax = (basePrice * carbonTaxRate) / 100;
        
        products[productCounter] = Product({
            name: name,
            basePrice: basePrice,
            carbonEmission: carbonEmission,
            carbonTax: carbonTax,
            manufacturer: msg.sender,
            isActive: true
        });
        
        emit ProductAdded(productCounter, name, carbonEmission);
        return productCounter;
    }
    
    // ============ Purchase and Tax Collection ============
    
    /**
     * @dev Process a product purchase with carbon tax
     */
    function purchaseProduct(uint256 productId) external payable nonReentrant whenNotPaused {
    Product memory product = products[productId];
    require(product.isActive, "Product not active");
    
    uint256 totalAmount = product.basePrice + product.carbonTax;
    require(msg.value >= totalAmount, "Insufficient payment");
    
    transactionCounter++;

    // Record transaction (txHash will be updated client-side or can be empty initially)
    transactions[transactionCounter] = Transaction({
        productId: productId,
        buyer: msg.sender,
        amount: product.basePrice,
        carbonTax: product.carbonTax,
        timestamp: block.timestamp,
        txHash: "" // leave empty for now
    });
    
    userTransactions[msg.sender].push(transactionCounter);
    
    // Transfer payments
    payable(product.manufacturer).transfer(product.basePrice);
    payable(governmentWallet).transfer(product.carbonTax);
    totalTaxCollected += product.carbonTax;
    
    // Refund excess
    if (msg.value > totalAmount) {
        payable(msg.sender).transfer(msg.value - totalAmount);
    }
    
    emit PurchaseMade(transactionCounter, msg.sender, productId, totalAmount);
    emit TaxCollected(transactionCounter, product.carbonTax);
}

    
    // ============ Green Project Funding ============
    
    /**
     * @dev Create a new green project
     */
    function createGreenProject(
        string memory name,
        string memory location,
        string memory projectType,
        uint256 fundingRequired,
        uint256 co2ReductionTarget
    ) external onlyGovernment returns (uint256) {
        projectCounter++;
        
        greenProjects[projectCounter] = GreenProject({
            name: name,
            location: location,
            projectType: projectType,
            fundingRequired: fundingRequired,
            fundsReceived: 0,
            co2ReductionTarget: co2ReductionTarget,
            projectManager: msg.sender,
            isActive: true,
            isCompleted: false
        });
        
        emit ProjectCreated(projectCounter, name, fundingRequired);
        return projectCounter;
    }
    
    /**
     * @dev Fund a green project from government wallet
     */
    function fundGreenProject(uint256 projectId) external payable onlyGovernment nonReentrant {
        GreenProject storage project = greenProjects[projectId];
        require(project.isActive, "Project not active");
        require(!project.isCompleted, "Project already completed");
        
        uint256 remainingFunding = project.fundingRequired - project.fundsReceived;
        uint256 fundingAmount = msg.value > remainingFunding ? remainingFunding : msg.value;
        
        project.fundsReceived += fundingAmount;
        totalFundsAllocated += fundingAmount;
        
        if (project.fundsReceived >= project.fundingRequired) {
            project.isCompleted = true;
        }
        
        // Record this funding transaction
        projectTransactions[projectId].push(transactionCounter);
        
        emit ProjectFunded(projectId, fundingAmount);
        
        // Return excess funding
        if (msg.value > fundingAmount) {
            payable(msg.sender).transfer(msg.value - fundingAmount);
        }
    }
    
    // ============ Transparency Functions ============
    
    /**
     * @dev Get all transactions for a user
     */
    function getUserTransactions(address user) external view returns (uint256[] memory) {
        return userTransactions[user];
    }
    
    /**
     * @dev Get funding history for a project
     */
    function getProjectFundingHistory(uint256 projectId) external view returns (uint256[] memory) {
        return projectTransactions[projectId];
    }
    
    /**
     * @dev Get all active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        return validatorList;
    }
    
    /**
     * @dev Get system statistics
     */
    function getSystemStats() external view returns (
        uint256 _totalTaxCollected,
        uint256 _totalFundsAllocated,
        uint256 _activeProducts,
        uint256 _activeProjects,
        uint256 _totalValidators
    ) {
        return (
            totalTaxCollected,
            totalFundsAllocated,
            productCounter,
            projectCounter,
            validatorCount
        );
    }
    
    // ============ Token Purchase Functions ============
    
    uint256 public constant TOKEN_PRICE = 1000; // 1 ETH = 1000 CTT tokens
    uint256 public constant MIN_PURCHASE = 100 * 10**18; // Minimum 100 tokens
    uint256 public constant MAX_PURCHASE = 10000 * 10**18; // Maximum 10000 tokens per transaction
    
    event TokensPurchased(address indexed buyer, uint256 ethAmount, uint256 tokenAmount, uint256 timestamp);
    
    /**
     * @dev Purchase CTT tokens with ETH
     * Users can buy CTT tokens at a fixed rate of 1 ETH = 1000 CTT
     */
    function buyTokensWithETH() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Must send ETH to buy tokens");
        
        // Calculate token amount: 1 ETH = 1000 CTT tokens
        uint256 tokenAmount = (msg.value * TOKEN_PRICE * 10**18) / (1 ether);
        
        require(tokenAmount >= MIN_PURCHASE, "Below minimum purchase amount");
        require(tokenAmount <= MAX_PURCHASE, "Exceeds maximum purchase amount");
        
        // Mint tokens to the buyer
        _mint(msg.sender, tokenAmount);
        
        // The ETH stays in the contract and can be used for project funding
        
        emit TokensPurchased(msg.sender, msg.value, tokenAmount, block.timestamp);
    }
    
    /**
     * @dev Get current token price and purchase limits
     */
    function getTokenPurchaseInfo() external pure returns (
        uint256 _tokenPrice,
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) {
        return (TOKEN_PRICE, MIN_PURCHASE, MAX_PURCHASE);
    }
    
    /**
     * @dev Calculate token amount for given ETH
     */
    function calculateTokenAmount(uint256 ethAmount) external pure returns (uint256) {
        return (ethAmount * TOKEN_PRICE * 10**18) / (1 ether);
    }
    
    /**
     * @dev Calculate ETH required for given token amount
     */
    function calculateETHRequired(uint256 tokenAmount) external pure returns (uint256) {
        return (tokenAmount * 1 ether) / (TOKEN_PRICE * 10**18);
    }

    // ============ Admin Functions ============
    
    /**
     * Update carbon tax rate
     */
    function updateTaxRate(uint256 newRate) external onlyOwner {
        require(newRate <= 20, "Tax rate too high"); // Max 20%
        carbonTaxRate = newRate;
    }
    
    /**
     * @dev Update government wallet address
     */
    function updateGovernmentWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        governmentWallet = newWallet;
    }
    
    /**
     * @dev Pause contract in emergency
     */
    function pauseContract() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpauseContract() external onlyOwner {
        _unpause();
    }
}