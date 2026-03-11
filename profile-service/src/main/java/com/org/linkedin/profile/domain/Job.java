package com.org.linkedin.profile.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "jobs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Job {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Job title is required")
    @Column(nullable = false)
    private String title;

    @NotBlank(message = "Company name is required")
    @Column(nullable = false)
    private String company;

    @NotBlank(message = "Location is required")
    @Column(nullable = false)
    private String location;

    @NotBlank(message = "Description is required")
    @Column(columnDefinition = "TEXT")
    private String description;

    private String salary;

    @NotBlank(message = "Job type is required")
    private String jobType; // FULL_TIME, PART_TIME, CONTRACT, REMOTE
    
    @NotBlank(message = "Experience level is required")
    private String experienceLevel; // ENTRY_LEVEL, MID_LEVEL, SENIOR

    @Column(name = "posted_by", nullable = false)
    private UUID postedBy; // Internal User ID

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
