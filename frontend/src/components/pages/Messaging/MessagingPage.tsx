import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useChat } from '../../../context/ChatContext';
import { useUser } from '../../../context/UserContext';
import { getChatMessages } from '../../../api/chatApi';
import { getMyConnections } from '../../../api/profileApi';
import { getUserById } from '../../../api/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSearch, faUserCircle, faEllipsisH, faCircle, faPaperPlane, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { IMAGE_BASE_URL } from '../../../constants/api';
import { motion, AnimatePresence } from 'framer-motion';

const MessagingPage: React.FC = () => {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const targetUserName = searchParams.get('userName');

  const { messages, sendMessage, markAsRead, setChatHistory, connected } = useChat();
  const [activeChat, setActiveChat] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const fetchInitialConnections = async () => {
      setLoadingConnections(true);
      try {
        const res = await getMyConnections();
        const connectionsList = Array.isArray(res) ? res : (res?.data || []);
        
        const detailedConnections = await Promise.all(connectionsList.map(async (conn: any) => {
            const otherId = conn.requesterId === user.id ? conn.receiverId : conn.requesterId;
            try {
                const userRes = await getUserById(otherId);
                return {
                    ...conn,
                    otherUserId: otherId,
                    otherUserName: `${userRes.firstName || ''} ${userRes.lastName || ''}`.trim() || 'LinkedIn User',
                    otherUserAvatar: userRes.profileImageUrl
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

  useEffect(() => {
    if (connections.length === 0) return;

    const openChat = async (otherId: string, otherName: string, avatar?: string) => {
      setActiveChat({ id: otherId, name: otherName, avatar });
      try {
        const history = await getChatMessages(otherId);
        setChatHistory(otherId, history);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      }
    };

    if (targetUserId && (!activeChat || activeChat.id !== targetUserId)) {
      const existingConn = connections.find((c: any) => c.otherUserId === targetUserId);
      if (existingConn) {
        openChat(existingConn.otherUserId, existingConn.otherUserName, existingConn.otherUserAvatar);
      } else if (targetUserName) {
        openChat(targetUserId, targetUserName);
      }
    } else if (!activeChat && connections.length > 0) {
      const firstConn = connections[0];
      openChat(firstConn.otherUserId, firstConn.otherUserName, firstConn.otherUserAvatar);
    }
  }, [connections, targetUserId, targetUserName, setChatHistory, activeChat]);

  const handleOpenChat = useCallback(async (conn: any) => {
    setActiveChat({ id: conn.otherUserId, name: conn.otherUserName, avatar: conn.otherUserAvatar });
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
    if (!messageInput.trim() || !activeChat) return;
    sendMessage(activeChat.id, messageInput);
    setMessageInput('');
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url}`;
  };

  const filteredConnections = connections.filter(c => 
    c.otherUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-layout" style={{ maxWidth: '1128px', padding: '0 12px' }}>
      <div className="messaging-main-modern" style={{ 
        display: 'grid', 
        gridTemplateColumns: '320px 1fr', 
        height: 'calc(100vh - 84px)', 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '1px solid var(--linkedin-border)'
      }}>
        {/* Left Sidebar */}
        <aside style={{ borderRight: '1px solid var(--linkedin-border)', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--linkedin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Messaging</h3>
            <div style={{ display: 'flex', gap: '16px', color: '#666' }}>
              <FontAwesomeIcon icon={faEllipsisH} style={{ cursor: 'pointer' }} />
              <FontAwesomeIcon icon={faEdit} style={{ cursor: 'pointer' }} />
            </div>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <div className="navbar-search-refined" style={{ width: '100%', borderRadius: '4px' }}>
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
          <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
            {loadingConnections ? (
                <div style={{ padding: '40px', textAlign: 'center' }}><div className="spinner-small"></div></div>
            ) : (
                <AnimatePresence>
                    {filteredConnections.map((conn, idx) => {
                        const isActive = activeChat?.id === conn.otherUserId;
                        const chatMessages = messages[conn.otherUserId] || [];
                        const lastMessage = chatMessages[chatMessages.length - 1];
                        const hasUnread = chatMessages.some((msg: any) => msg.senderId !== user?.id && !msg.isRead);

                        return (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={conn.otherUserId} 
                            onClick={() => handleOpenChat(conn)}
                            className={`chat-connection-item ${isActive ? 'active' : ''}`}
                            style={{ 
                                display: 'flex', 
                                padding: '12px 16px', 
                                gap: '12px', 
                                cursor: 'pointer',
                                position: 'relative'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                {conn.otherUserAvatar ? (
                                    <img 
                                        src={getImageUrl(conn.otherUserAvatar) || ''} 
                                        alt={conn.otherUserName} 
                                        style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '54px', color: '#adb3b8' }} />
                                )}
                                <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#057642', border: '2px solid white' }}></div>
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong style={{ fontSize: '14px', color: 'rgba(0,0,0,0.9)', fontWeight: hasUnread ? '600' : '500' }}>{conn.otherUserName}</strong>
                                <span style={{ fontSize: '12px', color: hasUnread ? '#0a66c2' : '#666' }}>
                                    {lastMessage ? new Date(lastMessage.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                </span>
                            </div>
                            <div style={{ 
                                fontSize: '13px', 
                                color: hasUnread ? 'rgba(0,0,0,0.9)' : '#666', 
                                fontWeight: hasUnread ? '600' : '400',
                                marginTop: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                    {lastMessage ? lastMessage.content : 'New connection'}
                                </span>
                                {hasUnread && <FontAwesomeIcon icon={faCircle} style={{ fontSize: '10px', color: '#0a66c2' }} />}
                            </div>
                            </div>
                        </motion.div>
                        );
                    })}
                </AnimatePresence>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div 
              key={activeChat.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--linkedin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{activeChat.name}</h4>
                        <span style={{ fontSize: '12px', color: '#057642', fontWeight: 500 }}>Available on mobile</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: '#666' }}>
                        <FontAwesomeIcon icon={faEllipsisH} style={{ cursor: 'pointer' }} />
                    </div>
                </div>

                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fff' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        {activeChat.avatar ? (
                            <img src={getImageUrl(activeChat.avatar) || ''} alt="" style={{ width: '72px', height: '72px', borderRadius: '50%', marginBottom: '12px' }} />
                        ) : (
                            <FontAwesomeIcon icon={faUserCircle} style={{ fontSize: '72px', color: '#adb3b8', marginBottom: '12px' }} />
                        )}
                        <h3 style={{ margin: 0 }}>{activeChat.name}</h3>
                        <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>LinkedIn Member</p>
                    </div>

                    {(messages[activeChat.id] || []).map((msg: any, idx: number) => {
                        const isMe = user && msg.senderId === user.id;
                        return (
                            <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                key={idx} 
                                style={{ 
                                    display: 'flex', 
                                    marginBottom: '4px',
                                    justifyContent: isMe ? 'flex-end' : 'flex-start'
                                }}
                            >
                                <div className={`message-bubble-modern ${isMe ? 'sent' : 'received'}`}>
                                    {msg.content}
                                    <div style={{ fontSize: '10px', color: '#666', marginTop: '6px', textAlign: isMe ? 'right' : 'left' }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid var(--linkedin-border)' }}>
                    <form onSubmit={handleSendMessage} style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        backgroundColor: '#f3f2ef',
                        borderRadius: '12px',
                        padding: '12px'
                    }}>
                        <textarea 
                            placeholder="Write a message..." 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            style={{ 
                                border: 'none', 
                                background: 'none', 
                                outline: 'none', 
                                resize: 'none', 
                                width: '100%',
                                minHeight: '60px',
                                fontSize: '14px',
                                fontFamily: 'inherit'
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button 
                                type="submit" 
                                disabled={!messageInput.trim() || !connected}
                                className="btn-primary-round"
                                style={{ padding: '4px 16px', opacity: messageInput.trim() ? 1 : 0.5 }}
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
          ) : (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#666', padding: '40px', textAlign: 'center' }}
            >
                <div style={{ width: '200px', height: '200px', backgroundColor: '#f3f2ef', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <FontAwesomeIcon icon={faPaperPlane} style={{ fontSize: '64px', color: '#cbd0d3' }} />
                </div>
                <h3>Your messages</h3>
                <p>Send a message to a connection to start a conversation.</p>
            </motion.div>
          )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default MessagingPage;
