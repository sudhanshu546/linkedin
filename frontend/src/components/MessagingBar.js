import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';
import { getChatMessages } from '../api/chatApi';
import { getMyConnections } from '../api/profileApi';
import { getUserById } from '../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faEdit, faSearch, faTimes, faPaperPlane, faUserCircle } from '@fortawesome/free-solid-svg-icons';

const MessagingBar = () => {
  const { user } = useUser();
  const { messages, sendMessage, setChatHistory, connected } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null); 
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Draggable state
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 }); 
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const dragThreshold = 5;

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    try {
      const res = await getMyConnections();
      const connectionsList = Array.isArray(res) ? res : (res?.result || []);
      
      const detailedConnections = await Promise.all(connectionsList.map(async (conn) => {
          const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
          try {
              const userRes = await getUserById(otherId);
              const otherUser = userRes.result;
              return {
                  ...conn,
                  otherUserId: otherId,
                  otherUserName: `${otherUser.firstName} ${otherUser.lastName}`,
                  otherUserAvatar: otherUser.profileImageUrl
              };
          } catch (e) {
              return { ...conn, otherUserId: otherId, otherUserName: 'LinkedIn User' };
          }
      }));

      setConnections(detailedConnections);
    } catch (err) {
      console.error('Failed to fetch connections for chat:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat, scrollToBottom]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.header-right') || e.target.closest('.header-icon')) return;
    
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const deltaX = Math.abs(e.clientX - (dragStart.x + position.x));
    const deltaY = Math.abs(e.clientY - (dragStart.y + position.y));
    
    if (deltaX > dragThreshold || deltaY > dragThreshold) {
        setHasMoved(true);
    }

    let nextX = e.clientX - dragStart.x;
    let nextY = e.clientY - dragStart.y;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const rect = containerRef.current.getBoundingClientRect();
    const barWidth = rect.width;
    
    const expandedHeight = isOpen ? rect.height : 450; 
    const initialRightOffset = 20;
    const initialBottomOffset = 0;
    
    const minX = -(viewportWidth - barWidth - initialRightOffset);
    const maxX = initialRightOffset;
    
    const minY = -(viewportHeight - expandedHeight - 52); 
    const maxY = initialBottomOffset;

    nextX = Math.min(Math.max(nextX, minX), maxX);
    nextY = Math.min(Math.max(nextY, minY), maxY);
    
    setPosition({ x: nextX, y: nextY });
  }, [isDragging, dragStart, position.x, position.y, isOpen]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
        if (!hasMoved) {
            setIsOpen(prev => !prev);
        }
        setIsDragging(false);
    }
  }, [isDragging, hasMoved]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleOpenChat = async (conn) => {
    setActiveChat({ id: conn.otherUserId, name: conn.otherUserName });
    try {
      const res = await getChatMessages(conn.otherUserId);
      setChatHistory(conn.otherUserId, res.result || []);
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;
    sendMessage(activeChat.id, messageInput);
    setMessageInput('');
  };

  if (!user) return null;

  const filteredConnections = connections.filter(c => {
    const name = c.otherUserName;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const dragStyle = {
    transform: `translate(${position.x}px, ${position.y}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)',
    zIndex: 9999
  };

  return (
    <div 
        ref={containerRef}
        className={`messaging-bar-container ${isOpen ? 'expanded' : ''}`}
        style={dragStyle}
    >
      <div 
        className="messaging-header" 
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <div className="header-left">
          <div className="user-status-dot"></div>
          <span>Messaging</span>
        </div>
        <div className="header-right">
          <FontAwesomeIcon icon={faSearch} className="header-icon" />
          <FontAwesomeIcon icon={faEdit} className="header-icon" />
          <FontAwesomeIcon 
            icon={isOpen ? faChevronDown : faChevronUp} 
            className="header-icon" 
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
            }} 
          />
        </div>
      </div>

      {isOpen && (
        <div className="messaging-content">
          {!activeChat ? (
            <>
              <div className="chat-search-box">
                <input 
                  type="text" 
                  placeholder="Search messages" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="connections-list">
                {filteredConnections.length > 0 ? (
                  filteredConnections.map(conn => (
                    <div key={conn.id} className="connection-chat-item" onClick={() => handleOpenChat(conn)}>
                      {conn.otherUserAvatar ? (
                          <img src={`http://localhost:9191/us/uploads/${conn.otherUserAvatar}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                          <FontAwesomeIcon icon={faUserCircle} className="chat-avatar" />
                      )}
                      <div className="chat-item-info">
                        <div className="chat-item-name">{conn.otherUserName}</div>
                        <div className="chat-item-preview">Click to start chatting</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-chats">No connections found</div>
                )}
              </div>
            </>
          ) : (
            <div className="active-chat-window">
              <div className="active-chat-header">
                <span onClick={() => setActiveChat(null)} style={{ cursor: 'pointer', fontWeight: 600 }}>
                  ← {activeChat.name}
                </span>
                <FontAwesomeIcon icon={faTimes} onClick={() => setActiveChat(null)} style={{ cursor: 'pointer' }} />
              </div>
              <div className="messages-list">
                {(messages[activeChat.id] || []).map((msg, idx) => (
                  <div key={idx} className={`message-bubble ${msg.senderId === user.id ? 'sent' : 'received'}`}>
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  placeholder="Write a message..." 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                />
                <button type="submit" disabled={!messageInput.trim() || !connected}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagingBar;
