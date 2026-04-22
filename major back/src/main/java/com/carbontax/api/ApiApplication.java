// src/main/java/com/carbontax/api/ApiApplication.java
package com.carbontax.api;

import com.carbontax.api.product.Product;
import com.carbontax.api.product.ProductRepository;
import com.carbontax.api.project.GreenProject;
import com.carbontax.api.project.GreenProjectRepository;
import com.carbontax.api.transaction.Transaction; // <-- IMPORT
import com.carbontax.api.transaction.TransactionRepository; // <-- IMPORT
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import java.time.LocalDateTime; // <-- IMPORT

@SpringBootApplication
public class ApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ApiApplication.class, args);
	}

}