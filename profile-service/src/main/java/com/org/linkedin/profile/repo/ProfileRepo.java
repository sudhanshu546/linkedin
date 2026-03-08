package com.org.linkedin.profile.repo;

import com.org.linkedin.domain.Profile;
import com.org.linkedin.dto.ProfileDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProfileRepo extends JpaRepository<Profile , UUID> {
    Profile findByUserId(UUID userId);
}
