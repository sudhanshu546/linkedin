package com.org.linkedin.profile.controller;

import com.org.linkedin.dto.ProfileDTO;
import com.org.linkedin.profile.domain.Post;
import com.org.linkedin.profile.domain.ProfileView;
import com.org.linkedin.profile.repo.PostRepository;
import com.org.linkedin.profile.repo.ProfileViewRepository;
import com.org.linkedin.profile.service.ProfileService;
import com.org.linkedin.utility.client.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("${apiPrefix}/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final UserService userService;
    private final ProfileViewRepository profileViewRepository;
    private final PostRepository postRepository;

    /**
     * Get logged-in user's profile
     */
    @GetMapping("/me")
    public ProfileDTO getMyProfile(Authentication authentication) {

        UUID userId = UUID.fromString(authentication.getName());

        return profileService.getByUserId(userService.getUserByKeyCloakId(userId).getBody().getResult().getId());
    }

    @GetMapping("/me/views")
    public List<ProfileView> getMyProfileViews(Authentication authentication) {
        UUID keycloakId = UUID.fromString(authentication.getName());
        UUID internalUserId = userService.getUserByKeyCloakId(keycloakId).getBody().getResult().getId();
        return profileViewRepository.findByProfileOwnerIdOrderByViewedAtDesc(internalUserId);
    }

    @GetMapping("/me/views/count")
    public long getMyProfileViewCount(Authentication authentication) {
        UUID keycloakId = UUID.fromString(authentication.getName());
        UUID internalUserId = userService.getUserByKeyCloakId(keycloakId).getBody().getResult().getId();
        return profileViewRepository.countByProfileOwnerId(internalUserId);
    }

    /**
     * Get posts authored by a specific internal User ID
     */
    @GetMapping("/{userId}/posts")
    public List<Post> getPostsByUser(@PathVariable UUID userId) {
        return postRepository.findByAuthorIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Create or update logged-in user's profile
     */
    @PostMapping
    public ProfileDTO saveOrUpdateProfile(
            Authentication authentication,
            @RequestBody ProfileDTO profileDTO
    ) {

        UUID userId = UUID.fromString(authentication.getName());
        return profileService.saveOrUpdate(userId, profileDTO);
    }

    /**
     * Public profile view (LinkedIn style)
     */
    @GetMapping("/{userId}")
    public ProfileDTO getProfileByUserId(
            @PathVariable UUID userId
    ) {
        return profileService.getByUserId(userId);
    }
}
