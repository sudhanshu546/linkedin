import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useUser } from '../context/UserContext';
import { getChatMessages } from '../api/chatApi';
import { getMyConnections } from '../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSearch, faPaperPlane, faUserCircle, faEllipsisH } from '@fortawesome/free-solid-svg-icons';

const MessagingPage = () => {
  const { user } = useUser();
  const { messages, sendMessage, setChatHistory, connected } = useChat();
  const [activeChat, setActiveChat] = useState(null);
  const [connections, setConnections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const fetchConnections = async () => {
    try {
      const res = await getMyConnections();
      const data = Array.isArray(res) ? res : (res?.result || []);
      setConnections(data);
      if (data.length > 0 && !activeChat) {
        handleOpenChat(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenChat = async (conn) => {
    const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
    const otherName = conn.requesterId === user.id ? 
        (conn.receiverName || 'User') : (conn.requesterName || 'User');
    
    setActiveChat({ id: otherId, name: otherName });
    
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

  const filteredConnections = connections.filter(c => {
    const name = c.requesterId === user.id ? c.receiverName : c.requesterName;
    return name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="page-layout two-column-layout" style={{ gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 80px)', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e0e0e0', overflow: 'hidden', padding: 0 }}>
      {/* Left Sidebar - Conversation List */}
      <aside style={{ borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Messaging</h3>
          <div style={{ display: 'flex', gap: '12px', color: '#666' }}>
            <FontAwesomeIcon icon={faEllipsisH} />
            <FontAwesomeIcon icon={faEdit} />
          </div>
        </div>
        <div style={{ padding: '8px 16px' }}>
          <div className="navbar-search-refined" style={{ width: '100%' }}>
            <FontAwesomeIcon icon={faSearch} style={{ color: '#666' }} />
            <input 
              type="text" 
              placeholder="Search messages" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredConnections.map(conn => {
            const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
            const otherName = conn.requesterId === user.id ? conn.receiverName : conn.requesterName;
            const isActive = activeChat?.id === otherId;
            return (
              <div 
                key={conn.id} 
                onClick={() => handleOpenChat(conn)}
                style={{ 
                  display: 'flex', 
                  padding: '12px 16px', 
                  gap: '12px', 
                  cursor: 'pointer',
                  backgroundColor: isActive ? '#f3f2ef' : 'transparent',
                  borderLeft: isActive ? '4px solid #057642' : '4px solid transparent'
                }}
              >
                <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '14px' }}>{otherName}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>Mar 12</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Click to view conversation
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main style={{ display: 'flex', flexDirection: 'column' }}>
        {activeChat ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0e0e0' }}>
              <h4 style={{ margin: 0 }}>{activeChat.name}</h4>
              <span style={{ fontSize: '12px', color: '#057642' }}>Online</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#f9fafb' }}>
              {(messages[activeChat.id] || []).map((msg, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexDirection: msg.senderId === user.id ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}>
                  <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8' }} />
                  <div style={{ 
                    maxWidth: '70%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    backgroundColor: msg.senderId === user.id ? '#eef3f8' : 'white',
                    border: msg.senderId === user.id ? 'none' : '1px solid #e0e0e0',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}>
                    {msg.content}
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '4px', textAlign: 'right' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #e0e0e0' }}>
              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Write a message..." 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  style={{ flex: 1, padding: '12px', borderRadius: '24px', border: '1px solid #666', outline: 'none' }}
                />
                <button 
                  type="submit" 
                  disabled={!messageInput.trim() || !connected}
                  className="btn-primary-round"
                  style={{ height: '40px', width: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}
                >
                  <FontAwesomeIcon icon={faPaperPlane} style={{ marginLeft: '4px' }} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#666' }}>
            Select a connection to start messaging
          </div>
        )}
      </main>
    </div>
  );
};

export default MessagingPage;
