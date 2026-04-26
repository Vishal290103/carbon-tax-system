// src/main/java/com/carbontax/api/project/GreenProject.java
package com.carbontax.api.project;

import jakarta.persistence.*;

@Entity
@Table(name = "green_projects")
public class GreenProject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double cost;
    private int progress;
    private String image;
    private String type;
    private String location;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getCost() { return cost; }
    public void setCost(double cost) { this.cost = cost; }
    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }
    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
}