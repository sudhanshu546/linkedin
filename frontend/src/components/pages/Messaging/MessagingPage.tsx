import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChat } from '../../../context/ChatContext';
import { useUser } from '../../../context/UserContext';
import { getChatMessages } from '../../../api/chatApi';
import { getMyConnections } from '../../../api/profileApi';
import { getUserById } from '../../../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSearch, faUserCircle, faEllipsisH, faCircle, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { IMAGE_BASE_URL } from '../../../constants/api';

const MessagingPage: React.FC = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const targetUserName = searchParams.get('userName');

  const { messages, sendMessage, markAsRead, setChatHistory, connected } = useChat();
  const [activeChat, setActiveChat] = useState<{ id: string; name: string } | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effect 1: Fetch initial connections list once and enrich with user details
  useEffect(() => {
    if (!user) return;
    const fetchInitialConnections = async () => {
      setLoadingConnections(true);
      try {
        const res = await getMyConnections();
        const connectionsList = Array.isArray(res) ? res : (res?.data || []);
        
        // Enrich connections with real user details if names are missing
        const detailedConnections = await Promise.all(connectionsList.map(async (conn: any) => {
            const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
            try {
                const userRes = await getUserById(otherId);
                const otherUser = userRes;
                return {
                    ...conn,
                    otherUserId: otherId,
                    otherUserName: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || 'LinkedIn User',
                    otherUserAvatar: otherUser.profileImageUrl
                };
            } catch (e) {
                return { 
                    ...conn, 
                    otherUserId: otherId, 
                    otherUserName: conn.requesterId === user.id ? (conn.receiverName || 'LinkedIn User') : (conn.requesterName || 'LinkedIn User')
                };
            }
        }));

        setConnections(detailedConnections);
      } catch (err) {
        console.error('Failed to fetch connections:', err);
      } finally {
        setLoadingConnections(false);
      }
    };
    fetchInitialConnections();
  }, [user]);

  // Effect 2: Handle opening a chat from URL param or default to first connection
  useEffect(() => {
    if (connections.length === 0) return;

    const openChat = async (otherId: string, otherName: string) => {
      setActiveChat({ id: otherId, name: otherName });
      try {
        const history = await getChatMessages(otherId);
        setChatHistory(otherId, history);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };

    if (targetUserId && !activeChat) {
      const existingConn = connections.find((c: any) => 
          c.otherUserId === targetUserId
      );
      if (existingConn) {
        openChat(existingConn.otherUserId, existingConn.otherUserName);
      } else if (targetUserName) {
        openChat(targetUserId, targetUserName);
      }
    } else if (!activeChat && connections.length > 0) {
      // Default to opening the first connection if none is active
      const firstConn = connections[0];
      openChat(firstConn.otherUserId, firstConn.otherUserName);
    }
  }, [connections, targetUserId, targetUserName, setChatHistory, activeChat]);


  const handleOpenChat = useCallback(async (conn: any) => {
    setActiveChat({ id: conn.otherUserId, name: conn.otherUserName });
    try {
        const history = await getChatMessages(conn.otherUserId);
        setChatHistory(conn.otherUserId, history);
    } catch (err) {
        console.error('Failed to fetch chat history:', err);
    }
  }, [setChatHistory]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
    if (activeChat && user) {
        const chatMessages = messages[activeChat.id] || [];
        const hasUnread = chatMessages.some((msg: any) => msg.senderId !== user.id && !msg.isRead);
        if (hasUnread) {
            markAsRead(activeChat.id);
        }
    }
  }, [messages, activeChat, user, markAsRead]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!messageInput.trim() || !activeChat) {
        return;
    }
    
    sendMessage(activeChat.id, messageInput);
    setMessageInput('');
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const filteredConnections = connections.filter(c => {
    return c.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase());
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
              placeholder="Search connections" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConnections ? (
              <div style={{ padding: '20px', textAlign: 'center' }}><div className="spinner-small"></div></div>
          ) : filteredConnections.map(conn => {
            const isActive = activeChat?.id === conn.otherUserId;
            const chatMessages = messages[conn.otherUserId] || [];
            const lastMessage = chatMessages[chatMessages.length - 1];
            const hasUnread = chatMessages.some((msg: any) => msg.senderId !== user?.id && !msg.isRead);

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
                  borderLeft: isActive ? '4px solid #057642' : '4px solid transparent',
                  position: 'relative'
                }}
              >
                {conn.otherUserAvatar ? (
                    <img 
                        src={getImageUrl(conn.otherUserAvatar) || ''} 
                        alt={conn.otherUserName} 
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                ) : (
                    <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '48px', color: '#adb3b8' }} />
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: hasUnread ? '#000' : '#666', fontWeight: hasUnread ? '600' : 'normal' }}>{conn.otherUserName}</strong>
                    <span style={{ fontSize: '12px', color: hasUnread ? '#0a66c2' : '#666', fontWeight: hasUnread ? '600' : 'normal' }}>
                        {lastMessage ? new Date(lastMessage.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    color: hasUnread ? '#000' : '#666', 
                    fontWeight: hasUnread ? '600' : 'normal',
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{lastMessage ? lastMessage.content : 'Click to message'}</span>
                    {hasUnread && <FontAwesomeIcon icon={faCircle} style={{ fontSize: '8px', color: '#0a66c2' }} />}
                  </div>
                </div>
              </div>
            );
          })}
          {!loadingConnections && filteredConnections.length === 0 && (
             <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                {searchQuery ? 'No connections found' : 'No connections to message yet'}
             </div>
          )}
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
              {(messages[activeChat.id] || []).map((msg: any, idx: number) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  flexDirection: user && msg.senderId === user.id ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}>
                  {msg.senderId === user?.id ? (
                      user.profileImageUrl ? (
                          <img src={getImageUrl(user.profileImageUrl)} alt="Me" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8' }} />
                  ) : (
                      <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '32px', color: '#adb3b8' }} />
                  )}
                  <div style={{ 
                    maxWidth: '70%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    backgroundColor: user && msg.senderId === user.id ? '#eef3f8' : 'white',
                    border: user && msg.senderId === user.id ? 'none' : '1px solid #e0e0e0',
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
                  style={{ height: '40px', width: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
