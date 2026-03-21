import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed, likePost, unlikePost, commentOnPost, deleteComment, getComments, getLikeCount } from '../../../api/postApi';
import { getUserPosts } from '../../../api/profileApi'; // Moved to profileApi.ts
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../../context/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThumbsUp as farThumbsUp, 
  faCommentDots as farCommentDots, 
  faShareSquare as farShareSquare,
  faPaperPlane,
} from '@fortawesome/free-regular-svg-icons';
import { faThumbsUp as fasThumbsUp, faEllipsisH, faUserCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css'; 

interface FeedProps {
  userId?: string | null;
  limit?: number | null;
}

const SkeletonPost: React.FC = () => (
  <div className="skeleton-post">
    <div className="skeleton-header">
      <div className="skeleton skeleton-avatar"></div>
      <div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-subtitle"></div>
      </div>
    </div>
    <div className="skeleton skeleton-text"></div>
    <div className="skeleton skeleton-text"></div>
    <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
    <div className="skeleton skeleton-image"></div>
  </div>
);

const Feed: React.FC<FeedProps> = ({ userId = null, limit = null }) => {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  const [activeFeedItemId, setActiveFeedItemId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({}); 
  const [postComments, setPostComments] = useState<Record<string, any[]>>({}); 
  const [postStats, setPostStats] = useState<Record<string, any>>({}); 
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (loading || fetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0] && entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, fetchingMore, hasMore]);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/'; 

  const fetchPostStats = useCallback(async (postId: string) => {
    try {
      const likesCount = await getLikeCount(postId);
      const commentsList = await getComments(postId);
      setPostStats(prev => ({
        ...prev,
        [postId]: { ...prev[postId], likes: likesCount, comments: commentsList?.length || 0 }
      }));
    } catch (err) {}
  }, []);

  const fetchFeed = useCallback(async (pageNum: number) => {
    if (pageNum > 0) setFetchingMore(true);
    else setLoading(true);

    try {
      let filteredData: any[] = [];
      
      if (userId) {
        // Fetch posts for a specific user
        const res = await getUserPosts(userId, pageNum, 10);
        const data = res?.content || [];
        filteredData = data.map((post: any) => ({
          ...post,
          id: post.postId,
          actorId: post.userId,
          actorName: post.userName || 'LinkedIn User',
          actorDesignation: post.userDesignation || 'LinkedIn Member',
          actorAvatar: post.profileImageUrl,
          timestamp: post.createdAt,
          type: 'POST_CREATED',
        }));
        if (data.length === 0) setHasMore(false);
      } else {
        // Global feed
        const res = await getFeed(pageNum, 10);
        const data = res?.content || [];
        if (!Array.isArray(data)) {
          console.warn('Received non-array data from feed API:', data);
          setHasMore(false);
          return;
        }
        if (data.length === 0) {
          setHasMore(false);
        }
        filteredData = data;
      }

      if (limit && pageNum === 0) {
        const slicedData = filteredData.slice(0, limit);
        setPosts(slicedData);
        setHasMore(false);
      } else {
        setPosts(prev => pageNum === 0 ? filteredData : [...prev, ...filteredData]);
      }
      
      filteredData.forEach(item => {
        if (item.postId) {
          setPostStats(prev => ({
            ...prev,
            [item.postId]: { ...prev[item.postId], liked: item.likedByCurrentUser }
          }));
          fetchPostStats(item.postId);
        }
      });
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [fetchPostStats, userId, limit]);

  useEffect(() => {
    fetchFeed(page);
  }, [page, fetchFeed]);

  const handleLike = async (postId: string) => {
    const isLiked = postStats[postId]?.liked;
    
    // Optimistic UI update
    setPostStats(prev => ({
        ...prev,
        [postId]: { 
            ...prev[postId], 
            likes: (prev[postId]?.likes || 0) + (isLiked ? -1 : 1), 
            liked: !isLiked 
        }
    }));

    try {
      if (isLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch (err) {
      // Revert if failed
      setPostStats(prev => ({
        ...prev,
        [postId]: { 
            ...prev[postId], 
            likes: (prev[postId]?.likes || 0) + (isLiked ? 1 : -1), 
            liked: isLiked 
        }
      }));
      toast.error('Failed to update like status');
    }
  };

  const toggleComments = async (feedItemId: string, postId: string) => {
    if (activeFeedItemId === feedItemId) {
      setActiveFeedItemId(null);
    } else {
      setActiveFeedItemId(feedItemId);
      if (postId && !postComments[postId]) {
        try {
          const res = await getComments(postId);
          setPostComments(prev => ({ ...prev, [postId]: res || [] }));
        } catch (err) {}
      }
    }
  };

  const handleInputChange = (feedItemId: string, value: string) => {
    setCommentInputs(prev => ({ ...prev, [feedItemId]: value }));
  };

  const handleCommentSubmit = async (feedItemId: string, postId: string) => {
    const text = commentInputs[feedItemId];
    if (!text || !text.trim() || !postId) return;
    
    try {
      const newComment = await commentOnPost(postId, text);
      if (newComment) {
          setPostComments(prev => ({
            ...prev,
            [postId]: [newComment, ...(prev[postId] || [])]
          }));
          setPostStats(prev => ({
            ...prev,
            [postId]: { ...prev[postId], comments: (prev[postId]?.comments || 0) + 1 }
          }));
          handleInputChange(feedItemId, '');
      }
    } catch (err) {}
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      setPostComments(prev => ({
        ...prev,
        [postId]: (prev[postId] || []).filter(c => c.id !== commentId)
      }));
      setPostStats(prev => ({
        ...prev,
        [postId]: { ...prev[postId], comments: Math.max(0, (prev[postId]?.comments || 0) - 1) }
      }));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  if (loading && page === 0) return (
    <div className="feed-skeleton-container" style={{ width: '100%' }}>
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
    </div>
  );

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="linkedin-feed">
      {posts.map((item, index) => {
        const isLastElement = posts.length === index + 1;
        const isExpanded = expandedPosts[item.id];
        const shouldTruncate = item.content && item.content.length > 200;
        const displayContent = shouldTruncate && !isExpanded 
          ? item.content.substring(0, 200) + '...' 
          : item.content;

        return (
          <article 
            key={item.id} 
            ref={isLastElement ? lastPostElementRef : null} 
            className="linkedin-card feed-post-card"
          >
            <div className="post-author-row">
              {item.actorAvatar ? (
                <img 
                    src={`${IMAGE_BASE_URL}${item.actorAvatar}`} 
                    alt={item.actorName} 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
              )}
              <div className="post-author-info">
                <Link to={`/profile/${item.actorId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h4>{item.actorName || 'LinkedIn User'}</h4>
                </Link>
                <p>{item.actorDesignation || 'LinkedIn Member'}</p>
                <span style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
                    {new Date(item.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--linkedin-secondary-text)', cursor: 'pointer' }}>
                <FontAwesomeIcon icon={faEllipsisH} />
              </div>
            </div>
            
            <div className="post-body">
              <p className="post-content-text">
                {displayContent}
                {shouldTruncate && !isExpanded && (
                  <button className="see-more-btn" onClick={() => toggleExpand(item.id)}>see more</button>
                )}
              </p>
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <div className={`post-images-grid images-count-${Math.min(item.imageUrls.length, 4)}`}>
                  {item.imageUrls.map((url: string, idx: number) => (
                    <div key={idx} className="post-image-item">
                      <img src={`${IMAGE_BASE_URL}${url}`} alt={`Post attachment ${idx}`} />
                    </div>
                  ))}
                </div>
              ) : (
                item.imageUrl && (
                  <div className="post-image-full">
                    <img src={`${IMAGE_BASE_URL}${item.imageUrl}`} alt="Post" />
                  </div>
                )
              )}
            </div>

            <div className="post-stats-bar">
              <div className="stat-item">
                {(postStats[item.postId]?.likes > 0 || postStats[item.postId]?.liked) && (
                  <>
                    <div className="like-icon-circle">
                      <FontAwesomeIcon icon={fasThumbsUp} />
                    </div>
                    <span>{postStats[item.postId]?.likes || 0}</span>
                  </>
                )}
              </div>
              <div className="stat-item" onClick={() => toggleComments(item.id, item.postId)}>
                {postStats[item.postId]?.comments > 0 ? `${postStats[item.postId].comments} comments` : ''}
              </div>
            </div>
            
            <div className="interaction-bar">
                <button 
                  onClick={() => item.postId && handleLike(item.postId)} 
                  className={`interaction-item ${postStats[item.postId]?.liked ? 'active' : ''}`}
                >
                  <FontAwesomeIcon icon={postStats[item.postId]?.liked ? fasThumbsUp : farThumbsUp} />
                  <span>Like</span>
                </button>
                <button onClick={() => toggleComments(item.id, item.postId)} className="interaction-item">
                  <FontAwesomeIcon icon={farCommentDots} />
                  <span>Comment</span>
                </button>
                <button className="interaction-item">
                  <FontAwesomeIcon icon={farShareSquare} />
                  <span>Share</span>
                </button>
                <button className="interaction-item">
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span>Send</span>
                </button>
            </div>

            {activeFeedItemId === item.id && (
              <div className="feed-comment-section">
                <div className="comment-input-row">
                  <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8', marginTop: '4px' }} />
                  <div className="integrated-comment-box">
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      value={commentInputs[item.id] || ''}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      className="integrated-input"
                    />
                    {(commentInputs[item.id]?.trim()) && (
                      <button onClick={() => handleCommentSubmit(item.id, item.postId)} className="integrated-post-btn">Post</button>
                    )}
                  </div>
                </div>
                <div className="comments-display-list">
                  {(postComments[item.postId] || []).map((comment: any) => (
                    <div key={comment.id} className="comment-entry" style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'flex-start' }}>
                      <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8', marginTop: '4px' }} />
                      <div className="comment-bubble" style={{ position: 'relative' }}>
                        <div className="comment-entry-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ fontSize: '13px' }}>{comment.userName || `User ${comment.userId?.substring(0,8)}`}</strong>
                            <span style={{ fontSize: '11px', color: 'var(--linkedin-secondary-text)' }}>{comment.userDesignation || 'LinkedIn Member'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--linkedin-secondary-text)' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            {user && user.id === comment.userId && (
                                <button 
                                    onClick={() => handleDeleteComment(item.postId, comment.id)}
                                    style={{ background: 'none', border: 'none', color: 'var(--linkedin-secondary-text)', cursor: 'pointer', padding: '4px' }}
                                    title="Delete comment"
                                >
                                    <FontAwesomeIcon icon={faTrash} style={{ fontSize: '12px' }} />
                                </button>
                            )}
                          </div>
                        </div>
                        <p style={{ marginTop: '8px' }}>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        );
      })}
      {fetchingMore && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div className="spinner-small"></div>
        </div>
      )}
      {!hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--linkedin-secondary-text)', fontSize: '14px' }}>
          You've seen all the posts.
        </div>
      )}
    </div>
  );
};

export default Feed;
