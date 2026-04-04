import React, { useState, useEffect } from 'react';
import Feed from '../Feed/Feed';
import { Link, useLocation } from 'react-router-dom';
import { createPost, createPoll } from '../../../api/postApi';
import { useUser } from '../../../context/UserContext';
import { useNotifications } from '../../../context/NotificationContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faCalendarAlt, faNewspaper, faUserCircle, faChartBar } from '@fortawesome/free-solid-svg-icons';
import '../../../App.css';
import RichTextEditor from '../../common/RichTextEditor';
import TrendingHashtags from '../../common/TrendingHashtags';

const HomePage: React.FC = () => {
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
        setPostContent(' '); 
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
      <aside className="left-column">
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
              <h3>{user ? `${user.firstName} ${user.lastName}` : 'Welcome back!'}</h3>
            </Link>
            <p>Update your profile</p>
          </div>
          <div className="mini-card-stats">
            <Link to="/profile-views" className="stat-row">
              <span>Who viewed your profile</span>
              <span className="stat-number">12</span>
            </Link>
            <Link to="/notifications" className="stat-row">
              <span>Unread notifications</span>
              <span className="stat-number">{unreadCount}</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Middle Column (Feed) */}
      <main className="feed-column">
        <div className="linkedin-card create-post-card">
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
            <button className="post-trigger-btn" onClick={() => { setShowPollEditor(false); document.getElementById('post-image-input')?.click(); }}>
              Start a post
            </button>
          </div>
          
          <form onSubmit={handlePostSubmit}>
            {(postContent.trim() || imagePreviews.length > 0 || showPollEditor) && (
                <div className="expanded-post-area">
                    {!showPollEditor ? (
                      <RichTextEditor
                          placeholder="What's on your mind?"
                          value={postContent}
                          onChange={(value) => setPostContent(value)}
                      />
                    ) : (
                      <div className="poll-editor" style={{ padding: '12px' }}>
                        <input 
                          placeholder="Your question" 
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          style={{ width: '100%', padding: '10px', marginBottom: '16px', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        {pollOptions.map((opt, idx) => (
                          <input 
                            key={idx}
                            placeholder={`Option ${idx + 1}`} 
                            value={opt}
                            onChange={(e) => updatePollOption(idx, e.target.value)}
                            style={{ width: '100%', padding: '8px', marginBottom: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                        ))}
                        {pollOptions.length < 4 && (
                          <button type="button" onClick={addPollOption} style={{ background: 'none', border: 'none', color: '#0a66c2', fontWeight: 600, cursor: 'pointer', marginBottom: '16px' }}>+ Add option</button>
                        )}
                        <div style={{ marginTop: '8px' }}>
                          <label style={{ fontSize: '14px', marginRight: '8px' }}>Poll duration:</label>
                          <select value={pollExpiry} onChange={(e) => setPollExpiry(e.target.value)} style={{ padding: '4px' }}>
                            <option value="1">1 day</option>
                            <option value="3">3 days</option>
                            <option value="7">7 days</option>
                          </select>
                        </div>
                      </div>
                    )}
                    
                    {imagePreviews.length > 0 && !showPollEditor && (
                      <div className="post-image-previews-grid">
                        {imagePreviews.map((url, index) => (
                          <div key={index} className="preview-container">
                            <img src={url} alt={`Preview ${index}`} />
                            <button type="button" className="remove-image-btn" onClick={() => removeImage(index)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="post-submit-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        {showPollEditor && <button type="button" onClick={() => setShowPollEditor(false)} className="btn-secondary-round" style={{ border: 'none' }}>Back</button>}
                        <button type="submit" className="btn-primary-round" disabled={isSubmitting}>
                            {isSubmitting ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="post-action-buttons-row">
              <label className="post-opt-btn" htmlFor="post-image-input">
                <FontAwesomeIcon icon={faImage} className="icon-photo" />
                <span>Photo</span>
              </label>
              <button type="button" className="post-opt-btn" onClick={() => setShowPollEditor(true)}>
                <FontAwesomeIcon icon={faChartBar} style={{ color: '#e06828' }} />
                <span>Create a poll</span>
              </button>
              <button type="button" className="post-opt-btn">
                <FontAwesomeIcon icon={faCalendarAlt} className="icon-event" />
                <span>Event</span>
              </button>
              <button type="button" className="post-opt-btn">
                <FontAwesomeIcon icon={faNewspaper} className="icon-article" />
                <span>Write article</span>
              </button>
              <input type="file" id="post-image-input" style={{ display: 'none' }} multiple onChange={handleImageChange} accept="image/*" />
            </div>
          </form>
        </div>

        <Feed key={feedKey} />
      </main>

      {/* Right Column */}
      <aside className="right-column">
        <TrendingHashtags />
        <div className="linkedin-card news-card-wrapper" style={{ marginTop: '8px' }}>
          <h3 className="news-header">LinkedIn News</h3>
          <ul className="news-items-list">
            <li>
              <h4>Tech hiring picks up in 2026</h4>
              <span>2d ago • 12,456 readers</span>
            </li>
            <li>
              <h4>The future of AI-driven dev</h4>
              <span>1d ago • 8,902 readers</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default HomePage;
