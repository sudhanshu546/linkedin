package com.org.linkedin.profile.controller;

import com.org.linkedin.domain.notification.Notification;
import com.org.linkedin.profile.repo.NotificationRepository;
import com.org.linkedin.utility.client.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("${apiPrefix}/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserService userService;

    @GetMapping
    public List<Notification> getMyNotifications(Authentication authentication) {
        try {
            UUID keycloakId = UUID.fromString(authentication.getName());
            var userResponse = userService.getUserByKeyCloakId(keycloakId);
            
            if (userResponse != null && userResponse.getBody() != null && userResponse.getBody().getResult() != null) {
                UUID internalUserId = userResponse.getBody().getResult().getId();
                return notificationRepository.findByRecipientIdOrderByCreatedDateDesc(internalUserId);
            }
        } catch (Exception e) {
            // Log error
        }
        return java.util.Collections.emptyList();
    }

    @PutMapping("/{id}/read")
    public void markAsRead(@PathVariable UUID id) {
        notificationRepository.findById(id).ifPresent(notif -> {
            notif.setStatus(1); // 1 = READ
            notificationRepository.save(notif);
        });
    }
}
