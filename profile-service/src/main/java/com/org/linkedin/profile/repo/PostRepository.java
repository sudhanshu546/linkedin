package com.org.linkedin.profile.repo;

import com.org.linkedin.profile.domain.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}
