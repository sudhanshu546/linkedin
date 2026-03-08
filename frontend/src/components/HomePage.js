import React, { useState, useEffect } from 'react';
import Feed from './Feed';
import { Link } from 'react-router-dom';
import { createPost } from '../api/postApi';
import { getUserDetail } from '../api/userApi';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faCalendarAlt, faNewspaper, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import '../App.css';

const HomePage = () => {
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedKey, setFeedKey] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserDetail().then(res => setUser(res.result)).catch(e => console.error(e));
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPostImage(e.target.files[0]);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && !postImage) return;

    setIsSubmitting(true);
    try {
      await createPost(postContent, postImage);
      setPostContent('');
      setPostImage(null);
      setFeedKey(prev => prev + 1);
      toast.success('Post shared successfully!');
    } catch (err) {
      toast.error('Failed to post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-layout three-column-grid">
      {/* Left Column */}
      <aside className="left-column">
        <div className="linkedin-card profile-mini-card">
          <div className="mini-card-cover"></div>
          <div className="mini-card-content">
            <FontAwesomeIcon icon={faUserCircle} className="mini-avatar-home" style={{ fontSize: '72px', color: '#adb3b8' }} />
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
            <Link to="/mynetwork" className="stat-row">
              <span>Connections</span>
              <span className="stat-number">48</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Middle Column (Feed) */}
      <main className="feed-column">
        <div className="linkedin-card create-post-card">
          <div className="post-trigger-row">
            <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
            <button className="post-trigger-btn" onClick={() => document.getElementById('post-image-input').click()}>
              Start a post
            </button>
          </div>
          
          <form onSubmit={handlePostSubmit}>
            {(postContent.trim() || postImage) && (
                <div className="expanded-post-area">
                    <textarea
                        placeholder="What's on your mind?"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        className="post-textarea-main"
                        autoFocus
                    />
                    <div className="post-submit-footer">
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
              <button type="button" className="post-opt-btn">
                <FontAwesomeIcon icon={faVideo} className="icon-video" />
                <span>Video</span>
              </button>
              <button type="button" className="post-opt-btn">
                <FontAwesomeIcon icon={faCalendarAlt} className="icon-event" />
                <span>Event</span>
              </button>
              <button type="button" className="post-opt-btn">
                <FontAwesomeIcon icon={faNewspaper} className="icon-article" />
                <span>Write article</span>
              </button>
              <input type="file" id="post-image-input" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
          </form>
        </div>

        <Feed key={feedKey} />
      </main>

      {/* Right Column */}
      <aside className="right-column">
        <div className="linkedin-card news-card-wrapper">
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
