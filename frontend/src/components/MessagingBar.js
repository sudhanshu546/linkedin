import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronUp, 
  faChevronDown, 
  faEdit, 
  faEllipsisH, 
  faSearch, 
  faUserCircle,
  faPaperPlane,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons';
import { getMyConnections } from '../api/profileApi';
import { getChatMessages } from '../api/chatApi';
import { getUserById } from '../api/userApi';
import { motion, AnimatePresence } from 'framer-motion';

const MessagingBar = () => {
  const [isExpanded, setIsModalExpanded] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useUser();
  const { messages, sendMessage, setChatHistory, connected } = useChat();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isExpanded && connections.length === 0 && user) {
        fetchConnections();
    }
  }, [isExpanded, user]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await getMyConnections();
      const list = Array.isArray(res) ? res : (res?.data || []);
      
      const detailed = await Promise.all(list.map(async (conn) => {
          const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
          try {
              const u = await getUserById(otherId);
              return {
                  ...conn,
                  otherUserId: otherId,
                  otherUserName: `${u.firstName} ${u.lastName}`,
                  otherUserAvatar: u.profileImageUrl
              };
          } catch (e) {
              return { ...conn, otherUserId: otherId, otherUserName: 'LinkedIn User' };
          }
      }));
      setConnections(detailed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (conn) => {
    setActiveChat(conn);
    try {
        const history = await getChatMessages(conn.otherUserId);
        setChatHistory(conn.otherUserId, history);
    } catch (err) {}
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;
    sendMessage(activeChat.otherUserId, messageInput);
    setMessageInput('');
  };

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeChat]);

  const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_URL || 'http://localhost:9191/us/uploads/';

  const filteredConnections = connections.filter(c => 
    c.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
        layout
        initial={false}
        animate={{ height: isExpanded ? 450 : 48 }}
        className={`messaging-bar-container ${isExpanded ? 'expanded' : ''}`}
        style={{ width: isExpanded && activeChat ? '600px' : '280px', transition: 'width 0.3s ease' }}
    >
      <div className="messaging-header" onClick={() => setIsModalExpanded(!isExpanded)}>
        <div className="header-left">
          {user?.profileImageUrl ? (
              <img src={`${IMAGE_BASE_URL}${user.profileImageUrl}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
          ) : (
              <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '28px', color: '#adb3b8' }} />
          )}
          <span>Messaging</span>
        </div>
        <div className="header-right">
          <FontAwesomeIcon icon={faEllipsisH} className="header-icon" />
          <FontAwesomeIcon icon={faEdit} className="header-icon" />
          <FontAwesomeIcon icon={isExpanded ? faChevronDown : faChevronUp} className="header-icon" />
        </div>
      </div>

      <AnimatePresence>
      {isExpanded && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="messaging-content" 
            style={{ display: 'flex', flexDirection: 'row' }}
        >
          {/* List Section */}
          <div style={{ width: '280px', borderRight: activeChat ? '1px solid #eee' : 'none', display: 'flex', flexDirection: 'column' }}>
            <div className="chat-search-box">
                <input 
                    type="text" 
                    placeholder="Search messages" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
            <div className="connections-list custom-scrollbar">
                {loading ? <div className="spinner-small" style={{ marginTop: '20px' }}></div> : (
                    filteredConnections.map((conn, idx) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            key={conn.id} 
                            className={`connection-chat-item ${activeChat?.id === conn.id ? 'active' : ''}`}
                            onClick={() => openChat(conn)}
                            style={{ backgroundColor: activeChat?.id === conn.id ? '#f3f2ef' : 'transparent' }}
                        >
                            {conn.otherUserAvatar ? (
                                <img src={`${IMAGE_BASE_URL}${conn.otherUserAvatar}`} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                            ) : (
                                <FontAwesomeIcon icon={faUserCircle} className="chat-avatar" />
                            )}
                            <div className="chat-item-info">
                                <div className="chat-item-name">{conn.otherUserName}</div>
                                <div className="chat-item-preview">Click to message</div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
          </div>

          {/* Active Chat Section */}
          <AnimatePresence>
          {activeChat && (
              <motion.div 
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '320px' }}
                exit={{ opacity: 0, width: 0 }}
                className="active-chat-window"
              >
                  <div className="active-chat-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FontAwesomeIcon icon={faChevronLeft} style={{ cursor: 'pointer', fontSize: '12px' }} onClick={() => setActiveChat(null)} />
                        <span style={{ fontWeight: 600 }}>{activeChat.otherUserName}</span>
                      </div>
                      <FontAwesomeIcon icon={faTimes} style={{ cursor: 'pointer' }} onClick={() => setActiveChat(null)} />
                  </div>
                  <div className="messages-list custom-scrollbar">
                      {(messages[activeChat.otherUserId] || []).map((msg, i) => (
                          <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={i} 
                            className={`message-bubble ${msg.senderId === user.id ? 'sent' : 'received'}`}
                          >
                              {msg.content}
                              <div className="message-time">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                          </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                  </div>
                  <form className="message-input-form" onSubmit={handleSendMessage}>
                      <input 
                        type="text" 
                        placeholder="Write a message..." 
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" disabled={!messageInput.trim()}><FontAwesomeIcon icon={faPaperPlane} /></button>
                  </form>
              </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

const faTimes = { prefix: 'fas', iconName: 'times', icon: [352, 512, [], "f00d", "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.19 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.19 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"] };

export default MessagingBar;
