package com.org.linkedin.profile.repo;

import com.org.linkedin.domain.Profile;
import com.org.linkedin.dto.ProfileDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

@Repository
public interface ProfileRepo extends JpaRepository<Profile , UUID> {
    Profile findByUserId(UUID userId);

    @Query("SELECT p FROM Profile p WHERE " +
           "(:city IS NULL OR LOWER(p.city) LIKE LOWER(CONCAT('%', :city, '%'))) AND " +
           "(:state IS NULL OR LOWER(p.state) LIKE LOWER(CONCAT('%', :state, '%'))) AND " +
           "(:company IS NULL OR LOWER(p.currentCompany) LIKE LOWER(CONCAT('%', :company, '%'))) AND " +
           "(:headline IS NULL OR LOWER(p.headline) LIKE LOWER(CONCAT('%', :headline, '%')))")
    List<Profile> searchProfiles(
            @Param("city") String city,
            @Param("state") String state,
            @Param("company") String company,
            @Param("headline") String headline);
}
