package com.carbontax.api.blockchain;

import com.carbontax.api.exception.BlockchainException;
import com.carbontax.api.exception.ValidationException;
import com.carbontax.api.validation.ValidationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.web3j.protocol.core.methods.response.TransactionReceipt;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * REST Controller for blockchain interactions
 */
@RestController
@RequestMapping("/api/blockchain")
@CrossOrigin(origins = "*")
@Validated
public class BlockchainController {

    private static final Logger log = LoggerFactory.getLogger(BlockchainController.class);

    @Autowired
    private Web3Service web3Service;
    
    @Autowired
    private ValidationService validationService;

    // ============ System Status ============

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getBlockchainStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("connected", web3Service.isConnected());
        status.put("contractAddress", web3Service.getContractAddress());
        
        if (web3Service.getCredentials() != null) {
            status.put("walletAddress", web3Service.getCredentials().getAddress());
        }
        
        return ResponseEntity.ok(status);
    }

    @GetMapping("/stats")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getSystemStats() {
        return web3Service.getSystemStats()
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                log.error("Error getting system stats", ex);
                return ResponseEntity.internalServerError().build();
            });
    }

    // ============ Account Management ============

    @GetMapping("/balance/{address}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getBalance(@PathVariable String address) {
        return web3Service.getBalance(address)
            .thenCombine(
                web3Service.getTokenBalance(address),
                (ethBalance, tokenBalance) -> {
                    Map<String, Object> balances = new HashMap<>();
                    balances.put("ethBalance", ethBalance);
                    balances.put("tokenBalance", tokenBalance);
                    return ResponseEntity.ok(balances);
                }
            )
            .exceptionally(ex -> {
                log.error("Error getting balance for address: {}", address, ex);
                return ResponseEntity.internalServerError().build();
            });
    }

    // ============ Product Management ============

    @PostMapping("/products")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> addProduct(
            @Valid @RequestBody ProductRequest request) {
        
        return web3Service.addProduct(request.getName(), request.getBasePrice(), request.getCarbonEmission())
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("blockNumber", receipt.getBlockNumber());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error adding product", ex);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", ex.getMessage());
                return ResponseEntity.badRequest().body(response);
            });
    }

    @GetMapping("/products/{productId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getProduct(@PathVariable String productId) {
        return web3Service.getProduct(new BigInteger(productId))
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                log.error("Error getting product: {}", productId, ex);
                return ResponseEntity.notFound().build();
            });
    }

    @PostMapping("/products/{productId}/purchase")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> purchaseProduct(
            @PathVariable String productId,
            @Valid @RequestBody PurchaseRequest request) {
        
        return web3Service.purchaseProduct(new BigInteger(productId), request.getTotalAmount())
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("blockNumber", receipt.getBlockNumber());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error purchasing product: {}", productId, ex);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", ex.getMessage());
                return ResponseEntity.badRequest().body(response);
            });
    }

    // ============ Staking Functions ============

    @PostMapping("/stake")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> stakeTokens(
            @Valid @RequestBody StakeRequest request) {
        
        // Additional validation
        String validationError = validationService.getStakeAmountValidationError(request.getAmount());
        if (validationError != null) {
            throw new ValidationException(validationError);
        }
        
        return web3Service.stakeTokens(request.getAmount())
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("message", "Tokens staked successfully. You are now a validator!");
                response.put("blockNumber", receipt.getBlockNumber());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error staking tokens", ex);
                throw new BlockchainException("Failed to stake tokens: " + ex.getMessage(), ex, HttpStatus.BAD_REQUEST);
            });
    }

    @PostMapping("/unstake")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> unstakeTokens() {
        return web3Service.unstakeTokens()
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("message", "Tokens unstaked successfully. You are no longer a validator.");
                response.put("blockNumber", receipt.getBlockNumber());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error unstaking tokens", ex);
                throw new BlockchainException("Failed to unstake tokens: " + ex.getMessage(), ex, HttpStatus.BAD_REQUEST);
            });
    }

    @PostMapping("/claim-rewards")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> claimRewards() {
        return web3Service.claimRewards()
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("message", "Validator rewards claimed successfully");
                response.put("blockNumber", receipt.getBlockNumber());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error claiming rewards", ex);
                throw new BlockchainException("Failed to claim rewards: " + ex.getMessage(), ex, HttpStatus.BAD_REQUEST);
            });
    }

    @GetMapping("/validators/{address}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getValidatorInfo(
            @PathVariable @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Invalid Ethereum address format") String address) {
        
        // Additional validation
        String validationError = validationService.getAddressValidationError(address);
        if (validationError != null) {
            throw new ValidationException(validationError);
        }
        
        return web3Service.getValidatorInfo(address)
            .thenApply(validatorInfo -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("validator", validatorInfo);
                response.put("address", address);
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error getting validator info: {}", address, ex);
                throw new BlockchainException("Failed to get validator information: " + ex.getMessage(), ex, HttpStatus.NOT_FOUND);
            });
    }

    @GetMapping("/validators")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getAllValidators() {
        return web3Service.getAllValidators()
            .thenApply(validators -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("validators", validators);
                response.put("count", validators.size());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error getting all validators", ex);
                throw new BlockchainException("Failed to get validators list: " + ex.getMessage(), ex);
            });
    }

    @GetMapping("/validators/stats")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getValidatorStats() {
        return web3Service.getValidatorStats()
            .thenApply(stats -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("statistics", stats);
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error getting validator stats", ex);
                throw new BlockchainException("Failed to get validator statistics: " + ex.getMessage(), ex);
            });
    }

    @GetMapping("/validators/{address}/rewards")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getValidatorRewards(
            @PathVariable @Pattern(regexp = "^0x[a-fA-F0-9]{40}$", message = "Invalid Ethereum address format") String address) {
        
        // Validate address
        String validationError = validationService.getAddressValidationError(address);
        if (validationError != null) {
            throw new ValidationException(validationError);
        }
        
        return web3Service.getValidatorRewards(address)
            .thenApply(rewards -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("address", address);
                response.put("pendingRewards", rewards);
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error getting validator rewards for address: {}", address, ex);
                throw new BlockchainException("Failed to get validator rewards: " + ex.getMessage(), ex);
            });
    }

    // ============ Token Purchase ============

    @PostMapping("/tokens/buy")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> buyTokensWithEth(
            @Valid @RequestBody TokenPurchaseRequest request) {
        
        // Validate purchase request
        if (request.getTokenAmount() == null || request.getTokenAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Token amount must be greater than 0");
        }
        
        if (request.getEthAmount() == null || request.getEthAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("ETH amount must be greater than 0");
        }
        
        return web3Service.purchaseTokensWithEth(request.getTokenAmount(), request.getEthAmount())
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("message", "Tokens purchased successfully with ETH!");
                response.put("blockNumber", receipt.getBlockNumber());
                response.put("tokensReceived", request.getTokenAmount());
                response.put("ethSpent", request.getEthAmount());
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error purchasing tokens with ETH", ex);
                throw new BlockchainException("Failed to purchase tokens: " + ex.getMessage(), ex, HttpStatus.BAD_REQUEST);
            });
    }

    @GetMapping("/tokens/exchange-rate")
    public ResponseEntity<Map<String, Object>> getTokenExchangeRate() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("ethToTokenRate", "1000"); // 1 ETH = 1000 CTT tokens
        response.put("tokenToEthRate", "0.001"); // 1 CTT = 0.001 ETH
        response.put("minimumPurchase", "100"); // Minimum 100 CTT tokens
        response.put("maximumPurchase", "10000"); // Maximum 10000 CTT tokens per transaction
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tokens/estimate")
    public ResponseEntity<Map<String, Object>> estimateTokenPurchase(
            @Valid @RequestBody TokenEstimateRequest request) {
        
        BigDecimal tokenAmount = request.getTokenAmount();
        if (tokenAmount == null || tokenAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("Token amount must be greater than 0");
        }
        
        // Calculate ETH required (1 ETH = 1000 CTT)
        BigDecimal ethRequired = tokenAmount.divide(new BigDecimal("1000"), 6, BigDecimal.ROUND_HALF_UP);
        BigDecimal gasFee = new BigDecimal("0.01"); // Estimated gas fee
        BigDecimal totalEthRequired = ethRequired.add(gasFee);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("tokenAmount", tokenAmount);
        response.put("ethRequired", ethRequired);
        response.put("estimatedGasFee", gasFee);
        response.put("totalEthRequired", totalEthRequired);
        response.put("exchangeRate", "1000 CTT per 1 ETH");
        
        return ResponseEntity.ok(response);
    }

    // ============ Green Projects ============

    @PostMapping("/projects")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> createGreenProject(
            @Valid @RequestBody GreenProjectRequest request) {
        
        return web3Service.createGreenProject(
            request.getName(),
            request.getLocation(),
            request.getProjectType(),
            request.getFundingRequired(),
            request.getCo2ReductionTarget()
        )
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("message", "Green project created successfully");
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error creating green project", ex);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", ex.getMessage());
                return ResponseEntity.badRequest().body(response);
            });
    }

    @GetMapping("/projects/{projectId}")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> getGreenProject(@PathVariable String projectId) {
        return web3Service.getGreenProject(new BigInteger(projectId))
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                log.error("Error getting green project: {}", projectId, ex);
                return ResponseEntity.notFound().build();
            });
    }

    @PostMapping("/projects/{projectId}/fund")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> fundGreenProject(
            @PathVariable String projectId,
            @Valid @RequestBody FundProjectRequest request) {
        
        return web3Service.fundGreenProject(new BigInteger(projectId), request.getAmount())
            .thenApply(receipt -> {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("transactionHash", receipt.getTransactionHash());
                response.put("message", "Project funded successfully");
                return ResponseEntity.ok(response);
            })
            .exceptionally(ex -> {
                log.error("Error funding green project: {}", projectId, ex);
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("error", ex.getMessage());
                return ResponseEntity.badRequest().body(response);
            });
    }

    // ============ Transparency Functions ============

    @GetMapping("/transactions/user/{address}")
    public CompletableFuture<ResponseEntity<List<BigInteger>>> getUserTransactions(@PathVariable String address) {
        return web3Service.getUserTransactions(address)
            .thenApply(ResponseEntity::ok)
            .exceptionally(ex -> {
                log.error("Error getting user transactions: {}", address, ex);
                return ResponseEntity.internalServerError().build();
            });
    }

    // ============ Request/Response DTOs ============

    public static class ProductRequest {
        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Product name must not exceed 255 characters")
        private String name;
        
        @NotNull(message = "Base price is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Base price must be greater than 0")
        private BigDecimal basePrice;
        
        @NotNull(message = "Carbon emission is required")
        @Min(value = 0, message = "Carbon emission must be non-negative")
        private BigInteger carbonEmission;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getBasePrice() { return basePrice; }
        public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
        public BigInteger getCarbonEmission() { return carbonEmission; }
        public void setCarbonEmission(BigInteger carbonEmission) { this.carbonEmission = carbonEmission; }
    }

    public static class PurchaseRequest {
        @NotNull(message = "Total amount is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Total amount must be greater than 0")
        private BigDecimal totalAmount;

        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    }

    public static class StakeRequest {
        @NotNull(message = "Stake amount is required")
        @DecimalMin(value = "1000.0", message = "Minimum stake amount is 1000 tokens")
        private BigDecimal amount;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class GreenProjectRequest {
        @NotBlank(message = "Project name is required")
        @Size(max = 255, message = "Project name must not exceed 255 characters")
        private String name;
        
        @NotBlank(message = "Location is required")
        @Size(max = 255, message = "Location must not exceed 255 characters")
        private String location;
        
        @NotBlank(message = "Project type is required")
        @Size(max = 100, message = "Project type must not exceed 100 characters")
        private String projectType;
        
        @NotNull(message = "Funding required is required")
        @DecimalMin(value = "0.001", message = "Minimum funding required is 0.001 ETH")
        private BigDecimal fundingRequired;
        
        @NotNull(message = "CO2 reduction target is required")
        @Min(value = 1, message = "CO2 reduction target must be at least 1")
        private BigInteger co2ReductionTarget;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getProjectType() { return projectType; }
        public void setProjectType(String projectType) { this.projectType = projectType; }
        public BigDecimal getFundingRequired() { return fundingRequired; }
        public void setFundingRequired(BigDecimal fundingRequired) { this.fundingRequired = fundingRequired; }
        public BigInteger getCo2ReductionTarget() { return co2ReductionTarget; }
        public void setCo2ReductionTarget(BigInteger co2ReductionTarget) { this.co2ReductionTarget = co2ReductionTarget; }
    }

    public static class FundProjectRequest {
        @NotNull(message = "Funding amount is required")
        @DecimalMin(value = "0.001", message = "Minimum funding amount is 0.001 ETH")
        private BigDecimal amount;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }

    public static class TokenPurchaseRequest {
        @NotNull(message = "Token amount is required")
        @DecimalMin(value = "100", message = "Minimum token purchase is 100 CTT")
        @DecimalMax(value = "10000", message = "Maximum token purchase is 10000 CTT per transaction")
        private BigDecimal tokenAmount;
        
        @NotNull(message = "ETH amount is required")
        @DecimalMin(value = "0.001", message = "Minimum ETH amount is 0.001 ETH")
        private BigDecimal ethAmount;

        public BigDecimal getTokenAmount() { return tokenAmount; }
        public void setTokenAmount(BigDecimal tokenAmount) { this.tokenAmount = tokenAmount; }
        public BigDecimal getEthAmount() { return ethAmount; }
        public void setEthAmount(BigDecimal ethAmount) { this.ethAmount = ethAmount; }
    }

    public static class TokenEstimateRequest {
        @NotNull(message = "Token amount is required")
        @DecimalMin(value = "1", message = "Token amount must be at least 1")
        private BigDecimal tokenAmount;

        public BigDecimal getTokenAmount() { return tokenAmount; }
        public void setTokenAmount(BigDecimal tokenAmount) { this.tokenAmount = tokenAmount; }
    }
}
