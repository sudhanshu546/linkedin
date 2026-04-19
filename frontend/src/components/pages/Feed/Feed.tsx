import React, { useState, useCallback, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getFeed, reactToPost, unlikePost, getUserReaction, commentOnPost, deleteComment, getComments, getReactionCount, getUserPosts, getPollDetails, voteInPoll, deletePost } from '../../../api/postApi';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const queryClient = useQueryClient();
  
  const [activeFeedItemId, setActiveFeedItemId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({}); 
  const [postComments, setPostComments] = useState<Record<string, any[]>>({}); 
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
  const [showReactionSelector, setShowReactionSelector] = useState<string | null>(null);
  const selectorTimeoutRef = useRef<Record<string, Record<string, NodeJS.Timeout>>>({}).current;

  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Record<string, { commentId: string, userName: string } | null>>({});
  const [votingPosts, setVotingPosts] = useState<Record<string, boolean>>({});
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['feed', userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (userId) {
        const res = await getUserPosts(userId, pageParam, 10);
        const content = res?.content || (Array.isArray(res) ? res : []);
        return {
          content: content.map((post: any) => ({
            ...post,
            id: post.id || post.postId,
            postId: post.id || post.postId,
            actorId: post.authorId || post.userId,
            actorName: post.userName || `${post.user?.firstName || 'LinkedIn'} ${post.user?.lastName || 'User'}`,
            actorDesignation: post.userDesignation || 'LinkedIn Member',
            actorAvatar: post.profileImageUrl || post.user?.profileImageUrl,
            timestamp: post.createdDate,
            content: post.content || post.pollQuestion,
            isPoll: post.isPoll || post.poll === true,
            pollQuestion: post.pollQuestion,
            pollOptions: post.pollOptions,
            hasVoted: post.hasVoted,
            selectedOptionId: post.selectedOptionId,
            userReaction: post.userReaction,
            likedByCurrentUser: post.likedByCurrentUser,
            type: (post.isPoll || post.poll === true) ? 'POLL_CREATED' : 'POST_CREATED',
          })),
          last: res?.last ?? (content.length < 10)
        };
      } else {
        const res = await getFeed(pageParam, 10);
        const content = res?.data || (Array.isArray(res) ? res : []);
        return {
          content: content.map((item: any) => ({
            ...item,
            id: item.id || item.postId,
            postId: item.postId || item.id,
            actorId: item.actorId,
            actorName: item.actorName,
            actorDesignation: item.actorDesignation,
            actorAvatar: item.actorAvatar,
            timestamp: item.timestamp,
            content: item.content || item.pollQuestion,
            isPoll: item.isPoll === true || item.type === 'POLL_CREATED' || item.type === 'POLL',
            pollQuestion: item.pollQuestion,
            pollOptions: item.pollOptions,
            hasVoted: item.hasVoted,
            selectedOptionId: item.selectedOptionId,
            userReaction: item.userReaction,
            likedByCurrentUser: item.likedByCurrentUser,
            type: item.type,
          })),
          last: content.length < 10
        };
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.last ? undefined : allPages.length;
    },
  });

  const posts = data?.pages.flatMap(page => page.content) || [];
  const limitedPosts = limit ? posts.slice(0, limit) : posts;

  useEffect(() => {
    if (onPostsLoaded && posts.length > 0) {
      onPostsLoaded(posts);
    }
  }, [posts, onPostsLoaded]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: HTMLElement | null) => {
    if (isLoading || isFetchingNextPage || limit) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0] && entries[0].isIntersecting && hasNextPage) {
        fetchNextPage();
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, limit]);

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const reactionMutation = useMutation({
    mutationFn: ({ postId, type, isRemove }: { postId: string, type: string, isRemove?: boolean }) => 
      isRemove ? unlikePost(postId) : reactToPost(postId, type),
    onMutate: async ({ postId, type, isRemove }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['feed', userId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['feed', userId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['feed', userId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((post: any) => {
              if ((post.postId || post.id) === postId) {
                const oldReaction = post.userReaction;
                let newCount = post.reactionCount || 0;
                
                if (isRemove) {
                  newCount = Math.max(0, newCount - 1);
                } else if (!oldReaction) {
                  newCount = newCount + 1;
                }
                // if changing reaction (e.g. LIKE to LOVE), count stays same

                return {
                  ...post,
                  userReaction: isRemove ? null : type,
                  reactionCount: newCount,
                  likedByCurrentUser: !isRemove
                };
              }
              return post;
            })
          }))
        };
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback to the previous value if mutation fails
      if (context?.previousData) {
        queryClient.setQueryData(['feed', userId], context.previousData);
      }
      toast.error('Failed to update reaction');
    },
    onSettled: () => {
      // Always refetch after error or success to keep server in sync
      queryClient.invalidateQueries({ queryKey: ['feed', userId] });
    }
  });

  const handleReaction = async (postId: string, type: string) => {
    if (!postId) return;
    
    // Find the post to check current reaction
    const post = posts.find(p => (p.postId || p.id) === postId);
    const isRemove = post?.userReaction === type;

    reactionMutation.mutate({ postId, type, isRemove });
    setShowReactionSelector(null);
  };

  const handleMouseEnter = (postId: string) => {
    if (!postId) return;
    if (selectorTimeoutRef[postId]) {
      clearTimeout(selectorTimeoutRef[postId]);
    }
    setShowReactionSelector(postId);
  };

  const handleMouseLeave = (postId: string) => {
    if (!postId) return;
    selectorTimeoutRef[postId] = setTimeout(() => {
      setShowReactionSelector(null);
    }, 300);
  };

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Post deleted successfully');
    },
    onError: () => toast.error('Failed to delete post')
  });

  const toggleComments = async (feedItemId: string, postId: string) => {
    if (!postId) return;
    if (activeFeedItemId === feedItemId) {
      setActiveFeedItemId(null);
    } else {
      setActiveFeedItemId(feedItemId);
      if (!postComments[postId]) {
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
          // Update local comments state immediately
          setPostComments(prev => {
            const currentComments = prev[postId] || [];
            // Check if comment already exists (precaution)
            if (currentComments.some(c => c.id === newComment.id)) return prev;
            return {
              ...prev,
              [postId]: [newComment, ...currentComments]
            };
          });
          
          // Invalidate feed to update counts
          queryClient.invalidateQueries({ queryKey: ['feed', userId] });
          handleInputChange(feedItemId, '');
          setReplyTo(prev => ({ ...prev, [feedItemId]: null }));
          toast.success('Comment posted');
      }
    } catch (err) {
      toast.error('Failed to post comment');
    }
  };

  const handlePollVote = async (postId: string, optionId: string) => {
    if (votingPosts[postId]) return;

    // Snapshot current state for potential rollback
    const previousData = queryClient.getQueryData(['feed', userId]);

    // Optimistically update the query cache
    queryClient.setQueryData(['feed', userId], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          content: page.content.map((post: any) => {
            const currentPostId = post.postId || post.id;
            if (currentPostId === postId) {
              const oldSelectedId = post.selectedOptionId;
              const isToggleOff = oldSelectedId === optionId;
              
              const newOptions = post.pollOptions.map((opt: any) => {
                let newCount = opt.voteCount || 0;
                if (isToggleOff && opt.id === optionId) {
                  newCount = Math.max(0, newCount - 1);
                } else if (!isToggleOff) {
                   if (opt.id === optionId) {
                     newCount += 1;
                   } else if (opt.id === oldSelectedId) {
                     newCount = Math.max(0, newCount - 1);
                   }
                }
                return { ...opt, voteCount: newCount };
              });

              return {
                ...post,
                pollOptions: newOptions,
                selectedOptionId: isToggleOff ? null : optionId,
                hasVoted: !isToggleOff
              };
            }
            return post;
          })
        }))
      };
    });

    setVotingPosts(prev => ({ ...prev, [postId]: true }));
    try {
      await voteInPoll(postId, optionId);
      // Invalidate to ensure sync with backend (e.g. other users' votes)
      queryClient.invalidateQueries({ queryKey: ['feed', userId] });
    } catch (err: any) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(['feed', userId], previousData);
      }
      toast.error(err.response?.data?.message || 'Failed to record vote');
    } finally {
      setVotingPosts(prev => ({ ...prev, [postId]: false }));
    }
  };

  const renderCommentsList = (postId: string, feedItemId: string, parentId: string | null = null, depth = 0) => {
    const comments = (postComments[postId] || []).filter(c => c?.parentId === parentId);
    if (comments.length === 0) return null;

    const post = posts.find(p => (p.postId || p.id) === postId);

    return comments.map((comment: any) => (
      <div key={comment.id} className="comment-thread-container" style={{ marginLeft: depth > 0 ? '40px' : '0', marginTop: '8px' }}>
        <div className="comment-entry" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          {comment.userProfileImageUrl ? (
            <img 
              src={getImageUrl(comment.userProfileImageUrl) || ''} 
              alt={comment.userName} 
              style={{ width: depth > 0 ? '24px' : '32px', height: depth > 0 ? '24px' : '32px', borderRadius: '50%', objectFit: 'cover', marginTop: '4px' }}
            />
          ) : (
            <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: depth > 0 ? '24px' : '32px', color: '#adb3b8', marginTop: '4px' }} />
          )}
          <div className="comment-bubble" style={{ flex: 1, backgroundColor: '#f2f2f2', padding: '8px 12px', borderRadius: '8px' }}>
            <div className="comment-entry-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: '13px' }}>{comment.userName || `User ${comment.userId?.substring(0,8)}`}</strong>
                <span style={{ fontSize: '11px', color: 'var(--linkedin-secondary-text)' }}>{comment.userDesignation || 'LinkedIn Member'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--linkedin-secondary-text)' }}>{new Date(comment.createdDate || Date.now()).toLocaleDateString()}</span>
                {user && (user.id === (comment.authorId || comment.userId) || user.id === post?.actorId || user.id === post?.userId) && (
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
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  if (isLoading) return (
    <div className="feed-skeleton-container" style={{ width: '100%' }}>
      <SkeletonPost />
      <SkeletonPost />
      <SkeletonPost />
    </div>
  );

  if (isError) return <div className="error-container">Failed to load feed.</div>;

  const toggleExpand = (postId: string) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="linkedin-feed">
      <AnimatePresence>
      {limitedPosts.map((item, index) => {
        const isLastElement = limitedPosts.length === index + 1;
        const isExpanded = expandedPosts[item.id];
        const shouldTruncate = item.content && item.content.length > 200;
        const displayContent = shouldTruncate && !isExpanded 
          ? item.content.substring(0, 200) + '...' 
          : (item.content || '');

        const postId = item.postId || item.id;

        return (
          <motion.article 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(index * 0.1, 0.5) }}
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
                  <h4 style={{ color: 'var(--linkedin-text)', fontWeight: 600 }}>{item.actorName || 'LinkedIn User'}</h4>
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
                <AnimatePresence>
                {showPostMenu === item.id && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    className="post-options-dropdown" 
                    style={{ position: 'absolute', right: 0, top: '24px', background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', borderRadius: '8px', zIndex: 100, width: '180px', padding: '8px 0' }}
                  >
                    {user && (user.id === item.actorId || user.id === item.userId) && (
                      <>
                        <button 
                          onClick={() => { deletePostMutation.mutate(postId); setShowPostMenu(null); }}
                          style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#d11124' }}
                        >
                          Delete post
                        </button>
                      </>
                    )}
                    <button style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>Save</button>
                    <button style={{ width: '100%', padding: '10px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>Copy link</button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>
            
            <div className="post-body">
              {!item.isPoll && (
                <div 
                  className="post-content-text"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(displayContent) }}
                />
              )}
              {!item.isPoll && shouldTruncate && !isExpanded && (
                <button className="see-more-btn" onClick={() => toggleExpand(item.id)}>see more</button>
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

              {/* Poll UI */}
              {item.isPoll && item.pollOptions && (
                <div className="poll-container" style={{ marginTop: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px' }}>
                  <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'rgba(0,0,0,0.9)' }}>{item.pollQuestion}</h4>
                  <div className="poll-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {item.pollOptions.map((opt: any) => {
                      const totalVotes = item.pollOptions.reduce((acc: number, o: any) => acc + (o.voteCount || 0), 0);
                      const percentage = totalVotes > 0 ? Math.round((opt.voteCount || 0) / totalVotes * 100) : 0;
                      const isSelected = item.selectedOptionId === opt.id;
                      const isVoting = votingPosts[postId];

                      return (
                        <div 
                          key={opt.id} 
                          className={`poll-option ${item.hasVoted ? 'voted' : ''}`}
                          onClick={() => handlePollVote(postId, opt.id)}
                          onMouseEnter={() => setHoveredOptionId(opt.id)}
                          onMouseLeave={() => setHoveredOptionId(null)}
                          style={{ 
                            position: 'relative', 
                            padding: '10px 12px', 
                            borderRadius: '20px', 
                            border: isSelected ? '2px solid #0a66c2' : '1px solid #0a66c2',
                            cursor: isVoting ? 'not-allowed' : 'pointer',
                            overflow: 'hidden',
                            backgroundColor: hoveredOptionId === opt.id && !item.hasVoted ? '#eef3f8' : 'white',
                            transition: 'all 0.2s',
                            opacity: isVoting ? 0.6 : 1
                          }}
                        >
                          {(item.hasVoted || hoveredOptionId === opt.id) && (
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="poll-progress-bar" 
                              style={{ 
                                position: 'absolute', 
                                left: 0, 
                                top: 0, 
                                bottom: 0, 
                                backgroundColor: isSelected ? '#dce6f2' : (hoveredOptionId === opt.id && !item.hasVoted ? '#f0f0f0' : '#f3f2ef'),
                                zIndex: 0,
                                opacity: item.hasVoted ? 1 : 0.5
                              }} 
                            />
                          )}
                          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#0a66c2' }}>
                              {opt.text}
                              {isSelected && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(Your vote)</span>}
                            </span>
                            {item.hasVoted && <span style={{ fontSize: '12px', color: '#666' }}>{percentage}%</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    {item.pollOptions.reduce((acc: number, o: any) => acc + (o.voteCount || 0), 0)} votes
                  </div>
                </div>
              )}
            </div>

            <div className="post-stats-bar">
              <div className="stat-item">
                {(item.reactionCount > 0) && (
                  <>
                    <div className="like-icon-circle" style={{ background: REACTION_TYPES.find(r => r.type === item.userReaction)?.color || '#0a66c2' }}>
                      <FontAwesomeIcon icon={REACTION_TYPES.find(r => r.type === item.userReaction)?.icon || fasThumbsUp} />
                    </div>
                    <span style={{ marginLeft: '4px' }}>{item.reactionCount || 0}</span>
                  </>
                )}
              </div>
              <div className="stat-item" onClick={() => toggleComments(item.id, postId)}>
                {item.commentCount > 0 ? `${item.commentCount} comments` : ''}
              </div>
            </div>
            
            <div className="interaction-bar" style={{ position: 'relative' }}>
                <div 
                  className="reaction-button-wrapper"
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={() => handleMouseLeave(item.id)}
                >
                    <AnimatePresence>
                    {showReactionSelector === item.id && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.8 }}
                            className="reaction-selector-popup" 
                            onMouseEnter={() => handleMouseEnter(item.id)}
                        >
                            {REACTION_TYPES.map(r => (
                                <motion.button 
                                    whileHover={{ scale: 1.4 }}
                                    whileTap={{ scale: 0.9 }}
                                    key={r.type} 
                                    className="reaction-icon-btn" 
                                    onClick={() => handleReaction(postId, r.type)}
                                    title={r.label}
                                >
                                    <FontAwesomeIcon icon={r.icon} style={{ color: r.color }} />
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                    </AnimatePresence>
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => postId && handleReaction(postId, item.userReaction || 'LIKE')} 
                      className={`interaction-item ${item.userReaction ? 'active' : ''}`}
                      style={{ color: item.userReaction ? REACTION_TYPES.find(r => r.type === item.userReaction)?.color : 'inherit' }}
                    >
                      <motion.div
                        animate={item.userReaction ? { scale: [1, 1.2, 1] } : {}}
                        key={item.userReaction}
                      >
                        <FontAwesomeIcon icon={item.userReaction ? (REACTION_TYPES.find(r => r.type === item.userReaction)?.icon || fasThumbsUp) : farThumbsUp} />
                      </motion.div>
                      <span>{item.userReaction ? REACTION_TYPES.find(r => r.type === item.userReaction)?.label : 'Like'}</span>
                    </motion.button>
                </div>

                <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleComments(item.id, postId)} className="interaction-item">
                  <FontAwesomeIcon icon={farCommentDots} />
                  <span>Comment</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} className="interaction-item">
                  <FontAwesomeIcon icon={farShareSquare} />
                  <span>Share</span>
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} className="interaction-item">
                  <FontAwesomeIcon icon={faPaperPlane} />
                  <span>Send</span>
                </motion.button>
            </div>

            <AnimatePresence>
            {activeFeedItemId === item.id && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="feed-comment-section"
              >
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
              </motion.div>
            )}
            </AnimatePresence>
          </motion.article>
        );
      })}
      </AnimatePresence>
      {isFetchingNextPage && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <div className="spinner-small"></div>
        </div>
      )}
      {!hasNextPage && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--linkedin-secondary-text)', fontSize: '14px' }}>
          You've seen all the posts.
        </div>
      )}
    </div>
  );
};

export default Feed;
