package com.org.linkedin.profile.service.impl;

import com.org.linkedin.domain.Connection;
import com.org.linkedin.domain.enumeration.ConnectionStatus;
import com.org.linkedin.dto.user.TUserDTO;
import com.org.linkedin.dto.connection.UserConnectionStatusDTO;
import com.org.linkedin.profile.repo.ConnectionRepository;
import com.org.linkedin.profile.service.ConnectionService;
import com.org.linkedin.utility.client.UserService;
import com.org.linkedin.utility.service.KafkaEventPublisher;
import com.org.linkedin.dto.event.ConnectionRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConnectionServiceImpl implements ConnectionService {
    private final UserService userService;

    private final ConnectionRepository repository;

    private final KafkaEventPublisher kafkaEventPublisher;

    @Value("${kafka.topics.connection-requested}")
    private String connectionRequestedTopic;

    @Value("${kafka.topics.connection-accepted}")
    private String connectionAcceptedTopic;

    @Override
    public void sendRequest(Authentication authentication, UUID receiverId) {

        UUID requesterId = userService.getUserByKeyCloakId(UUID.fromString(authentication.getName())).getBody().getResult().getId();
        log.info("Sending connection request from {} to {}", requesterId, receiverId);

        if (requesterId.equals(receiverId)) {
            throw new RuntimeException("Cannot connect with yourself");
        }

        // Check both directions
        boolean alreadyExists = repository.findByRequesterIdAndReceiverId(requesterId, receiverId).isPresent() ||
                               repository.findByRequesterIdAndReceiverId(receiverId, requesterId).isPresent();

        if (alreadyExists) {
            throw new RuntimeException("Connection request already exists or you are already connected");
        }

        Connection connection = new Connection();
        connection.setRequesterId(requesterId);
        connection.setReceiverId(receiverId);
        connection.setStatus(ConnectionStatus.PENDING);
        repository.save(connection);

        // Publish Connection Requested Event
        ConnectionRequestedEvent event = ConnectionRequestedEvent.builder()
                .senderId(requesterId)
                .receiverId(receiverId)
                .timestamp(LocalDateTime.now())
                .build();
        kafkaEventPublisher.publishEvent(connectionRequestedTopic, event);
    }

    @Override
    public void respondToRequest(Authentication authentication, UUID connectionId, boolean accept) {
        log.info("Responding to connection request {}: accept={}", connectionId, accept);

        UUID userId = userService.getUserByKeyCloakId(UUID.fromString(authentication.getName())).getBody().getResult().getId();
        log.info("Authenticated user internal ID: {}", userId);

        Connection connection = repository.findById(connectionId)
            .orElseThrow(() -> new RuntimeException("Request not found"));
        log.info("Found connection: requester={}, receiver={}, status={}", connection.getRequesterId(), connection.getReceiverId(), connection.getStatus());

        if (!connection.getReceiverId().equals(userId)) {
            log.error("Unauthorized: Connection receiver ID {} does not match user ID {}", connection.getReceiverId(), userId);
            throw new RuntimeException("Unauthorized");
        }

        connection.setStatus(
            accept ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED
        );

        repository.save(connection);
        log.info("Updated connection status to {}", connection.getStatus());

        if (accept) {
            com.org.linkedin.dto.event.ConnectionAcceptedEvent event = com.org.linkedin.dto.event.ConnectionAcceptedEvent.builder()
                    .requesterId(connection.getRequesterId())
                    .receiverId(connection.getReceiverId())
                    .timestamp(LocalDateTime.now())
                    .build();
            kafkaEventPublisher.publishEvent(connectionAcceptedTopic, event);
        }
    }

    @Override
    public void cancelRequest(Authentication authentication, UUID connectionId) {
        UUID userId = userService.getUserByKeyCloakId(UUID.fromString(authentication.getName())).getBody().getResult().getId();
        Connection connection = repository.findById(connectionId)
            .orElseThrow(() -> new RuntimeException("Connection request not found"));

        if (!connection.getRequesterId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own requests");
        }

        if (connection.getStatus() != ConnectionStatus.PENDING) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        repository.delete(connection);
        log.info("Connection request {} cancelled by user {}", connectionId, userId);
    }

    @Override
    public List<UUID> getMyConnections(Authentication authentication) {

        UUID userId = userService.getUserByKeyCloakId(UUID.fromString(authentication.getName())).getBody().getResult().getId();
        List<Connection> sent =
            repository.findByRequesterIdAndStatus(
                userId, ConnectionStatus.ACCEPTED);

        List<Connection> received =
            repository.findByReceiverIdAndStatus(
                userId, ConnectionStatus.ACCEPTED);

        return Stream.concat(sent.stream(), received.stream())
            .map(c -> c.getRequesterId().equals(userId)
                    ? c.getReceiverId()
                    : c.getRequesterId())
            .toList();
    }

    @Override
    public List<Connection> getPendingRequests(Authentication authentication) {
        UUID userId = userService.getUserByKeyCloakId(UUID.fromString(authentication.getName())).getBody().getResult().getId();
        return repository.findByReceiverIdAndStatus(userId, ConnectionStatus.PENDING);
    }

    @Override
    public UserConnectionStatusDTO getConnectionStatus(Authentication authentication, UUID otherUserId) {
        UUID userId = userService.getUserByKeyCloakId(UUID.fromString(authentication.getName())).getBody().getResult().getId();

        // 1. Check if logged-in user is the requester
        Optional<Connection> sent = repository.findByRequesterIdAndReceiverId(userId, otherUserId);
        if (sent.isPresent()) {
            return UserConnectionStatusDTO.builder()
                    .connectionId(sent.get().getId())
                    .status(sent.get().getStatus().name())
                    .isRequester(true)
                    .build();
        }

        // 2. Check if logged-in user is the receiver
        Optional<Connection> received = repository.findByRequesterIdAndReceiverId(otherUserId, userId);
        if (received.isPresent()) {
            return UserConnectionStatusDTO.builder()
                    .connectionId(received.get().getId())
                    .status(received.get().getStatus().name())
                    .isRequester(false)
                    .build();
        }

        return UserConnectionStatusDTO.builder()
                .status("NONE")
                .build();
    }
}
