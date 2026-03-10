package com.org.linkedin.profile.repo;

import com.org.linkedin.domain.ActivityFeedItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityFeedItemRepository extends JpaRepository<ActivityFeedItem, UUID> {
    List<ActivityFeedItem> findByUserIdOrderByTimestampDesc(UUID userId, Pageable pageable);
}
