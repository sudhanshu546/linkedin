package com.org.linkedin.profile.service;


import com.org.linkedin.dto.ProfileDTO;

import java.util.List;
import java.util.UUID;

public interface ProfileService {
    ProfileDTO getByUserId(UUID userId);

    ProfileDTO saveOrUpdate(UUID userId, ProfileDTO profileDTO);

    List<ProfileDTO> searchProfiles(String city, String state, String company, String headline);
}
