package com.org.linkedin.profile.repo;

import com.org.linkedin.profile.domain.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

@Repository
public interface JobRepository extends JpaRepository<Job, UUID> {
    List<Job> findAllByOrderByCreatedAtDesc();
    
    @Query("SELECT j FROM Job j WHERE " +
           "(:query IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(j.company) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:jobType IS NULL OR j.jobType = :jobType) AND " +
           "(:expLevel IS NULL OR j.experienceLevel = :expLevel)")
    List<Job> searchJobs(
            @Param("query") String query,
            @Param("location") String location,
            @Param("jobType") String jobType,
            @Param("expLevel") String expLevel);

    List<Job> findByPostedByOrderByCreatedAtDesc(UUID postedBy);
}
