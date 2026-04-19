import React, { useState, useEffect } from 'react';
import Feed from '../Feed/Feed';
import { Link, useLocation } from 'react-router-dom';
import { createPost, createPoll } from '../../../api/postApi';
import { useUser } from '../../../context/UserContext';
import { useNotifications } from '../../../context/NotificationContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faCalendarAlt, 
  faNewspaper, 
  faUserCircle, 
  faChartBar,
  faPlus,
  faTimes,
  faGlobeAmericas,
  faCaretDown
} from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import RichTextEditor from '../../common/RichTextEditor';
import TrendingHashtags from '../../common/TrendingHashtags';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  
  // Poll State
  const [showPollEditor, setShowPollEditor] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollExpiry, setPollExpiry] = useState('1'); // Days

  const { user } = useUser();
  const { unreadCount } = useNotifications();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openCreatePost) {
        setIsModalOpen(true);
    }
  }, [location.state]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPostImages(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showPollEditor) {
      handlePollSubmit();
      return;
    }

    const isContentEmpty = !postContent.replace(/<[^>]*>/g, '').trim();
    if (isContentEmpty && postImages.length === 0) return;

    setIsSubmitting(true);
    try {
      await createPost({ content: postContent, images: postImages });
      resetForm();
      setFeedKey(prev => prev + 1);
      setIsModalOpen(false);
      toast.success('Post shared successfully!');
    } catch (err) {
      toast.error('Failed to post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePollSubmit = async () => {
    if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) {
      toast.error('Please fill all poll fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(pollExpiry));

      await createPoll({
        question: pollQuestion,
        options: pollOptions.map(text => ({ text })),
        expiryDate: expiryDate.toISOString()
      });

      resetForm();
      setFeedKey(prev => prev + 1);
      setIsModalOpen(false);
      toast.success('Poll created successfully!');
    } catch (err) {
      toast.error('Failed to create poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPostContent('');
    setPostImages([]);
    setImagePreviews([]);
    setShowPollEditor(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="left-column"
      >
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            {user?.profileImageUrl ? (
                <img 
                    src={getImageUrl(user.profileImageUrl) || ''} 
                    alt="Profile" 
                    className="mini-avatar-home"
                    style={{ objectFit: 'cover' }}
                />
            ) : (
                <FontAwesomeIcon icon={faUserCircle} className="mini-avatar-home" style={{ fontSize: '72px', color: '#adb3b8' }} />
            )}
            <Link to="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 style={{ marginTop: '8px', color: 'var(--linkedin-text)', fontWeight: 600 }}>{user ? `${user.firstName} ${user.lastName}` : 'Welcome back!'}</h3>
            </Link>
            <p style={{ fontSize: '12px', color: 'var(--linkedin-secondary-text)', marginTop: '4px' }}>Professional at LinkedIn Clone</p>
          </div>
          <div className="mini-card-stats" style={{ marginTop: '12px' }}>
            <Link to="/profile-views" className="stat-row">
              <span>Who viewed your profile</span>
              <span className="stat-number" style={{ color: '#0a66c2' }}>12</span>
            </Link>
            <Link to="/notifications" className="stat-row">
              <span>Unread notifications</span>
              <span className="stat-number" style={{ color: '#0a66c2' }}>{unreadCount}</span>
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* Middle Column (Feed) */}
      <main className="feed-column">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="linkedin-card create-post-card" 
            style={{ cursor: 'pointer' }}
            onClick={() => setIsModalOpen(true)}
        >
          <div className="post-trigger-row">
            {user?.profileImageUrl ? (
                <img 
                    src={getImageUrl(user.profileImageUrl) || ''} 
                    alt="Me" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
            ) : (
                <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
            )}
            <button className="post-trigger-btn" style={{ pointerEvents: 'none' }}>
              Start a post
            </button>
          </div>
          
          <div className="post-action-buttons-row" style={{ marginTop: '8px' }}>
              <div className="post-opt-btn">
                <FontAwesomeIcon icon={faImage} className="icon-photo" />
                <span>Photo</span>
              </div>
              <div className="post-opt-btn">
                <FontAwesomeIcon icon={faCalendarAlt} className="icon-event" />
                <span>Event</span>
              </div>
              <div className="post-opt-btn">
                <FontAwesomeIcon icon={faNewspaper} className="icon-article" />
                <span>Write article</span>
              </div>
          </div>
        </motion.div>

        {/* Create Post Modal */}
        <AnimatePresence>
            {isModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '80px' }}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="linkedin-card modal-content" 
                        style={{ width: '100%', maxWidth: '552px', overflow: 'hidden', padding: 0 }}
                    >
                        <div className="modal-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 400 }}>Create a post</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="modal-body custom-scrollbar" style={{ padding: '16px 24px', maxHeight: '400px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                {user?.profileImageUrl ? (
                                    <img 
                                        src={getImageUrl(user.profileImageUrl) || ''} 
                                        alt="Me" 
                                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
                                )}
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{user?.firstName} {user?.lastName}</h4>
                                    <button style={{ background: 'none', border: '1px solid #666', borderRadius: '16px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, color: '#666', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FontAwesomeIcon icon={faGlobeAmericas} />
                                        Anyone
                                        <FontAwesomeIcon icon={faCaretDown} />
                                    </button>
                                </div>
                            </div>

                            {!showPollEditor ? (
                                <RichTextEditor
                                    placeholder="What do you want to talk about?"
                                    value={postContent}
                                    onChange={(value) => setPostContent(value)}
                                />
                            ) : (
                                <div className="poll-editor">
                                    <input 
                                        placeholder="Your question" 
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value)}
                                        style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
                                        autoFocus
                                    />
                                    {pollOptions.map((opt, idx) => (
                                        <input 
                                            key={idx}
                                            placeholder={`Option ${idx + 1}`} 
                                            value={opt}
                                            onChange={(e) => updatePollOption(idx, e.target.value)}
                                            style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px', outline: 'none' }}
                                        />
                                    ))}
                                    {pollOptions.length < 4 && (
                                        <button type="button" onClick={addPollOption} style={{ background: 'none', border: 'none', color: '#0a66c2', fontWeight: 600, cursor: 'pointer', marginBottom: '16px', padding: 0 }}>+ Add option</button>
                                    )}
                                    <div style={{ marginTop: '8px' }}>
                                        <label style={{ fontSize: '14px', marginRight: '8px', color: '#666' }}>Poll duration:</label>
                                        <select value={pollExpiry} onChange={(e) => setPollExpiry(e.target.value)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                            <option value="1">1 day</option>
                                            <option value="3">3 days</option>
                                            <option value="7">7 days</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {imagePreviews.length > 0 && !showPollEditor && (
                                <div className="post-image-previews-grid" style={{ marginTop: '16px' }}>
                                    {imagePreviews.map((url, index) => (
                                        <div key={index} className="preview-container">
                                            <img src={url} alt={`Preview ${index}`} />
                                            <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ padding: '12px 24px', borderTop: '1px solid #eee' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <label style={{ cursor: 'pointer', padding: '8px', borderRadius: '50%', color: '#666' }} className="hover-bg">
                                        <FontAwesomeIcon icon={faImage} size="lg" />
                                        <input type="file" style={{ display: 'none' }} multiple onChange={handleImageChange} accept="image/*" />
                                    </label>
                                    <button onClick={() => setShowPollEditor(!showPollEditor)} style={{ background: 'none', border: 'none', padding: '8px', borderRadius: '50%', color: '#666', cursor: 'pointer' }} className="hover-bg">
                                        <FontAwesomeIcon icon={faChartBar} size="lg" />
                                    </button>
                                    <button style={{ background: 'none', border: 'none', padding: '8px', borderRadius: '50%', color: '#666', cursor: 'pointer' }} className="hover-bg">
                                        <FontAwesomeIcon icon={faCalendarAlt} size="lg" />
                                    </button>
                                </div>
                                <button 
                                    onClick={handlePostSubmit}
                                    disabled={isSubmitting || (!postContent.trim() && postImages.length === 0 && !pollQuestion.trim())}
                                    className="btn-primary-round"
                                    style={{ padding: '6px 20px', fontSize: '16px', opacity: (isSubmitting || (!postContent.trim() && postImages.length === 0 && !pollQuestion.trim())) ? 0.5 : 1 }}
                                >
                                    {isSubmitting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <Feed key={feedKey} />
      </main>

      {/* Right Column */}
      <motion.aside 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="right-column"
      >
        <TrendingHashtags />
        <div className="linkedin-card news-card-wrapper" style={{ marginTop: '8px', padding: '16px' }}>
          <h3 className="news-header" style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>LinkedIn News</h3>
          <ul className="news-items-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '12px', cursor: 'pointer' }}>
              <h4 style={{ fontSize: '14px', margin: 0, fontWeight: 600 }}>Tech hiring picks up in 2026</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>2d ago • 12,456 readers</span>
            </li>
            <li style={{ cursor: 'pointer' }}>
              <h4 style={{ fontSize: '14px', margin: 0, fontWeight: 600 }}>The future of AI-driven dev</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>1d ago • 8,902 readers</span>
            </li>
          </ul>
        </div>
      </motion.aside>
    </div>
  );
};

export default HomePage;
