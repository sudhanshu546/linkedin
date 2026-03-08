package com.org.linkedin.profile.service;

import com.org.linkedin.domain.notification.Notification;
import com.org.linkedin.dto.event.CommentCreatedEvent;
import com.org.linkedin.dto.event.ConnectionAcceptedEvent;
import com.org.linkedin.dto.event.ConnectionRequestedEvent;
import com.org.linkedin.dto.event.PostCreatedEvent;
import com.org.linkedin.dto.event.PostLikedEvent;
import com.org.linkedin.profile.domain.Post;
import com.org.linkedin.profile.repo.NotificationRepository;
import com.org.linkedin.profile.repo.PostRepository;
import com.org.linkedin.utility.client.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PostRepository postRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    public void createNotification(PostCreatedEvent event) {
        log.info("Skipping notification for PostCreatedEvent as recipient logic is not defined yet: {}", event);
    }

    private void saveAndSend(Notification notification) {
        // Auditing bypass for background Kafka thread
        notification.setCreatedDate(System.currentTimeMillis());
        notification.setIsDeleted(false);
        notification.setIsEnabled(true);
        notification.setStatus(0); // Unread

        notificationRepository.save(notification);
        
        // Push to WebSocket
        // We use the recipient internal ID as the destination part
        String destination = "/queue/notifications";
        messagingTemplate.convertAndSendToUser(notification.getRecipientId().toString(), destination, notification);
        log.info("Notification sent to user {} via WebSocket", notification.getRecipientId());
    }

    private String getActorName(UUID internalId) {
        try {
            var res = userService.getUserByInternalId(internalId);
            if (res != null && res.getBody() != null && res.getBody().getResult() != null) {
                var user = res.getBody().getResult();
                return user.getFirstName() + " " + user.getLastName();
            }
        } catch (Exception e) {
            log.error("Error resolving name for notification: {}", e.getMessage());
        }
        return "Someone";
    }

    public void createNotification(PostLikedEvent event) {
        Optional<Post> postOpt = postRepository.findById(UUID.fromString(event.getPostId()));
        if (postOpt.isEmpty()) return;
        
        UUID authorId = postOpt.get().getAuthorId();
        String actorName = getActorName(UUID.fromString(event.getUserId()));

        Notification notification = new Notification();
        notification.setRecipientId(authorId);
        notification.setNotification(actorName + " liked your post.");
        notification.setHeading("Post Liked");
        notification.setKey("post-liked-" + event.getPostId() + "-" + event.getUserId());
        saveAndSend(notification);
    }

    public void createNotification(CommentCreatedEvent event) {
        Optional<Post> postOpt = postRepository.findById(UUID.fromString(event.getPostId()));
        if (postOpt.isEmpty()) return;
        
        UUID authorId = postOpt.get().getAuthorId();
        String actorName = getActorName(UUID.fromString(event.getUserId()));

        Notification notification = new Notification();
        notification.setRecipientId(authorId);
        notification.setNotification(actorName + " commented on your post: " + event.getContent());
        notification.setHeading("New Comment");
        notification.setKey("comment-created-" + event.getCommentId());
        saveAndSend(notification);
    }

    public void createNotification(ConnectionRequestedEvent event) {
        String actorName = getActorName(event.getSenderId());
        Notification notification = new Notification();
        notification.setRecipientId(event.getReceiverId());
        notification.setNotification(actorName + " sent you a connection request.");
        notification.setHeading("Connection Request");
        notification.setKey("connection-requested-" + event.getSenderId());
        saveAndSend(notification);
    }

    public void createNotification(ConnectionAcceptedEvent event) {
        String actorName = getActorName(event.getReceiverId());
        Notification notification = new Notification();
        notification.setRecipientId(event.getRequesterId());
        notification.setNotification(actorName + " accepted your connection request.");
        notification.setHeading("Connection Accepted");
        notification.setKey("connection-accepted-" + event.getReceiverId());
        saveAndSend(notification);
    }
}
