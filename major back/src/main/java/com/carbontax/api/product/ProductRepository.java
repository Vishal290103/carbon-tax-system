// src/main/java/com/carbontax/api/product/ProductRepository.java
package com.carbontax.api.product;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
}