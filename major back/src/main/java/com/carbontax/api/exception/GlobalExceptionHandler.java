package com.carbontax.api.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Global exception handler for the application
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle validation errors for request bodies
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, Object> response = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        response.put("success", false);
        response.put("error", "Validation failed");
        response.put("details", errors);
        response.put("timestamp", new Date());
        
        log.warn("Validation error: {}", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle constraint violations (for path variables and request parameters)
     */
    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationExceptions(ConstraintViolationException ex) {
        Map<String, Object> response = new HashMap<>();
        
        Set<String> errors = ex.getConstraintViolations()
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toSet());
        
        response.put("success", false);
        response.put("error", "Constraint violation");
        response.put("details", errors);
        response.put("timestamp", new Date());
        
        log.warn("Constraint violation: {}", errors);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle method argument type mismatch (e.g., invalid number format)
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleTypeMismatchExceptions(MethodArgumentTypeMismatchException ex) {
        Map<String, Object> response = new HashMap<>();
        
        String error = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s", 
                ex.getValue(), 
                ex.getName(), 
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");
        
        response.put("success", false);
        response.put("error", "Invalid parameter type");
        response.put("details", error);
        response.put("timestamp", new Date());
        
        log.warn("Type mismatch error: {}", error);
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle blockchain-specific exceptions
     */
    @ExceptionHandler(BlockchainException.class)
    public ResponseEntity<Map<String, Object>> handleBlockchainExceptions(BlockchainException ex) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", false);
        response.put("error", "Blockchain operation failed");
        response.put("details", ex.getMessage());
        response.put("timestamp", new Date());
        
        HttpStatus status = ex.getHttpStatus() != null ? ex.getHttpStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        
        log.error("Blockchain error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(status).body(response);
    }

    /**
     * Handle validation-specific exceptions
     */
    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(ValidationException ex) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", false);
        response.put("error", "Validation error");
        response.put("details", ex.getMessage());
        response.put("timestamp", new Date());
        
        log.warn("Validation error: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle illegal argument exceptions
     */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentExceptions(IllegalArgumentException ex) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", false);
        response.put("error", "Invalid argument");
        response.put("details", ex.getMessage());
        response.put("timestamp", new Date());
        
        log.warn("Invalid argument: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle number format exceptions
     */
    @ExceptionHandler(NumberFormatException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleNumberFormatExceptions(NumberFormatException ex) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", false);
        response.put("error", "Invalid number format");
        response.put("details", "Please provide a valid numeric value");
        response.put("timestamp", new Date());
        
        log.warn("Number format error: {}", ex.getMessage());
        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handle general runtime exceptions
     */
    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleRuntimeExceptions(RuntimeException ex) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", false);
        response.put("error", "Internal server error");
        response.put("details", ex.getMessage());
        response.put("timestamp", new Date());
        
        log.error("Runtime error: {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(response);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleGeneralExceptions(Exception ex) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", false);
        response.put("error", "Unexpected error occurred");
        response.put("details", ex.getMessage());
        response.put("timestamp", new Date());
        
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.internalServerError().body(response);
    }
}