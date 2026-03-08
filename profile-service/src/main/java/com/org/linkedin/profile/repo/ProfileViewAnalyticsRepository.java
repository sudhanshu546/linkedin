package com.org.linkedin.profile.repo;

import com.org.linkedin.domain.ProfileViewAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.Optional;

@Repository
public interface ProfileViewAnalyticsRepository extends JpaRepository<ProfileViewAnalytics, UUID> {
    Optional<ProfileViewAnalytics> findByProfileOwnerId(UUID profileOwnerId);
}
