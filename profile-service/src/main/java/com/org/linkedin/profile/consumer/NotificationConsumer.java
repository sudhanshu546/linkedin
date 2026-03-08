package com.org.linkedin.profile.consumer;

import com.org.linkedin.dto.event.CommentCreatedEvent;
import com.org.linkedin.dto.event.ConnectionAcceptedEvent;
import com.org.linkedin.dto.event.ConnectionRequestedEvent;
import com.org.linkedin.dto.event.PostCreatedEvent;
import com.org.linkedin.dto.event.PostLikedEvent;
import com.org.linkedin.profile.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "${kafka.topics.post-created}", groupId = "profile-service-notification-group")
    public void consumePostCreatedEvent(PostCreatedEvent event) {
        log.info("Received PostCreatedEvent for notification: {}", event);
        notificationService.createNotification(event);
    }

    @KafkaListener(topics = "${kafka.topics.post-liked}", groupId = "profile-service-notification-group")
    public void consumePostLikedEvent(PostLikedEvent event) {
        log.info("Received PostLikedEvent for notification: {}", event);
        notificationService.createNotification(event);
    }

    @KafkaListener(topics = "${kafka.topics.comment-created}", groupId = "profile-service-notification-group")
    public void consumeCommentCreatedEvent(CommentCreatedEvent event) {
        log.info("Received CommentCreatedEvent for notification: {}", event);
        notificationService.createNotification(event);
    }

    @KafkaListener(topics = "${kafka.topics.connection-requested}", groupId = "profile-service-notification-group")
    public void consumeConnectionRequestedEvent(ConnectionRequestedEvent event) {
        log.info("Received ConnectionRequestedEvent for notification: {}", event);
        notificationService.createNotification(event);
    }

    @KafkaListener(topics = "${kafka.topics.connection-accepted}", groupId = "profile-service-notification-group")
    public void consumeConnectionAcceptedEvent(ConnectionAcceptedEvent event) {
        log.info("Received ConnectionAcceptedEvent for notification: {}", event);
        notificationService.createNotification(event);
    }
}
