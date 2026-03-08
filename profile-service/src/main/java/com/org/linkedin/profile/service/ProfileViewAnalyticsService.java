package com.org.linkedin.profile.service;

import com.org.linkedin.domain.ProfileViewAnalytics;
import com.org.linkedin.dto.event.ProfileViewedEvent;
import com.org.linkedin.profile.repo.ProfileViewAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileViewAnalyticsService {

    private final ProfileViewAnalyticsRepository profileViewAnalyticsRepository;

    public void recordProfileView(ProfileViewedEvent event) {
        profileViewAnalyticsRepository.findByProfileOwnerId(event.getProfileOwnerId())
                .ifPresentOrElse(
                        analytics -> {
                            analytics.setTotalViews(analytics.getTotalViews() + 1);
                            analytics.setLastViewedAt(LocalDateTime.now());
                            profileViewAnalyticsRepository.save(analytics);
                            log.info("Updated profile view analytics for {}: totalViews={}", event.getProfileOwnerId(), analytics.getTotalViews());
                        },
                        () -> {
                            ProfileViewAnalytics newAnalytics = ProfileViewAnalytics.builder()
                                    .profileOwnerId(event.getProfileOwnerId())
                                    .totalViews(1L)
                                    .lastViewedAt(LocalDateTime.now())
                                    .build();
                            profileViewAnalyticsRepository.save(newAnalytics);
                            log.info("Created new profile view analytics for {}: totalViews=1", event.getProfileOwnerId());
                        }
                );
    }
}
