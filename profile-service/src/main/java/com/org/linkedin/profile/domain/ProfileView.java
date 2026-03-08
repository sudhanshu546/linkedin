package com.org.linkedin.profile.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "profile_views")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileView {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "viewer_id", nullable = false)
    private UUID viewerId;

    @Column(name = "profile_owner_id", nullable = false)
    private UUID profileOwnerId;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;
}
