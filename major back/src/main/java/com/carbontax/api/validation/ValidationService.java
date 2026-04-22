package com.carbontax.api.validation;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.web3j.utils.Numeric;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.regex.Pattern;

/**
 * Service for validating blockchain-related inputs
 */
@Service
public class ValidationService {
    
    private static final Logger log = LoggerFactory.getLogger(ValidationService.class);
    
    // Ethereum address pattern (42 characters, starts with 0x)
    private static final Pattern ETH_ADDRESS_PATTERN = Pattern.compile("^0x[a-fA-F0-9]{40}$");
    
    // Transaction hash pattern (66 characters, starts with 0x)
    private static final Pattern TX_HASH_PATTERN = Pattern.compile("^0x[a-fA-F0-9]{64}$");
    
    /**
     * Validate Ethereum address format
     */
    public boolean isValidEthereumAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            return false;
        }
        
        try {
            // Use Web3j's built-in validation
            return ETH_ADDRESS_PATTERN.matcher(address.trim()).matches();
        } catch (Exception e) {
            log.debug("Invalid Ethereum address: {}", address, e);
            return false;
        }
    }
    
    /**
     * Validate transaction hash format
     */
    public boolean isValidTransactionHash(String txHash) {
        if (txHash == null || txHash.trim().isEmpty()) {
            return false;
        }
        
        return TX_HASH_PATTERN.matcher(txHash.trim()).matches();
    }
    
    /**
     * Validate positive amount
     */
    public boolean isValidAmount(BigDecimal amount) {
        return amount != null && amount.compareTo(BigDecimal.ZERO) > 0;
    }
    
    /**
     * Validate positive big integer
     */
    public boolean isValidBigInteger(BigInteger value) {
        return value != null && value.compareTo(BigInteger.ZERO) > 0;
    }
    
    /**
     * Validate minimum stake amount
     */
    public boolean isValidStakeAmount(BigDecimal amount) {
        if (!isValidAmount(amount)) {
            return false;
        }
        
        // Minimum stake amount (should match the contract's MIN_STAKE)
        BigDecimal minStake = new BigDecimal("1000");
        return amount.compareTo(minStake) >= 0;
    }
    
    /**
     * Validate product name
     */
    public boolean isValidProductName(String name) {
        return name != null && !name.trim().isEmpty() && name.trim().length() <= 255;
    }
    
    /**
     * Validate project name
     */
    public boolean isValidProjectName(String name) {
        return name != null && !name.trim().isEmpty() && name.trim().length() <= 255;
    }
    
    /**
     * Validate location string
     */
    public boolean isValidLocation(String location) {
        return location != null && !location.trim().isEmpty() && location.trim().length() <= 255;
    }
    
    /**
     * Validate project type
     */
    public boolean isValidProjectType(String projectType) {
        return projectType != null && !projectType.trim().isEmpty() && projectType.trim().length() <= 100;
    }
    
    /**
     * Validate carbon emission value (should be positive)
     */
    public boolean isValidCarbonEmission(BigInteger carbonEmission) {
        return carbonEmission != null && carbonEmission.compareTo(BigInteger.ZERO) >= 0;
    }
    
    /**
     * Validate CO2 reduction target
     */
    public boolean isValidCo2ReductionTarget(BigInteger target) {
        return target != null && target.compareTo(BigInteger.ZERO) > 0;
    }
    
    /**
     * Validate funding amount
     */
    public boolean isValidFundingAmount(BigDecimal amount) {
        return isValidAmount(amount) && amount.compareTo(new BigDecimal("0.001")) >= 0; // Minimum 0.001 ETH
    }
    
    /**
     * Validate product ID
     */
    public boolean isValidProductId(String productId) {
        if (productId == null || productId.trim().isEmpty()) {
            return false;
        }
        
        try {
            BigInteger id = new BigInteger(productId.trim());
            return id.compareTo(BigInteger.ZERO) > 0;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * Validate project ID
     */
    public boolean isValidProjectId(String projectId) {
        return isValidProductId(projectId); // Same validation logic
    }
    
    /**
     * Get validation error message for address
     */
    public String getAddressValidationError(String address) {
        if (address == null || address.trim().isEmpty()) {
            return "Address cannot be empty";
        }
        
        if (!isValidEthereumAddress(address)) {
            return "Invalid Ethereum address format. Address must be 42 characters long and start with '0x'";
        }
        
        return null;
    }
    
    /**
     * Get validation error message for amount
     */
    public String getAmountValidationError(BigDecimal amount, String fieldName) {
        if (amount == null) {
            return fieldName + " cannot be null";
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return fieldName + " must be greater than 0";
        }
        
        return null;
    }
    
    /**
     * Get validation error message for stake amount
     */
    public String getStakeAmountValidationError(BigDecimal amount) {
        if (amount == null) {
            return "Stake amount cannot be null";
        }
        
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            return "Stake amount must be greater than 0";
        }
        
        BigDecimal minStake = new BigDecimal("1000");
        if (amount.compareTo(minStake) < 0) {
            return "Stake amount must be at least 1000 tokens";
        }
        
        return null;
    }
    
    /**
     * Sanitize string input
     */
    public String sanitizeString(String input) {
        if (input == null) {
            return null;
        }
        return input.trim();
    }
    
    /**
     * Normalize Ethereum address (convert to lowercase)
     */
    public String normalizeEthereumAddress(String address) {
        if (address == null) {
            return null;
        }
        return address.trim().toLowerCase();
    }
}