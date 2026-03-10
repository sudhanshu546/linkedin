import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed, likePost, commentOnPost, getComments, getLikeCount } from '../api/postApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThumbsUp as farThumbsUp, 
  faCommentDots as farCommentDots, 
  faShareSquare as farShareSquare,
  faPaperPlane
} from '@fortawesome/free-regular-svg-icons';
import { faThumbsUp as fasThumbsUp, faEllipsisH, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../App.css'; 

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  const [activeFeedItemId, setActiveFeedItemId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({}); 
  const [postComments, setPostComments] = useState({}); 
  const [postStats, setPostStats] = useState({}); 

  const observer = useRef();
  const lastPostElementRef = useCallback(node => {
    if (loading || fetchingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, fetchingMore, hasMore]);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:8081/uploads/'; 

  const fetchPostStats = useCallback(async (postId) => {
    try {
      const likes = await getLikeCount(postId);
      const comments = await getComments(postId);
      setPostStats(prev => ({
        ...prev,
        [postId]: { ...prev[postId], likes, comments: comments.length }
      }));
    } catch (err) {}
  }, []);

  const fetchFeed = useCallback(async (pageNum) => {
    if (pageNum > 0) setFetchingMore(true);
    else setLoading(true);

    try {
      const data = await getFeed(pageNum, 10);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => pageNum === 0 ? data : [...prev, ...data]);
        data.forEach(item => {
          if (item.postId) fetchPostStats(item.postId);
        });
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [fetchPostStats]);

  useEffect(() => {
    fetchFeed(page);
  }, [page, fetchFeed]);

  const handleLike = async (postId) => {
    // Optimistic UI
    const currentStats = postStats[postId] || { likes: 0, liked: false };
    if (currentStats.liked) return; // Prevent multiple likes locally

    setPostStats(prev => ({
        ...prev,
        [postId]: { 
            ...prev[postId], 
            likes: (prev[postId]?.likes || 0) + 1, 
            liked: true 
        }
    }));

    try {
      await likePost(postId);
      toast.success('Post liked!');
    } catch (err) {
      // Revert if failed
      setPostStats(prev => ({
        ...prev,
        [postId]: { 
            ...prev[postId], 
            likes: (prev[postId]?.likes || 0) - 1, 
            liked: false 
        }
      }));
    }
  };

  const toggleComments = async (feedItemId, postId) => {
    if (activeFeedItemId === feedItemId) {
      setActiveFeedItemId(null);
    } else {
      setActiveFeedItemId(feedItemId);
      if (postId && !postComments[postId]) {
        try {
          const comments = await getComments(postId);
          setPostComments(prev => ({ ...prev, [postId]: comments }));
        } catch (err) {}
      }
    }
  };

  const handleInputChange = (feedItemId, value) => {
    setCommentInputs(prev => ({ ...prev, [feedItemId]: value }));
  };

  const handleCommentSubmit = async (feedItemId, postId) => {
    const text = commentInputs[feedItemId];
    if (!text || !text.trim() || !postId) return;
    
    try {
      const newComment = await commentOnPost(postId, text);
      setPostComments(prev => ({
        ...prev,
        [postId]: [newComment, ...(prev[postId] || [])]
      }));
      setPostStats(prev => ({
        ...prev,
        [postId]: { ...prev[postId], comments: (prev[postId]?.comments || 0) + 1 }
      }));
      handleInputChange(feedItemId, '');
    } catch (err) {}
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
    </div>
  );

  return (
    <div className="linkedin-feed">
      {posts.map((item, index) => {
        const isLastElement = posts.length === index + 1;
        return (
          <article 
            key={item.id} 
            ref={isLastElement ? lastPostElementRef : null} 
            className="linkedin-card feed-post-card"
          >
            <div className="post-author-row">
              <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
              <div className="post-author-info">
                <Link to={`/profile/${item.actorProfileId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
              <p className="post-content-text">{item.content}</p>
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <div className={`post-images-grid images-count-${Math.min(item.imageUrls.length, 4)}`}>
                  {item.imageUrls.map((url, idx) => (
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

            <div className="post-stats-bar" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
              {postStats[item.postId]?.likes > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ background: '#378fe9', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                    <FontAwesomeIcon icon={fasThumbsUp} />
                  </div>
                  {postStats[item.postId].likes}
                </div>
              )}
              {postStats[item.postId]?.comments > 0 && (
                <div>{postStats[item.postId].comments} comments</div>
              )}
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
                  <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8' }} />
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
                  {(postComments[item.postId] || []).map(comment => (
                    <div key={comment.id} className="comment-entry" style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8' }} />
                      <div className="comment-bubble">
                        <div className="comment-entry-header">
                          <strong>User {comment.userId?.substring(0,8)}</strong>
                        </div>
                        <p>{comment.content}</p>
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
