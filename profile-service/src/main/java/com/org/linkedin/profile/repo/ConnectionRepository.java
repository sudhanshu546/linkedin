package com.org.linkedin.profile.repo;

import com.org.linkedin.domain.Connection;
import com.org.linkedin.domain.enumeration.ConnectionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConnectionRepository
        extends JpaRepository<Connection, UUID> {

    Optional<Connection> findByRequesterIdAndReceiverId(
        UUID requesterId, UUID receiverId);

    List<Connection> findByRequesterIdAndStatus(
        UUID requesterId, ConnectionStatus status);

    List<Connection> findByReceiverIdAndStatus(
        UUID receiverId, ConnectionStatus status);
}
