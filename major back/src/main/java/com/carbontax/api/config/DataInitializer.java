package com.carbontax.api.config;

import com.carbontax.api.product.Product;
import com.carbontax.api.product.ProductRepository;
import com.carbontax.api.project.GreenProject;
import com.carbontax.api.project.GreenProjectRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initData(ProductRepository productRepo, GreenProjectRepository projectRepo) {
        return args -> {
            log.info("Checking if data initialization is required...");
            try {
                if (productRepo.count() == 0) {
                    log.info("Initializing products...");
                    Product p1 = new Product();
                    p1.setName("Smartphone Pro");
                    p1.setPrice(50000.0);
                    p1.setTax(50.0);
                    p1.setCategory("Electronics");
                    p1.setImage("https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=1965&auto=format&fit=crop");
                    productRepo.save(p1);

                    Product p2 = new Product();
                    p2.setName("Laptop Ultra");
                    p2.setPrice(80000.0);
                    p2.setTax(150.0);
                    p2.setCategory("Electronics");
                    p2.setImage("https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop");
                    productRepo.save(p2);

                    Product p3 = new Product();
                    p3.setName("Air Conditioner");
                    p3.setPrice(35000.0);
                    p3.setTax(200.0);
                    p3.setCategory("Home Goods");
                    p3.setImage("https://images.unsplash.com/photo-1627992499295-80271b531b69?q=80&w=1964&auto=format&fit=crop");
                    productRepo.save(p3);
                    log.info("Products initialized.");
                }
            } catch (Exception e) {
                log.error("Failed to initialize products", e);
            }

            try {
                if (projectRepo.count() == 0) {
                    log.info("Initializing green projects...");
                    GreenProject gp1 = new GreenProject();
                    gp1.setName("Reforestation Drive");
                    gp1.setType("Reforestation");
                    gp1.setCost(500000.0);
                    gp1.setDescription("Planting 10,000 native trees.");
                    gp1.setProgress(75);
                    gp1.setLocation("Karnataka, India");
                    gp1.setImage("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2026");
                    projectRepo.save(gp1);

                    GreenProject gp2 = new GreenProject();
                    gp2.setName("Solar Panels for Schools");
                    gp2.setType("Solar Energy");
                    gp2.setCost(800000.0);
                    gp2.setDescription("Providing clean energy to 20 schools.");
                    gp2.setProgress(40);
                    gp2.setLocation("Rajasthan, India");
                    gp2.setImage("https://images.unsplash.com/photo-1509391366360-fe5bb58583bb?auto=format&fit=crop&q=80&w=2070");
                    projectRepo.save(gp2);
                    log.info("Green projects initialized.");
                }
            } catch (Exception e) {
                log.error("Failed to initialize green projects", e);
            }
        };
    }
}
