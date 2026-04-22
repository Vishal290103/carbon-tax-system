package com.carbontax.api.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    // This allows us to find a user by their wallet address
    UserEntity findByWalletAddress(String walletAddress);
}
