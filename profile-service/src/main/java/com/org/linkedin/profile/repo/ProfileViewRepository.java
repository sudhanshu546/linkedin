package com.org.linkedin.profile.repo;

import com.org.linkedin.profile.domain.ProfileView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProfileViewRepository extends JpaRepository<ProfileView, UUID> {
    List<ProfileView> findByProfileOwnerIdOrderByViewedAtDesc(UUID profileOwnerId);
    long countByProfileOwnerId(UUID profileOwnerId);
}
