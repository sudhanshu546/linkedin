package com.org.linkedin.profile.service;

import com.org.linkedin.domain.ActivityFeedItem;
import com.org.linkedin.dto.event.CommentCreatedEvent;
import com.org.linkedin.dto.event.ConnectionAcceptedEvent;
import com.org.linkedin.dto.event.ConnectionRequestedEvent;
import com.org.linkedin.dto.event.PostCreatedEvent;
import com.org.linkedin.dto.event.PostLikedEvent;
import com.org.linkedin.profile.repo.ActivityFeedItemRepository;
import com.org.linkedin.utility.client.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ActivityFeedService {

    private final ActivityFeedItemRepository activityFeedItemRepository;
    private final com.org.linkedin.profile.repo.ConnectionRepository connectionRepository;
    private final UserService userService;

    private void fanOutFeedItem(UUID actorId, String content, String type, String imageUrl, List<String> imageUrls, UUID postId) {
        log.info("Starting fan-out for actor {}. Type: {}, PostId: {}", actorId, type, postId);
        
        // Save for the actor
        saveFeedItem(actorId, actorId, content, type, imageUrl, imageUrls, postId);

        // Save for all connections
        try {
            connectionRepository.findByRequesterIdAndStatus(actorId, com.org.linkedin.domain.enumeration.ConnectionStatus.ACCEPTED)
                    .forEach(conn -> {
                        log.info("Fanning out to connection (receiver): {}", conn.getReceiverId());
                        saveFeedItem(conn.getReceiverId(), actorId, content, type, imageUrl, imageUrls, postId);
                    });

            connectionRepository.findByReceiverIdAndStatus(actorId, com.org.linkedin.domain.enumeration.ConnectionStatus.ACCEPTED)
                    .forEach(conn -> {
                        log.info("Fanning out to connection (requester): {}", conn.getRequesterId());
                        saveFeedItem(conn.getRequesterId(), actorId, content, type, imageUrl, imageUrls, postId);
                    });
        } catch (Exception e) {
            log.error("Error during feed fan-out: {}", e.getMessage());
        }
    }

    private void saveFeedItem(UUID userId, UUID actorId, String content, String type, String imageUrl, List<String> imageUrls, UUID postId) {
        try {
            ActivityFeedItem item = ActivityFeedItem.builder()
                    .userId(userId)
                    .actorId(actorId)
                    .content(content)
                    .type(type)
                    .imageUrl(imageUrl)
                    .imageUrls(imageUrls)
                    .postId(postId)
                    .timestamp(LocalDateTime.now())
                    .build();
            
            item.setCreatedDate(System.currentTimeMillis());
            item.setIsDeleted(false);
            item.setIsEnabled(true);
            
            activityFeedItemRepository.saveAndFlush(item);
            log.info("SUCCESS: Saved feed item for user {} (actor: {})", userId, actorId);
        } catch (Exception e) {
            log.error("FAILURE: Could not save feed item: {}", e.getMessage());
        }
    }

    public void createFeedItem(PostCreatedEvent event) {
        log.info("Processing PostCreatedEvent for post: {}", event.getPostId());
        // For posts, the 'content' string in ActivityFeedItem will just be the post text
        fanOutFeedItem(UUID.fromString(event.getUserId()), event.getContent(), "POST_CREATED", event.getImageUrl(), event.getImageUrls(), UUID.fromString(event.getPostId()));
    }

    public void createFeedItem(PostLikedEvent event) {
        fanOutFeedItem(UUID.fromString(event.getUserId()), "liked a post", "POST_LIKED", null, null, UUID.fromString(event.getPostId()));
    }

    public void createFeedItem(CommentCreatedEvent event) {
        fanOutFeedItem(UUID.fromString(event.getUserId()), event.getContent(), "COMMENT_CREATED", null, null, UUID.fromString(event.getPostId()));
    }

    public void createFeedItem(ConnectionRequestedEvent event) {
        saveFeedItem(event.getReceiverId(), event.getSenderId(), "sent you a connection request", "CONNECTION_REQUESTED", null, null, null);
    }

    public void createFeedItem(ConnectionAcceptedEvent event) {
        saveFeedItem(event.getRequesterId(), event.getReceiverId(), "accepted your connection request", "CONNECTION_ACCEPTED", null, null, null);
        saveFeedItem(event.getReceiverId(), event.getRequesterId(), "is now connected with you", "CONNECTION_ACCEPTED", null, null, null);
    }

    @Transactional(readOnly = true)
    public List<ActivityFeedItem> getFeedForUser(UUID userId, org.springframework.data.domain.Pageable pageable) {
        return activityFeedItemRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }
}
