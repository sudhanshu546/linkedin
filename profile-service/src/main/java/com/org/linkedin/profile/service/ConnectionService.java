package com.org.linkedin.profile.service;

import com.org.linkedin.dto.connection.UserConnectionStatusDTO;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.UUID;

public interface ConnectionService {
    List<UUID> getMyConnections(Authentication authentication);

    void respondToRequest(Authentication authentication, UUID id, boolean accept);

    void sendRequest(Authentication authentication, UUID receiverId);

    void cancelRequest(Authentication authentication, UUID connectionId);

    List<com.org.linkedin.domain.Connection> getPendingRequests(Authentication authentication);

    UserConnectionStatusDTO getConnectionStatus(Authentication authentication, UUID otherUserId);
}
