package com.carbontax.api.blockchain;

import com.carbontax.api.product.Product;
import com.carbontax.api.transaction.Transaction;
import com.carbontax.api.transaction.TransactionRepository;
import com.carbontax.api.user.UserEntity;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for managing blockchain-based transactions
 */
@Service
@RequiredArgsConstructor
public class BlockchainTransactionService {

    private static final Logger log = LoggerFactory.getLogger(BlockchainTransactionService.class);

    private final Web3Service web3Service;
    private final TransactionRepository transactionRepository;

    /**
     * Process a purchase transaction on blockchain
     */
    @Transactional
    public CompletableFuture<Transaction> processPurchaseOnBlockchain(
            Product product,
            UserEntity buyer,
            String buyerWalletAddress,
            String manufacturerWalletAddress,
            String governmentWalletAddress
    ) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Calculate amounts
                BigDecimal basePrice = BigDecimal.valueOf(product.getPrice());
                BigDecimal taxAmount = BigDecimal.valueOf(product.getTax());
                BigDecimal totalAmount = basePrice.add(taxAmount);

                log.info("Processing blockchain purchase - Product: {}, Buyer: {}, Total: {}", 
                    product.getName(), buyer.getEmail(), totalAmount);

                // Create transaction record
                Transaction transaction = new Transaction();
                transaction.setUser(buyer);
                transaction.setProduct(product.getName());
                transaction.setAmount(totalAmount.doubleValue());
                transaction.setTransactionTimestamp(LocalDateTime.now());

                // Send base price to manufacturer
                CompletableFuture<String> manufacturerTxFuture = web3Service.sendTransaction(
                    manufacturerWalletAddress,
                    basePrice,
                    "Product purchase payment"
                );

                // Send tax to government wallet
                CompletableFuture<String> governmentTxFuture = web3Service.sendTransaction(
                    governmentWalletAddress,
                    taxAmount,
                    "Carbon tax payment"
                );

                // Wait for both transactions
                String manufacturerTxHash = manufacturerTxFuture.get();
                String governmentTxHash = governmentTxFuture.get();

                // Combine transaction hashes
                String combinedTxHash = manufacturerTxHash + ":" + governmentTxHash;
                transaction.setTxId(combinedTxHash);

                // Save transaction
                transaction = transactionRepository.save(transaction);

                log.info("Blockchain purchase completed - TX: {}", combinedTxHash);
                
                return transaction;
            } catch (Exception e) {
                log.error("Failed to process blockchain purchase", e);
                throw new RuntimeException("Blockchain transaction failed", e);
            }
        });
    }

    /**
     * Verify a transaction on blockchain
     */
    public CompletableFuture<Map<String, Object>> verifyTransaction(String txHash) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Split combined hash if necessary
                String[] hashes = txHash.split(":");
                Map<String, Object> result = new HashMap<>();

                for (int i = 0; i < hashes.length; i++) {
                    var receipt = web3Service.getTransactionReceipt(hashes[i]).get();
                    
                    Map<String, Object> txInfo = new HashMap<>();
                    txInfo.put("hash", receipt.getTransactionHash());
                    txInfo.put("blockNumber", receipt.getBlockNumber());
                    txInfo.put("from", receipt.getFrom());
                    txInfo.put("to", receipt.getTo());
                    txInfo.put("status", receipt.isStatusOK() ? "SUCCESS" : "FAILED");
                    txInfo.put("gasUsed", receipt.getGasUsed());
                    
                    result.put("transaction_" + i, txInfo);
                }

                result.put("verified", true);
                result.put("verificationTime", LocalDateTime.now().toString());
                
                return result;
            } catch (Exception e) {
                log.error("Failed to verify transaction: {}", txHash, e);
                Map<String, Object> errorResult = new HashMap<>();
                errorResult.put("verified", false);
                errorResult.put("error", e.getMessage());
                return errorResult;
            }
        });
    }

    /**
     * Get wallet balance for a user
     */
    public CompletableFuture<BigDecimal> getWalletBalance(String walletAddress) {
        return web3Service.getBalance(walletAddress);
    }

    /**
     * Fund a green project on blockchain
     */
    public CompletableFuture<String> fundGreenProject(
            String projectWalletAddress,
            BigDecimal amount,
            String projectId,
            String fundingSource
    ) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Funding green project {} with amount: {}", projectId, amount);

                // Send funds to project wallet
                String txHash = web3Service.sendTransaction(
                    projectWalletAddress,
                    amount,
                    "Green project funding - ID: " + projectId + ", Source: " + fundingSource
                ).get();

                log.info("Green project funded successfully - TX: {}", txHash);
                return txHash;
            } catch (Exception e) {
                log.error("Failed to fund green project", e);
                throw new RuntimeException("Project funding failed", e);
            }
        });
    }

    /**
     * Get blockchain statistics
     */
    public CompletableFuture<Map<String, Object>> getBlockchainStats() {
        return CompletableFuture.supplyAsync(() -> {
            Map<String, Object> stats = new HashMap<>();
            try {
                BigInteger blockNumber = web3Service.getCurrentBlockNumber().get();
                boolean connected = web3Service.isConnected();
                
                stats.put("currentBlock", blockNumber.toString());
                stats.put("connected", connected);
                stats.put("network", "Ethereum");
                stats.put("contractAddress", web3Service.getContractAddress());
                
                if (web3Service.getCredentials() != null) {
                    String walletAddress = web3Service.getCredentials().getAddress();
                    BigDecimal balance = web3Service.getBalance(walletAddress).get();
                    stats.put("walletAddress", walletAddress);
                    stats.put("walletBalance", balance.toString());
                }
                
                return stats;
            } catch (Exception e) {
                log.error("Failed to get blockchain stats", e);
                stats.put("error", e.getMessage());
                return stats;
            }
        });
    }

    /**
     * Create wallet for new user
     */
    public String createUserWallet(String userId) {
        try {
            // Use userId as part of password (in production, use secure password management)
            String password = "CTT_" + userId + "_" + System.currentTimeMillis();
            String walletFile = web3Service.createWallet(password);
            
            log.info("Created wallet for user {}: {}", userId, walletFile);
            return walletFile;
        } catch (Exception e) {
            log.error("Failed to create wallet for user: {}", userId, e);
            throw new RuntimeException("Wallet creation failed", e);
        }
    }
}