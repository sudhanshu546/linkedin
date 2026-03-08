package com.org.linkedin.profile.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "job_applications", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"job_id", "applicant_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "job_id", nullable = false)
    private UUID jobId;

    @Column(name = "applicant_id", nullable = false)
    private UUID applicantId; // Internal User ID

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    private String status; // PENDING, REVIEWED, REJECTED, HIRED
}
