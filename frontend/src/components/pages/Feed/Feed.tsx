import React, { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { getFeed, reactToPost, getUserReaction, commentOnPost, deleteComment, getComments, getReactionCount, getUserPosts, getPollDetails, voteInPoll, deletePost, toggleComments } from '../../../api/postApi';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useUser } from '../../../context/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faThumbsUp as farThumbsUp, 
  faCommentDots as farCommentDots, 
  faShareSquare as farShareSquare,
  faPaperPlane,
  faHeart,
  faLightbulb,
  faSmile
} from '@fortawesome/free-regular-svg-icons';
import { faThumbsUp as fasThumbsUp, faEllipsisH, faUserCircle, faTrash, faHandsClapping, faHandHoldingHeart } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css'; 
import { IMAGE_BASE_URL } from '../../../constants/api'; 

const REACTION_TYPES = [
  { type: 'LIKE', label: 'Like', icon: fasThumbsUp, color: '#0a66c2' },
  { type: 'CELEBRATE', label: 'Celebrate', icon: faHandsClapping, color: '#057642' },
  { type: 'SUPPORT', label: 'Support', icon: faHandHoldingHeart, color: '#0a66c2' },
  { type: 'LOVE', label: 'Love', icon: faHeart, color: '#d11124' },
  { type: 'INSIGHTFUL', label: 'Insightful', icon: faLightbulb, color: '#f59e0b' },
  { type: 'FUNNY', label: 'Funny', icon: faSmile, color: '#70b5f9' },
];
interface FeedProps {
  userId?: string | null;
  limit?: number | null;
  onPostsLoaded?: (posts: any[]) => void;
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

const Feed: React.FC<FeedProps> = ({ userId = null, limit = null, onPostsLoaded }) => {
  const { user } = useUser();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  const [activeFeedItemId, setActiveFeedItemId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({}); 
  const [postComments, setPostComments] = useState<Record<string, any[]>>({}); 
  const [postStats, setPostStats] = useState<Record<string, any>>({}); 
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [showReactionSelector, setShowReactionSelector] = useState<string | null>(null);
  const selectorTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const handleMouseEnter = (postId: string) => {
    if (selectorTimeoutRef.current[postId]) {
      clearTimeout(selectorTimeoutRef.current[postId]);
    }
    setShowReactionSelector(postId);
  };

  const handleMouseLeave = (postId: string) => {
    selectorTimeoutRef.current[postId] = setTimeout(() => {
      setShowReactionSelector(null);
    }, 300); // 300ms grace period to cross the gap
  };

  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Record<string, { commentId: string, userName: string } | null>>({});
  const [pollDetails, setPollDetails] = useState<Record<string, any>>({});

  const fetchPollDetails = useCallback(async (postId: string) => {
    try {
      const details = await getPollDetails(postId);
      if (details) {
        setPollDetails(prev => ({ ...prev, [postId]: details }));
      }
    } catch (err) {}
  }, []);

  const handleVote = async (postId: string, optionId: string) => {
    try {
      await voteInPoll(postId, optionId);
      toast.success('Vote recorded!');
      fetchPollDetails(postId);
    } catch (err) {
      toast.error('Failed to record vote');
    }
  };

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

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const fetchPostStats = useCallback(async (postId: string) => {
    if (!postId) return;
    try {
      const [reactionsCount, commentsList, userReaction] = await Promise.all([
          getReactionCount(postId),
          getComments(postId),
          getUserReaction(postId)
      ]);
      setPostStats(prev => ({
        ...prev,
        [postId]: { ...prev[postId], reactions: reactionsCount || 0, comments: commentsList?.length || 0, userReaction }
      }));
    } catch (err) {}
  }, []);

  const fetchFeed = useCallback(async (pageNum: number) => {
    if (pageNum > 0) setFetchingMore(true);
    else setLoading(true);

    try {
      let filteredData: any[] = [];
      
      if (userId) {
        const res = await getUserPosts(userId, pageNum, 10);
        // Handle Spring Page object or direct array
        const content = (res as any)?.content || (Array.isArray(res) ? res : []);
        
        filteredData = content.map((post: any) => ({
          ...post,
          id: post.id || post.postId,
          postId: post.id || post.postId,
          actorId: post.userId,
          actorName: post.userName || 'LinkedIn User',
          actorDesignation: post.userDesignation || 'LinkedIn Member',
          actorAvatar: post.profileImageUrl,
          timestamp: post.createdDate,
          content: post.content || post.pollQuestion, // Fallback to pollQuestion
          isPoll: post.isPoll || post.poll === true, // Support both isPoll and poll fields
          type: (post.isPoll || post.poll === true) ? 'POLL_CREATED' : 'POST_CREATED',
        }));
        
        if (content.length === 0 || (res as any)?.last === true) {
          setHasMore(false);
        }

        // Fetch enrichment for profile posts
        const postIds = content.map((p: any) => p.id || p.postId).filter(Boolean);
        if (postIds.length > 0) {
          try {
            const { getPostEnrichment } = await import('../../../api/postApi'); // Dynamic import to avoid circular dep if any
            // Or just use the existing api instance directly if preferred
            const enrichmentRes = await api.post('/us/posts/enrichment', postIds);
            if (enrichmentRes.data?.data) {
              const enrichment = enrichmentRes.data.data;
              const stats: Record<string, any> = {};
              content.forEach((item: any) => {
                const pid = item.id || item.postId;
                stats[pid] = {
                  reactions: enrichment.reactionCounts[pid] || 0,
                  comments: enrichment.commentCounts[pid] || 0,
                  userReaction: enrichment.userReactions[pid] || null
                };
              });
              setPostStats(prev => ({ ...prev, ...stats }));
            }
          } catch (enrichErr) {
            console.warn('Profile enrichment failed, falling back to manual fetch');
            content.forEach((p: any) => fetchPostStats(p.id || p.postId));
          }
        }
      } else {
        const res = await getFeed(pageNum, 10);
        const data = res?.data || [];
        if (!Array.isArray(data)) {
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
        if (onPostsLoaded) onPostsLoaded(slicedData);
      } else {
        setPosts(prev => pageNum === 0 ? filteredData : [...prev, ...filteredData]);
        if (onPostsLoaded) {
            const currentPosts = pageNum === 0 ? filteredData : [...posts, ...filteredData];
            onPostsLoaded(currentPosts);
        }
      }
      
      // Populate post stats from enriched data
      const stats: Record<string, any> = {};
      filteredData.forEach(item => {
        const postId = item.postId || item.id;
        if (postId) {
          stats[postId] = {
            reactions: item.reactionCount || 0,
            comments: item.commentCount || 0,
            userReaction: item.userReaction || null
          };
        }
      });
      setPostStats(prev => ({ ...prev, ...stats }));

      // Fetch poll details for any polls in the feed
      filteredData.forEach(item => {
        const postId = item.postId || item.id;
        if (item.type === 'POLL_CREATED' || (item.metadata && item.metadata.isPoll === 'true') || item.isPoll) {
          fetchPollDetails(postId);
        }
      });

    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
      setIsInitialLoad(false);
    }
  }, [userId, limit, onPostsLoaded, fetchPostStats]); // Removed 'posts' to prevent infinite loop

  useEffect(() => {
    fetchFeed(page);
  }, [page, fetchFeed]);

  const handleReaction = async (postId: string, type: string) => {
    if (!postId) return;
    const currentUserReaction = postStats[postId]?.userReaction;
    
    setPostStats(prev => ({
        ...prev,
        [postId]: { 
            ...prev[postId], 
            reactions: (prev[postId]?.reactions || 0) + (currentUserReaction === type ? -1 : (currentUserReaction ? 0 : 1)), 
            userReaction: currentUserReaction === type ? null : type 
        }
    }));
    setShowReactionSelector(null);

    try {
      await reactToPost(postId, type);
    } catch (err) {
      toast.error('Failed to update reaction');
      fetchPostStats(postId);
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

  const handleCommentSubmit = async (feedItemId: string, postId: string, parentId?: string) => {
    const text = commentInputs[feedItemId];
    if (!text || !text.trim() || !postId) return;
    
    try {
      const newComment = await commentOnPost(postId, text, parentId);
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
          setReplyTo(prev => ({ ...prev, [feedItemId]: null }));
      }
    } catch (err) {}
  };

  const onDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => (p.postId || p.id) !== postId));
      toast.success('Post deleted successfully');
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  const onToggleComments = async (postId: string) => {
    try {
      const updatedPost = await toggleComments(postId);
      if (!updatedPost) return;
      
      setPosts(prev => prev.map(p => {
        if ((p.postId || p.id) === postId) {
          return { ...p, commentsDisabled: updatedPost.commentsDisabled };
        }
        return p;
      }));
      toast.success(updatedPost.commentsDisabled ? 'Comments disabled' : 'Comments enabled');
    } catch (err) {
      toast.error('Failed to toggle comments');
    }
  };

  const renderCommentsList = (postId: string, feedItemId: string, parentId: string | null = null, depth = 0) => {
    const comments = (postComments[postId] || []).filter(c => c?.parentId === parentId);
    if (comments.length === 0) return null;

    const post = posts.find(p => (p.postId || p.id) === postId);

    return comments.map((comment: any) => (
      <div key={comment.id} className="comment-thread-container" style={{ marginLeft: depth > 0 ? '40px' : '0', marginTop: '8px' }}>
        <div className="comment-entry" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: depth > 0 ? '24px' : '32px', color: '#adb3b8', marginTop: '4px' }} />
          <div className="comment-bubble" style={{ flex: 1, backgroundColor: '#f2f2f2', padding: '8px 12px', borderRadius: '8px' }}>
            <div className="comment-entry-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '13px' }}>{comment.userName || `User ${comment.userId?.substring(0,8)}`}</strong>
                <span style={{ fontSize: '11px', color: 'var(--linkedin-secondary-text)' }}>{comment.userDesignation || 'LinkedIn Member'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--linkedin-secondary-text)' }}>{new Date(comment.createdDate || Date.now()).toLocaleDateString()}</span>
                {user && (user.id === comment.userId || user.id === post?.actorId || user.id === post?.userId) && (
                    <button onClick={() => handleDeleteComment(postId, comment.id)} className="btn-icon-small"><FontAwesomeIcon icon={faTrash} /></button>
                )}
              </div>
            </div>
            <p style={{ marginTop: '4px', fontSize: '14px' }}>{comment.content}</p>
          </div>
        </div>
        <div style={{ marginLeft: depth > 0 ? '32px' : '40px', marginTop: '4px' }}>
            <button 
                onClick={() => setReplyTo(prev => ({ ...prev, [feedItemId]: { commentId: comment.id, userName: comment.userName } }))}
                style={{ background: 'none', border: 'none', color: 'var(--linkedin-secondary-text)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
            >
                Reply
            </button>
        </div>
        {renderCommentsList(postId, feedItemId, comment.id, depth + 1)}
      </div>
    ));
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

  if (loading && page === 0 && isInitialLoad) return (
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
          : (item.content || '');

        const postId = item.postId || item.id;

        return (
          <article 
            key={item.id} 
            ref={isLastElement ? lastPostElementRef : null} 
            className="linkedin-card feed-post-card"
          >
            <div className="post-author-row">
              {item.actorAvatar ? (
                <img 
                    src={getImageUrl(item.actorAvatar) || ''} 
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
                    {new Date(item.timestamp || item.createdDate || Date.now()).toLocaleString()}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--linkedin-secondary-text)', cursor: 'pointer', position: 'relative' }}>
                <FontAwesomeIcon 
                  icon={faEllipsisH} 
                  onClick={() => setShowPostMenu(showPostMenu === item.id ? null : item.id)}
                />
                {showPostMenu === item.id && (
                  <div className="post-options-dropdown" style={{ position: 'absolute', right: 0, top: '24px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 100, width: '180px', padding: '8px 0' }}>
                    {user && (user.id === item.actorId || user.id === item.userId) && (
                      <>
                        <button 
                          onClick={() => { onToggleComments(postId); setShowPostMenu(null); }}
                          style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}
                        >
                          {item.commentsDisabled ? 'Enable comments' : 'Disable comments'}
                        </button>
                        <button 
                          onClick={() => { onDeletePost(postId); setShowPostMenu(null); }}
                          style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#d11124' }}
                        >
                          Delete post
                        </button>
                      </>
                    )}
                    <button style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>Save</button>
                    <button style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>Copy link</button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="post-body">
              <div 
                className="post-content-text"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayContent) }}
              />
              {shouldTruncate && !isExpanded && (
                <button className="see-more-btn" onClick={() => toggleExpand(item.id)}>see more</button>
              )}

              {/* Poll Rendering */}
              {(item.type === 'POLL_CREATED' || (item.metadata && item.metadata.isPoll === 'true') || item.isPoll) && pollDetails[postId] && (
                <div className="poll-container" style={{ marginTop: '12px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f9fafb' }}>
                  <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>{pollDetails[postId].question}</h4>
                  <div className="poll-options">
                    {pollDetails[postId].options.map((option: any) => {
                      const totalVotes = pollDetails[postId].options.reduce((sum: number, opt: any) => sum + opt.voteCount, 0);
                      const percentage = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
                      const isVoted = pollDetails[postId].hasVoted;
                      const isSelected = pollDetails[postId].selectedOptionId === option.id;

                      return (
                        <div key={option.id} style={{ marginBottom: '8px' }}>
                          <button 
                            onClick={() => handleVote(postId, option.id)}
                            disabled={isVoted}
                            className={`poll-option-btn ${isSelected ? 'selected' : ''}`}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px',
                              border: isSelected ? '2px solid #0a66c2' : '1px solid #0a66c2',
                              borderRadius: '24px',
                              background: isVoted ? '#fff' : 'transparent',
                              color: '#0a66c2',
                              fontWeight: '600',
                              cursor: isVoted ? 'default' : 'pointer',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                          >
                            {isVoted && (
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                width: `${percentage}%`,
                                background: isSelected ? '#dce6f1' : '#f3f6f8',
                                zIndex: 0
                              }}></div>
                            )}
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between' }}>
                              <span>{option.text}</span>
                              {isVoted && <span>{percentage}%</span>}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--linkedin-secondary-text)' }}>
                    {pollDetails[postId].options.reduce((sum: number, opt: any) => sum + opt.voteCount, 0)} votes • {new Date(pollDetails[postId].expiryDate) > new Date() ? 'Poll active' : 'Poll closed'}
                  </div>
                </div>
              )}

              {item.imageUrls && item.imageUrls.length > 0 ? (
                <div className={`post-images-grid images-count-${Math.min(item.imageUrls.length, 4)}`}>
                  {item.imageUrls.map((url: string, idx: number) => (
                    <div key={idx} className="post-image-item">
                      <img src={getImageUrl(url) || ''} alt={`Post attachment ${idx}`} />
                    </div>
                  ))}
                </div>
              ) : (
                item.imageUrl && (
                  <div className="post-image-full">
                    <img src={getImageUrl(item.imageUrl) || ''} alt="Post" />
                  </div>
                )
              )}
            </div>

            <div className="post-stats-bar">
              <div className="stat-item">
                {(postStats[postId]?.reactions > 0) && (
                  <>
                    <div className="like-icon-circle" style={{ background: REACTION_TYPES.find(r => r.type === postStats[postId].userReaction)?.color || '#0a66c2' }}>
                      <FontAwesomeIcon icon={REACTION_TYPES.find(r => r.type === postStats[postId].userReaction)?.icon || fasThumbsUp} />
                    </div>
                    <span>{postStats[postId]?.reactions || 0}</span>
                  </>
                )}
              </div>
              <div className="stat-item" onClick={() => toggleComments(item.id, postId)}>
                {postStats[postId]?.comments > 0 ? `${postStats[postId].comments} comments` : ''}
              </div>
            </div>
            
            <div className="interaction-bar" style={{ position: 'relative' }}>
                <div 
                  className="reaction-button-wrapper"
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={() => handleMouseLeave(item.id)}
                >
                    {showReactionSelector === item.id && (
                        <div className="reaction-selector-popup" onMouseEnter={() => handleMouseEnter(item.id)}>
                            {REACTION_TYPES.map(r => (
                                <button 
                                    key={r.type} 
                                    className="reaction-icon-btn" 
                                    onClick={() => handleReaction(postId, r.type)}
                                    title={r.label}
                                >
                                    <FontAwesomeIcon icon={r.icon} style={{ color: r.color }} />
                                </button>
                            ))}
                        </div>
                    )}
                    <button 
                      onClick={() => postId && handleReaction(postId, postStats[postId]?.userReaction || 'LIKE')} 
                      className={`interaction-item ${postStats[postId]?.userReaction ? 'active' : ''}`}
                      style={{ color: postStats[postId]?.userReaction ? REACTION_TYPES.find(r => r.type === postStats[postId].userReaction)?.color : 'inherit' }}
                    >
                      <FontAwesomeIcon icon={postStats[postId]?.userReaction ? (REACTION_TYPES.find(r => r.type === postStats[postId].userReaction)?.icon || fasThumbsUp) : farThumbsUp} />
                      <span>{postStats[postId]?.userReaction ? REACTION_TYPES.find(r => r.type === postStats[postId].userReaction)?.label : 'Like'}</span>
                    </button>
                </div>

                <button onClick={() => toggleComments(item.id, postId)} className="interaction-item">
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
                {!item.commentsDisabled ? (
                  <div className="comment-input-row">
                    <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8', marginTop: '4px' }} />
                    <div className="integrated-comment-box">
                      <div style={{ width: '100%' }}>
                          {replyTo[item.id] && (
                              <div className="reply-indicator" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#f3f2ef', borderRadius: '4px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Replying to <strong>{replyTo[item.id]?.userName}</strong></span>
                                  <button onClick={() => setReplyTo(prev => ({ ...prev, [item.id]: null }))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                              </div>
                          )}
                          <input 
                              type="text" 
                              placeholder="Add a comment..." 
                              value={commentInputs[item.id] || ''}
                              onChange={(e) => handleInputChange(item.id, e.target.value)}
                              className="integrated-input"
                          />
                      </div>
                      {(commentInputs[item.id]?.trim()) && (
                        <button onClick={() => handleCommentSubmit(item.id, postId, replyTo[item.id]?.commentId)} className="integrated-post-btn">Post</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--linkedin-secondary-text)', fontSize: '14px', fontStyle: 'italic' }}>
                    Comments are disabled for this post.
                  </div>
                )}
                <div className="comments-display-list">
                  {renderCommentsList(postId, item.id)}
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
