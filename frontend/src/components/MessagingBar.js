import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';
import { getChatMessages } from '../api/chatApi';
import { getMyConnections } from '../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faEdit, faSearch, faTimes, faPaperPlane, faUserCircle } from '@fortawesome/free-solid-svg-icons';

const MessagingBar = () => {
  const { user } = useUser();
  const { messages, sendMessage, setChatHistory, connected } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null); // { id, name }
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const fetchConnections = async () => {
    try {
      const res = await getMyConnections();
      const data = Array.isArray(res) ? res : (res?.result || []);
      setConnections(data);
    } catch (err) {
      console.error('Failed to fetch connections for chat:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenChat = async (conn) => {
    // Determine the other person's details
    const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
    const otherName = conn.requesterId === user.id ? 
        (conn.receiverName || 'User') : (conn.requesterName || 'User');
    
    setActiveChat({ id: otherId, name: otherName });
    
    // Fetch history if not already loaded or to refresh
    try {
      const history = await getChatMessages(otherId);
      setChatHistory(otherId, history);
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
    const name = c.requesterId === user.id ? c.receiverName : c.requesterName;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={`messaging-bar-container ${isOpen ? 'expanded' : ''}`}>
      {/* Messaging Header */}
      <div className="messaging-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="header-left">
          <div className="user-status-dot"></div>
          <span>Messaging</span>
        </div>
        <div className="header-right">
          <FontAwesomeIcon icon={faSearch} className="header-icon" />
          <FontAwesomeIcon icon={faEdit} className="header-icon" />
          <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronUp} className="header-icon" />
        </div>
      </div>

      {isOpen && (
        <div className="messaging-content">
          {!activeChat ? (
            <>
              {/* Connection List */}
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
                  filteredConnections.map(conn => {
                    const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
                    const otherName = conn.requesterId === user.id ? conn.receiverName : conn.requesterName;
                    return (
                      <div key={conn.id} className="connection-chat-item" onClick={() => handleOpenChat(conn)}>
                        <FontAwesomeIcon icon={faUserCircle} className="chat-avatar" />
                        <div className="chat-item-info">
                          <div className="chat-item-name">{otherName}</div>
                          <div className="chat-item-preview">Click to start chatting</div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-chats">No connections found</div>
                )}
              </div>
            </>
          ) : (
            /* Active Chat Window */
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
