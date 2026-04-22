// src/main/java/com/carbontax/api/project/GreenProjectRepository.java
package com.carbontax.api.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GreenProjectRepository extends JpaRepository<GreenProject, Long> {
}