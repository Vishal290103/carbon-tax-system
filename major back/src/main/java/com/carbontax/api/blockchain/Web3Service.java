package com.carbontax.api.blockchain;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.WalletUtils;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.response.EthGetBalance;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.core.methods.response.Log;
import org.web3j.protocol.http.HttpService;
import org.web3j.tx.RawTransactionManager;
import org.web3j.tx.TransactionManager;
import org.web3j.tx.gas.ContractGasProvider;
import org.web3j.tx.gas.DefaultGasProvider;
import org.web3j.utils.Convert;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.*;
import org.web3j.abi.datatypes.generated.Uint256;
import org.web3j.protocol.core.methods.request.EthFilter;
import org.web3j.protocol.core.methods.response.EthCall;
import org.springframework.scheduling.annotation.Async;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.ApplicationEventPublisher;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.concurrent.CompletableFuture;
import java.util.*;
import java.util.stream.Collectors;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import io.reactivex.Flowable;

/**
 * Service for interacting with the blockchain
 */
@Service
public class Web3Service {
    
    private static final Logger log = LoggerFactory.getLogger(Web3Service.class);

    @Value("${blockchain.rpc.url:http://localhost:8545}")
    private String blockchainRpcUrl;

    @Value("${blockchain.contract.address:}")
    private String contractAddress;

    @Value("${blockchain.private.key:}")
    private String privateKey;

    @Value("${blockchain.chain.id:1337}")
    private long chainId;

    private Web3j web3j;
    private Credentials credentials;
    private TransactionManager transactionManager;
    private ContractGasProvider gasProvider;

    @PostConstruct
    public void init() {
        try {
            // Initialize Web3j connection
            this.web3j = Web3j.build(new HttpService(blockchainRpcUrl));
            log.info("Connected to blockchain at: {}", blockchainRpcUrl);

            // Initialize credentials if private key is provided
            if (!privateKey.isEmpty()) {
                this.credentials = Credentials.create(privateKey);
                this.transactionManager = new RawTransactionManager(web3j, credentials, chainId);
                log.info("Wallet address: {}", credentials.getAddress());
            }

            // Initialize gas provider
            this.gasProvider = new DefaultGasProvider();

            // Test connection
            String version = web3j.web3ClientVersion().send().getWeb3ClientVersion();
            log.info("Web3 client version: {}", version);
        } catch (Exception e) {
            log.error("Failed to initialize Web3 service", e);
        }
    }

    /**
     * Get balance of an address
     */
    public CompletableFuture<BigDecimal> getBalance(String address) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                EthGetBalance balance = web3j.ethGetBalance(
                    address, 
                    DefaultBlockParameterName.LATEST
                ).send();
                
