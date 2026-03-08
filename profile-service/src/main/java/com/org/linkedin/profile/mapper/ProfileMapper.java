package com.org.linkedin.profile.mapper;

import com.org.linkedin.domain.Profile;
import com.org.linkedin.dto.ProfileDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ProfileMapper extends EntityMapper<ProfileDTO, Profile> {
}
