// src/main/java/com/carbontax/api/project/GreenProjectController.java
package com.carbontax.api.project;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*")
public class GreenProjectController {

    @Autowired
    private GreenProjectRepository greenProjectRepository;

    @GetMapping
    public List<GreenProject> getAllProjects() {
        return greenProjectRepository.findAll();
    }

    @PostMapping
    public GreenProject createProject(@RequestBody GreenProject project) {
        return greenProjectRepository.save(project);
    }

    @PutMapping("/{id}")
    public GreenProject updateProject(@PathVariable Long id, @RequestBody GreenProject projectDetails) {
        GreenProject project = greenProjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
        
        project.setName(projectDetails.getName());
        project.setType(projectDetails.getType());
        project.setCost(projectDetails.getCost());
        project.setDescription(projectDetails.getDescription());
        project.setProgress(projectDetails.getProgress());
        project.setImage(projectDetails.getImage());
        project.setLocation(projectDetails.getLocation());
        
        return greenProjectRepository.save(project);
    }
}
