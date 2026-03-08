package com.org.linkedin.profile.consumer;

import com.org.linkedin.dto.event.ProfileViewedEvent;
import com.org.linkedin.profile.service.ProfileViewAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProfileViewAnalyticsConsumer {

    private final ProfileViewAnalyticsService profileViewAnalyticsService;

    @KafkaListener(topics = "${kafka.topics.profile-viewed}", groupId = "${spring.kafka.consumer.group-id}")
    public void consumeProfileViewedEvent(ProfileViewedEvent event) {
        log.info("Received ProfileViewedEvent: {}", event);
        profileViewAnalyticsService.recordProfileView(event);
    }
}
