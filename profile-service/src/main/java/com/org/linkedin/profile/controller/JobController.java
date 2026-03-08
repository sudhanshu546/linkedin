package com.org.linkedin.profile.controller;

import com.org.linkedin.profile.domain.Job;
import com.org.linkedin.profile.domain.JobApplication;
import com.org.linkedin.profile.repo.JobApplicationRepository;
import com.org.linkedin.profile.repo.JobRepository;
import com.org.linkedin.utility.client.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("${apiPrefix}/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobRepository jobRepository;
    private final JobApplicationRepository applicationRepository;
    private final UserService userService;

    private UUID getInternalUserId(Authentication auth) {
        UUID keycloakId = UUID.fromString(auth.getName());
        return userService.getUserByKeyCloakId(keycloakId).getBody().getResult().getId();
    }

    @PostMapping
    public Job postJob(Authentication authentication, @RequestBody Job job) {
        job.setPostedBy(getInternalUserId(authentication));
        job.setCreatedAt(LocalDateTime.now());
        return jobRepository.save(job);
    }

    @GetMapping
    public List<Job> getAllJobs() {
        return jobRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/{jobId}/apply")
    public JobApplication applyToJob(Authentication authentication, @PathVariable UUID jobId) {
        UUID userId = getInternalUserId(authentication);
        
        if (applicationRepository.existsByJobIdAndApplicantId(jobId, userId)) {
            throw new RuntimeException("Already applied to this job");
        }

        JobApplication application = JobApplication.builder()
                .jobId(jobId)
                .applicantId(userId)
                .appliedAt(LocalDateTime.now())
                .status("PENDING")
                .build();
        
        return applicationRepository.save(application);
    }

    @GetMapping("/my-applications")
    public List<JobApplication> getMyApplications(Authentication authentication) {
        return applicationRepository.findByApplicantId(getInternalUserId(authentication));
    }

    @GetMapping("/{jobId}/applicants")
    public List<JobApplication> getApplicants(@PathVariable UUID jobId) {
        return applicationRepository.findByJobId(jobId);
    }

    @GetMapping("/search")
    public List<Job> searchJobs(@RequestParam String query) {
        return jobRepository.findByTitleContainingIgnoreCaseOrCompanyContainingIgnoreCase(query, query);
    }

    @GetMapping("/{id}")
    public Job getJobById(@PathVariable UUID id) {
        return jobRepository.findById(id).orElseThrow(() -> new RuntimeException("Job not found"));
    }
}
