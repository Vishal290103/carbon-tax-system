package com.carbontax.api.exception;

import org.springframework.http.HttpStatus;

/**
 * Custom exception for blockchain-related errors
 */
public class BlockchainException extends RuntimeException {
    
    private HttpStatus httpStatus;
    
    public BlockchainException(String message) {
        super(message);
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    
    public BlockchainException(String message, Throwable cause) {
        super(message, cause);
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    
    public BlockchainException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
    
    public BlockchainException(String message, Throwable cause, HttpStatus httpStatus) {
        super(message, cause);
        this.httpStatus = httpStatus;
    }
    
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}