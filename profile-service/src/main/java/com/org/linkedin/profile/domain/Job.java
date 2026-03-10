package com.org.linkedin.profile.domain;

import jakarta.persistence.*;
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

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String salary;

    private String jobType; // FULL_TIME, PART_TIME, CONTRACT, REMOTE
    private String experienceLevel; // ENTRY_LEVEL, MID_LEVEL, SENIOR

    @Column(name = "posted_by", nullable = false)
    private UUID postedBy; // Internal User ID

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
