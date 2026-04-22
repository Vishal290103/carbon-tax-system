package com.carbontax.api.transaction;

import com.carbontax.api.user.UserEntity;
import com.carbontax.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "http://localhost:3000")
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping
    public Transaction createTransaction(@RequestBody Map<String, Object> payload) {
        String userWalletAddress = (String) payload.get("user");

        UserEntity user = userRepository.findByWalletAddress(userWalletAddress);
        if (user == null) {
            user = new UserEntity();
            user.setWalletAddress(userWalletAddress);
            user.setDisplayName("New User");
            userRepository.save(user);
        }

        Transaction newTransaction = new Transaction();
        newTransaction.setTxId((String) payload.get("txId"));
        newTransaction.setProduct((String) payload.get("product"));

        // Handle both Integer and Double from JSON
        Number amount = (Number) payload.get("amount");
        newTransaction.setAmount(amount.doubleValue());

        // Set current timestamp
        newTransaction.setTransactionTimestamp(LocalDateTime.now());

        // Link user
        newTransaction.setUser(user);

        return transactionRepository.save(newTransaction);
    }
}