                BigInteger wei = balance.getBalance();
                return Convert.fromWei(wei.toString(), Convert.Unit.ETHER);
            } catch (Exception e) {
                log.error("Error getting balance for address: {}", address, e);
                throw new RuntimeException("Failed to get balance", e);
            }
        });
    }

    /**
     * Send transaction to blockchain
     */
    public CompletableFuture<String> sendTransaction(
            String toAddress,
            BigDecimal amount,
            String data
    ) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                BigInteger value = Convert.toWei(amount, Convert.Unit.ETHER).toBigInteger();
                
                // Send transaction
                org.web3j.protocol.core.methods.response.EthSendTransaction ethSendTransaction = transactionManager.sendTransaction(
                    gasProvider.getGasPrice(null),
                    gasProvider.getGasLimit(null),
                    toAddress,
                    data,
                    value
                );
                
                String transactionHash = ethSendTransaction.getTransactionHash();
                
                // Wait for transaction receipt
                TransactionReceipt receipt = web3j.ethGetTransactionReceipt(transactionHash)
                    .send()
                    .getTransactionReceipt()
                    .orElseThrow(() -> new RuntimeException("Transaction receipt not found"));

                log.info("Transaction sent: {}", receipt.getTransactionHash());
                return receipt.getTransactionHash();
            } catch (Exception e) {
                log.error("Error sending transaction", e);
                throw new RuntimeException("Failed to send transaction", e);
            }
        });
    }

    /**
     * Get transaction receipt
     */
    public CompletableFuture<TransactionReceipt> getTransactionReceipt(String txHash) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return web3j.ethGetTransactionReceipt(txHash)
                    .send()
                    .getTransactionReceipt()
                    .orElseThrow(() -> new RuntimeException("Transaction receipt not found"));
            } catch (Exception e) {
                log.error("Error getting transaction receipt: {}", txHash, e);
                throw new RuntimeException("Failed to get transaction receipt", e);
            }
        });
    }

    /**
     * Get current block number
     */
    public CompletableFuture<BigInteger> getCurrentBlockNumber() {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return web3j.ethBlockNumber().send().getBlockNumber();
            } catch (Exception e) {
                log.error("Error getting current block number", e);
                throw new RuntimeException("Failed to get block number", e);
            }
        });
    }

    /**
     * Create new wallet
     */
    public String createWallet(String password) {
        try {
            String walletFileName = WalletUtils.generateNewWalletFile(password, new java.io.File("./wallets"));
            log.info("New wallet created: {}", walletFileName);
            return walletFileName;
        } catch (Exception e) {
            log.error("Error creating wallet", e);
            throw new RuntimeException("Failed to create wallet", e);
        }
    }

    /**
     * Check if connected to blockchain
     */
    public boolean isConnected() {
        try {
            web3j.web3ClientVersion().send();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Web3j getWeb3j() {
        return web3j;
    }

    public Credentials getCredentials() {
        return credentials;
    }

    public String getContractAddress() {
        return contractAddress;
    }

    public TransactionManager getTransactionManager() {
        return transactionManager;
    }

    public ContractGasProvider getGasProvider() {
        return gasProvider;
    }

    // ============ Smart Contract Interaction Methods ============

    /**
     * Call a read-only smart contract function
     */
    public CompletableFuture<List<Type>> callContractFunction(
            String functionName,
            List<Type> inputParameters,
            List<TypeReference<?>> outputParameters) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Function function = new Function(
                    functionName,
                    inputParameters,
                    outputParameters
                );
                
                String encodedFunction = FunctionEncoder.encode(function);
                EthCall response = web3j.ethCall(
                    org.web3j.protocol.core.methods.request.Transaction.createEthCallTransaction(
                        null, contractAddress, encodedFunction),
                    DefaultBlockParameterName.LATEST
                ).send();
                
                return FunctionReturnDecoder.decode(response.getValue(), function.getOutputParameters());
            } catch (Exception e) {
                log.error("Error calling contract function: {}", functionName, e);
                throw new RuntimeException("Failed to call contract function", e);
            }
        });
    }

    /**
     * Send a transaction to a smart contract function
     */
    public CompletableFuture<TransactionReceipt> executeContractFunction(
            String functionName,
            List<Type> inputParameters,
            BigInteger value) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                Function function = new Function(
                    functionName,
                    inputParameters,
                    Collections.emptyList()
                );
                
                String encodedFunction = FunctionEncoder.encode(function);
                
                org.web3j.protocol.core.methods.response.EthSendTransaction ethSendTransaction = transactionManager.sendTransaction(
                    gasProvider.getGasPrice(contractAddress),
                    gasProvider.getGasLimit(contractAddress),
                    contractAddress,
                    encodedFunction,
                    value != null ? value : BigInteger.ZERO
                );
                
                String transactionHash = ethSendTransaction.getTransactionHash();
                
                // Wait for transaction receipt
                TransactionReceipt receipt = web3j.ethGetTransactionReceipt(transactionHash)
                    .send()
                    .getTransactionReceipt()
                    .orElseThrow(() -> new RuntimeException("Transaction receipt not found"));
                
                log.info("Contract function '{}' executed: {}", functionName, receipt.getTransactionHash());
                return receipt;
            } catch (Exception e) {
                log.error("Error executing contract function: {}", functionName, e);
                throw new RuntimeException("Failed to execute contract function", e);
            }
        });
    }

    // ============ Product Management ============

    /**
     * Add a new product to the blockchain
     */
    public CompletableFuture<TransactionReceipt> addProduct(String name, BigDecimal basePrice, BigInteger carbonEmission) {
        List<Type> inputParameters = Arrays.asList(
            new Utf8String(name),
            new Uint256(Convert.toWei(basePrice, Convert.Unit.ETHER).toBigInteger()),
            new Uint256(carbonEmission)
        );
        
        return executeContractFunction("addProduct", inputParameters, null);
    }

    /**
     * Get product information from blockchain
     */
    public CompletableFuture<Map<String, Object>> getProduct(BigInteger productId) {
        List<Type> inputParameters = Arrays.asList(new Uint256(productId));
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<Utf8String>() {},
            new TypeReference<Uint256>() {},
            new TypeReference<Uint256>() {},
            new TypeReference<Uint256>() {},
            new TypeReference<Address>() {},
            new TypeReference<Bool>() {}
        );
        
        return callContractFunction("products", inputParameters, outputParameters)
            .thenApply(result -> {
                Map<String, Object> product = new HashMap<>();
                product.put("name", ((Utf8String) result.get(0)).getValue());
                product.put("basePrice", Convert.fromWei(((Uint256) result.get(1)).getValue().toString(), Convert.Unit.ETHER));
                product.put("carbonEmission", ((Uint256) result.get(2)).getValue());
                product.put("carbonTax", Convert.fromWei(((Uint256) result.get(3)).getValue().toString(), Convert.Unit.ETHER));
                product.put("manufacturer", ((Address) result.get(4)).getValue());
                product.put("isActive", ((Bool) result.get(5)).getValue());
                return product;
            });
    }

    /**
     * Purchase a product
     */
    public CompletableFuture<TransactionReceipt> purchaseProduct(BigInteger productId, BigDecimal totalAmount) {
        List<Type> inputParameters = Arrays.asList(new Uint256(productId));
        BigInteger valueInWei = Convert.toWei(totalAmount, Convert.Unit.ETHER).toBigInteger();
        
        return executeContractFunction("purchaseProduct", inputParameters, valueInWei);
    }

    // ============ Staking Functions ============

    /**
     * Stake tokens to become a validator
     */
    public CompletableFuture<TransactionReceipt> stakeTokens(BigDecimal amount) {
        List<Type> inputParameters = Arrays.asList(
            new Uint256(Convert.toWei(amount, Convert.Unit.ETHER).toBigInteger())
        );
        
        return executeContractFunction("stakeTokens", inputParameters, null);
    }

    /**
     * Unstake tokens
     */
    public CompletableFuture<TransactionReceipt> unstakeTokens() {
        return executeContractFunction("unstakeTokens", Collections.emptyList(), null);
    }

    /**
     * Claim staking rewards
     */
    public CompletableFuture<TransactionReceipt> claimRewards() {
        return executeContractFunction("claimRewards", Collections.emptyList(), null);
    }

    /**
     * Get validator information
     */
    public CompletableFuture<Map<String, Object>> getValidatorInfo(String address) {
        List<Type> inputParameters = Arrays.asList(new Address(address));
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<Uint256>() {},
            new TypeReference<Uint256>() {},
            new TypeReference<Uint256>() {},
            new TypeReference<Bool>() {}
        );
        
        return callContractFunction("validators", inputParameters, outputParameters)
            .thenApply(result -> {
                Map<String, Object> validator = new HashMap<>();
                validator.put("stakedAmount", Convert.fromWei(((Uint256) result.get(0)).getValue().toString(), Convert.Unit.ETHER));
                validator.put("rewardDebt", Convert.fromWei(((Uint256) result.get(1)).getValue().toString(), Convert.Unit.ETHER));
                validator.put("lastRewardBlock", ((Uint256) result.get(2)).getValue());
                validator.put("isActive", ((Bool) result.get(3)).getValue());
                return validator;
            });
    }

    /**
     * Get all active validators
     */
    public CompletableFuture<List<String>> getAllValidators() {
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<DynamicArray<Address>>() {}
        );
        
        return callContractFunction("getActiveValidators", Collections.emptyList(), outputParameters)
            .thenApply(result -> {
                @SuppressWarnings("unchecked")
                DynamicArray<Address> validators = (DynamicArray<Address>) result.get(0);
                return validators.getValue().stream()
                    .map(Address::getValue)
                    .collect(Collectors.toList());
            });
    }

    /**
     * Get validator statistics
     */
    public CompletableFuture<Map<String, Object>> getValidatorStats() {
        return getSystemStats().thenApply(systemStats -> {
            Map<String, Object> validatorStats = new HashMap<>();
            validatorStats.put("totalValidators", systemStats.get("totalValidators"));
            validatorStats.put("minStakeAmount", "1000"); // From contract MIN_STAKE
            validatorStats.put("rewardRate", "5"); // From contract VALIDATOR_REWARD_RATE
            return validatorStats;
        });
    }

    /**
     * Get pending rewards for a validator
     */
    public CompletableFuture<BigDecimal> getValidatorRewards(String address) {
        List<Type> inputParameters = Arrays.asList(new Address(address));
        List<TypeReference<?>> outputParameters = Arrays.asList(new TypeReference<Uint256>() {});
        
        return callContractFunction("calculateReward", inputParameters, outputParameters)
            .thenApply(result -> {
                BigInteger reward = ((Uint256) result.get(0)).getValue();
                return Convert.fromWei(reward.toString(), Convert.Unit.ETHER);
            });
    }

    // ============ Green Project Functions ============

    /**
     * Create a green project
     */
    public CompletableFuture<TransactionReceipt> createGreenProject(
            String name, String location, String projectType, 
            BigDecimal fundingRequired, BigInteger co2ReductionTarget) {
        
        List<Type> inputParameters = Arrays.asList(
            new Utf8String(name),
            new Utf8String(location),
            new Utf8String(projectType),
            new Uint256(Convert.toWei(fundingRequired, Convert.Unit.ETHER).toBigInteger()),
            new Uint256(co2ReductionTarget)
        );
        
        return executeContractFunction("createGreenProject", inputParameters, null);
    }

    /**
     * Fund a green project
     */
    public CompletableFuture<TransactionReceipt> fundGreenProject(BigInteger projectId, BigDecimal amount) {
        List<Type> inputParameters = Arrays.asList(new Uint256(projectId));
        BigInteger valueInWei = Convert.toWei(amount, Convert.Unit.ETHER).toBigInteger();
        
        return executeContractFunction("fundGreenProject", inputParameters, valueInWei);
    }

    /**
     * Get green project information
     */
    public CompletableFuture<Map<String, Object>> getGreenProject(BigInteger projectId) {
        List<Type> inputParameters = Arrays.asList(new Uint256(projectId));
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<Utf8String>() {},  // name
            new TypeReference<Utf8String>() {},  // location
            new TypeReference<Utf8String>() {},  // projectType
            new TypeReference<Uint256>() {},     // fundingRequired
            new TypeReference<Uint256>() {},     // fundsReceived
            new TypeReference<Uint256>() {},     // co2ReductionTarget
            new TypeReference<Address>() {},     // projectManager
            new TypeReference<Bool>() {},        // isActive
            new TypeReference<Bool>() {}         // isCompleted
        );
        
        return callContractFunction("greenProjects", inputParameters, outputParameters)
            .thenApply(result -> {
                Map<String, Object> project = new HashMap<>();
                project.put("name", ((Utf8String) result.get(0)).getValue());
                project.put("location", ((Utf8String) result.get(1)).getValue());
                project.put("projectType", ((Utf8String) result.get(2)).getValue());
                project.put("fundingRequired", Convert.fromWei(((Uint256) result.get(3)).getValue().toString(), Convert.Unit.ETHER));
                project.put("fundsReceived", Convert.fromWei(((Uint256) result.get(4)).getValue().toString(), Convert.Unit.ETHER));
                project.put("co2ReductionTarget", ((Uint256) result.get(5)).getValue());
                project.put("projectManager", ((Address) result.get(6)).getValue());
                project.put("isActive", ((Bool) result.get(7)).getValue());
                project.put("isCompleted", ((Bool) result.get(8)).getValue());
                return project;
            });
    }

    // ============ Transparency Functions ============

    /**
     * Get system statistics
     */
    public CompletableFuture<Map<String, Object>> getSystemStats() {
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<Uint256>() {},  // totalTaxCollected
            new TypeReference<Uint256>() {},  // totalFundsAllocated
            new TypeReference<Uint256>() {},  // activeProducts
            new TypeReference<Uint256>() {},  // activeProjects
            new TypeReference<Uint256>() {}   // totalValidators
        );
        
        return callContractFunction("getSystemStats", Collections.emptyList(), outputParameters)
            .thenApply(result -> {
                Map<String, Object> stats = new HashMap<>();
                stats.put("totalTaxCollected", Convert.fromWei(((Uint256) result.get(0)).getValue().toString(), Convert.Unit.ETHER));
                stats.put("totalFundsAllocated", Convert.fromWei(((Uint256) result.get(1)).getValue().toString(), Convert.Unit.ETHER));
                stats.put("activeProducts", ((Uint256) result.get(2)).getValue());
                stats.put("activeProjects", ((Uint256) result.get(3)).getValue());
                stats.put("totalValidators", ((Uint256) result.get(4)).getValue());
                return stats;
            });
    }

    /**
     * Get user transactions
     */
    public CompletableFuture<List<BigInteger>> getUserTransactions(String userAddress) {
        List<Type> inputParameters = Arrays.asList(new Address(userAddress));
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<DynamicArray<Uint256>>() {}
        );
        
        return callContractFunction("getUserTransactions", inputParameters, outputParameters)
            .thenApply(result -> {
                @SuppressWarnings("unchecked")
                DynamicArray<Uint256> array = (DynamicArray<Uint256>) result.get(0);
                return array.getValue().stream()
                    .map(Uint256::getValue)
                    .collect(Collectors.toList());
            });
    }

    // ============ Event Monitoring ============

    /**
     * Listen to contract events
     */
    @Async
    public void startEventListening() {
        try {
            EthFilter filter = new EthFilter(
                DefaultBlockParameterName.LATEST,
                DefaultBlockParameterName.LATEST,
                contractAddress
            );
            
            Flowable<Log> logFlowable = web3j.ethLogFlowable(filter);
            
            logFlowable.subscribe(
                this::processContractEvent,
                error -> log.error("Error in event listening", error)
            );
            
            log.info("Started listening to contract events");
        } catch (Exception e) {
            log.error("Failed to start event listening", e);
        }
    }

    /**
     * Process contract events
     */
    private void processContractEvent(Log eventLog) {
        try {
            // Process different event types based on topics
            List<String> topics = eventLog.getTopics();
            if (topics.isEmpty()) return;
            
            String eventSignature = topics.get(0);
            
            // Handle different events
            switch (eventSignature) {
                case "0x1111":  // PurchaseMade event signature (placeholder)
                    processPurchaseEvent(eventLog);
                    break;
                case "0x2222":  // TaxCollected event signature (placeholder)
                    processTaxCollectedEvent(eventLog);
                    break;
                case "0x3333":  // ProjectFunded event signature (placeholder)
                    processProjectFundedEvent(eventLog);
                    break;
                default:
                    log.debug("Unknown event signature: {}", eventSignature);
            }
        } catch (Exception e) {
            log.error("Error processing contract event", e);
        }
    }

    private void processPurchaseEvent(Log eventLog) {
        // Implement purchase event processing
        log.info("Purchase event detected: {}", eventLog.getTransactionHash());
    }

    private void processTaxCollectedEvent(Log eventLog) {
        // Implement tax collection event processing
        log.info("Tax collection event detected: {}", eventLog.getTransactionHash());
    }

    private void processProjectFundedEvent(Log eventLog) {
        // Implement project funding event processing
        log.info("Project funding event detected: {}", eventLog.getTransactionHash());
    }

    // ============ Token Functions ============

    /**
     * Get token balance
     */
    public CompletableFuture<BigDecimal> getTokenBalance(String address) {
        List<Type> inputParameters = Arrays.asList(new Address(address));
        List<TypeReference<?>> outputParameters = Arrays.asList(new TypeReference<Uint256>() {});
        
        return callContractFunction("balanceOf", inputParameters, outputParameters)
            .thenApply(result -> {
                BigInteger balance = ((Uint256) result.get(0)).getValue();
                return Convert.fromWei(balance.toString(), Convert.Unit.ETHER);
            });
    }

    /**
     * Transfer tokens
     */
    public CompletableFuture<TransactionReceipt> transferTokens(String to, BigDecimal amount) {
        List<Type> inputParameters = Arrays.asList(
            new Address(to),
            new Uint256(Convert.toWei(amount, Convert.Unit.ETHER).toBigInteger())
        );
        
        return executeContractFunction("transfer", inputParameters, null);
    }

    /**
     * Purchase tokens with ETH using smart contract function
     * This method calls the buyTokensWithETH() function in the smart contract
     */
    public CompletableFuture<TransactionReceipt> purchaseTokensWithEth(BigDecimal tokenAmount, BigDecimal ethAmount) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Validate minimum purchase (100 CTT)
                if (tokenAmount.compareTo(new BigDecimal("100")) < 0) {
                    throw new RuntimeException("Minimum purchase is 100 CTT tokens");
                }
                
                // Validate maximum purchase (10000 CTT)
                if (tokenAmount.compareTo(new BigDecimal("10000")) > 0) {
                    throw new RuntimeException("Maximum purchase is 10000 CTT tokens per transaction");
                }
                
                // Validate exchange rate (1 ETH = 1000 CTT)
                BigDecimal expectedEthAmount = tokenAmount.divide(new BigDecimal("1000"), 6, BigDecimal.ROUND_HALF_UP);
                BigDecimal tolerance = expectedEthAmount.multiply(new BigDecimal("0.05")); // 5% tolerance
                
                if (ethAmount.compareTo(expectedEthAmount.subtract(tolerance)) < 0 || 
                    ethAmount.compareTo(expectedEthAmount.add(tolerance)) > 0) {
                    throw new RuntimeException("Invalid exchange rate. Expected ~" + expectedEthAmount + " ETH for " + tokenAmount + " CTT");
                }
                
                // Convert ETH amount to Wei for the transaction
                BigInteger ethInWei = Convert.toWei(ethAmount, Convert.Unit.ETHER).toBigInteger();
                
                // Call the smart contract's buyTokensWithETH function
                List<Type> inputParameters = Collections.emptyList(); // No parameters needed
                
                // Execute contract function with ETH payment
                return executeContractFunction("buyTokensWithETH", inputParameters, ethInWei)
                    .thenApply(receipt -> {
                        log.info("Token purchase completed: {} - {} CTT for {} ETH", 
                            receipt.getTransactionHash(), tokenAmount, ethAmount);
                        return receipt;
                    })
                    .exceptionally(ex -> {
                        log.error("Error in token purchase transaction", ex);
                        throw new RuntimeException("Token purchase failed: " + ex.getMessage(), ex);
                    })
                    .join(); // Wait for completion since we're already in async context
                    
            } catch (Exception e) {
                log.error("Error purchasing tokens with ETH", e);
                throw new RuntimeException("Failed to purchase tokens: " + e.getMessage(), e);
            }
        });
    }
    
    /**
     * Get token purchase information from smart contract
     */
    public CompletableFuture<Map<String, Object>> getTokenPurchaseInfo() {
        List<TypeReference<?>> outputParameters = Arrays.asList(
            new TypeReference<Uint256>() {}, // tokenPrice
            new TypeReference<Uint256>() {}, // minPurchase
            new TypeReference<Uint256>() {}  // maxPurchase
        );
        
        return callContractFunction("getTokenPurchaseInfo", Collections.emptyList(), outputParameters)
            .thenApply(result -> {
                Map<String, Object> info = new HashMap<>();
                info.put("tokenPrice", ((Uint256) result.get(0)).getValue().toString()); // 1000 tokens per ETH
                info.put("minPurchase", Convert.fromWei(((Uint256) result.get(1)).getValue().toString(), Convert.Unit.ETHER));
                info.put("maxPurchase", Convert.fromWei(((Uint256) result.get(2)).getValue().toString(), Convert.Unit.ETHER));
                info.put("exchangeRate", "1 ETH = 1000 CTT tokens");
                info.put("pricePerToken", "0.001 ETH per CTT token");
                return info;
            });
    }
    
    /**
     * Calculate token amount for given ETH using smart contract
     */
    public CompletableFuture<BigDecimal> calculateTokenAmount(BigDecimal ethAmount) {
        List<Type> inputParameters = Arrays.asList(
            new Uint256(Convert.toWei(ethAmount, Convert.Unit.ETHER).toBigInteger())
        );
        List<TypeReference<?>> outputParameters = Arrays.asList(new TypeReference<Uint256>() {});
        
        return callContractFunction("calculateTokenAmount", inputParameters, outputParameters)
            .thenApply(result -> {
                BigInteger tokenAmount = ((Uint256) result.get(0)).getValue();
                return Convert.fromWei(tokenAmount.toString(), Convert.Unit.ETHER);
            });
    }

    /**
     * Get token exchange rate information
     */
    public Map<String, Object> getTokenExchangeRate() {
        Map<String, Object> exchangeInfo = new HashMap<>();
        exchangeInfo.put("ethToTokenRate", "1000"); // 1 ETH = 1000 CTT
        exchangeInfo.put("tokenToEthRate", "0.001"); // 1 CTT = 0.001 ETH
        exchangeInfo.put("minimumPurchase", "100");
        exchangeInfo.put("maximumPurchase", "10000");
        exchangeInfo.put("lastUpdated", System.currentTimeMillis());
        return exchangeInfo;
    }

    /**
     * Estimate token purchase cost
     */
    public Map<String, Object> estimateTokenPurchase(BigDecimal tokenAmount) {
        Map<String, Object> estimate = new HashMap<>();
        
        // Calculate ETH required (1 ETH = 1000 CTT)
        BigDecimal ethRequired = tokenAmount.divide(new BigDecimal("1000"), 6, BigDecimal.ROUND_HALF_UP);
        BigDecimal estimatedGas = new BigDecimal("0.01"); // Estimated gas fee
        BigDecimal totalEthRequired = ethRequired.add(estimatedGas);
        
        estimate.put("tokenAmount", tokenAmount);
        estimate.put("ethRequired", ethRequired);
        estimate.put("estimatedGasFee", estimatedGas);
        estimate.put("totalEthRequired", totalEthRequired);
        estimate.put("exchangeRate", "1000 CTT per 1 ETH");
        estimate.put("pricePerToken", "0.001 ETH per CTT");
        
        return estimate;
    }
}
