// src/main/java/com/carbontax/api/transaction/TransactionRepository.java
package com.carbontax.api.transaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
}