package com.org.linkedin.profile.repo;

import com.org.linkedin.profile.domain.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, UUID> {
    List<JobApplication> findByJobId(UUID jobId);
    List<JobApplication> findByApplicantId(UUID applicantId);
    boolean existsByJobIdAndApplicantId(UUID jobId, UUID applicantId);
}
