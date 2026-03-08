package com.org.linkedin.profile.controller;

import com.org.linkedin.dto.connection.ConnectionRequestDTO;
import com.org.linkedin.dto.connection.UserConnectionStatusDTO;
import com.org.linkedin.profile.service.ConnectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("${apiPrefix}/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    @PostMapping("/request")
    public void sendRequest(
        Authentication authentication,
        @RequestBody ConnectionRequestDTO dto
    ) {
//        UUID userId = UUID.fromString(token.getToken().getSubject());
        connectionService.sendRequest(authentication, dto.getReceiverId());
    }

    @PostMapping("/{id}/respond")
    public void respond(
        Authentication authentication,
        @PathVariable UUID id,
        @RequestParam("accept") boolean accept
    ) {
        connectionService.respondToRequest(authentication, id, accept);
    }

    @DeleteMapping("/{id}/cancel")
    public void cancelRequest(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        connectionService.cancelRequest(authentication, id);
    }

    @GetMapping
    public List<UUID> myConnections(Authentication authentication) {
        return connectionService.getMyConnections(authentication);
    }

    @GetMapping("/pending")
    public List<com.org.linkedin.domain.Connection> getPending(Authentication authentication) {
        return connectionService.getPendingRequests(authentication);
    }

    @GetMapping("/status/{otherUserId}")
    public UserConnectionStatusDTO getStatus(
            Authentication authentication,
            @PathVariable UUID otherUserId
    ) {
        return connectionService.getConnectionStatus(authentication, otherUserId);
    }
}
