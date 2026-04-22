package com.carbontax.api.transaction;

import com.carbontax.api.user.UserEntity;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String txId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    private double amount;
    private String product;

    // Auto-fill current time when row is created
    @CreationTimestamp
    @Column(name = "transaction_timestamp", nullable = false, updatable = false)
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime transactionTimestamp = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTxId() { return txId; }
    public void setTxId(String txId) { this.txId = txId; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }

    public String getProduct() { return product; }
    public void setProduct(String product) { this.product = product; }

    public LocalDateTime getTransactionTimestamp() { return transactionTimestamp; }
    public void setTransactionTimestamp(LocalDateTime transactionTimestamp) { this.transactionTimestamp = transactionTimestamp; }
}


