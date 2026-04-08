import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './UserContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { markMessagesAsRead, getOnlineUsers } from '../api/chatApi';
import { ChatMessage } from '../types';

interface ChatContextType {
  messages: Record<string, ChatMessage[]>;
  sendMessage: (recipientId: string, content: string) => void;
  markAsRead: (senderId: string) => Promise<void>;
  sendTyping: (recipientId: string, typing: boolean) => void;
  sendReadReceipt: (senderId: string, messageId?: string) => void;
  onlineUsers: Set<string>;
  typingStatus: Record<string, boolean>;
  connected: boolean;
  setChatHistory: (recipientId: string, history: ChatMessage[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({}); 
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingStatus, setTypingStatus] = useState<Record<string, boolean>>({});

  const connect = useCallback(() => {
    if (!user || !user.id) return;

    const token = localStorage.getItem('accessToken');
    let wsUrl = process.env.REACT_APP_CHAT_WS_URL || 'http://localhost:9191/ws-chat';
    
    if (token) {
        wsUrl += `?access_token=${token}`;
    }

    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        'Authorization': `Bearer ${token}`
      },
      debug: (str) => {
        // console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to Chat WS');
      setConnected(true);
      
      // Fetch initial online users
      getOnlineUsers().then(users => {
          if (users) {
              setOnlineUsers(new Set(users));
          }
      }).catch(err => {
          console.error("Failed to fetch initial online users:", err);
      });
      
      // Subscribe to messages
      client.subscribe(`/user/${user.id}/queue/messages`, (message) => {
        const receivedMsg: ChatMessage = JSON.parse(message.body);
        console.log('Received message:', receivedMsg);
        
        setMessages(prev => {
          const otherId = receivedMsg.senderId;
          const currentChat = prev[otherId] || [];
          return {
            ...prev,
            [otherId]: [...currentChat, receivedMsg]
          };
        });
      });

      // Subscribe to events (typing, read receipts)
      client.subscribe(`/user/${user.id}/queue/events`, (message) => {
          const event = JSON.parse(message.body);
          if (event.type === 'TYPING') {
              setTypingStatus(prev => ({ ...prev, [event.senderId]: event.typing }));
          } else if (event.type === 'READ_RECEIPT') {
              setMessages(prev => {
                  const otherId = event.recipientId; // recipient of the receipt is the sender of messages
                  const currentChat = prev[otherId] || [];
                  return {
                      ...prev,
                      [otherId]: currentChat.map(m => ({ ...m, isRead: true }))
                  };
              });
          }
      });

      // Subscribe to global presence
      client.subscribe('/topic/presence', (message) => {
          const event = JSON.parse(message.body);
          if (event.type === 'PRESENCE') {
              setOnlineUsers(prev => {
                  const next = new Set(prev);
                  if (event.online) next.add(event.senderId);
                  else next.delete(event.senderId);
                  return next;
              });
          }
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    client.onDisconnect = () => {
      console.log('Disconnected from Chat WS');
      setConnected(false);
    };

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [user]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
    };
  }, [connect]);

  const sendMessage = (recipientId: string, content: string) => {
    console.log('Attempting to send message to:', recipientId, 'Content:', content);
    if (stompClient && connected && user) {
      try {
        const chatMessage: ChatMessage = {
          senderId: user.id,
          recipientId: recipientId,
          content: content,
          isRead: false,
          timestamp: new Date().toISOString()
        };

        stompClient.publish({
          destination: '/app/chat',
          body: JSON.stringify(chatMessage)
        });

        console.log('Message published successfully');

        // Add to local state
        setMessages(prev => {
          const currentChat = prev[recipientId] || [];
          return {
            ...prev,
            [recipientId]: [...currentChat, chatMessage]
          };
        });
      } catch (err) {
        console.error('Error publishing message:', err);
      }
    } else {
      console.error('Cannot send message: STOMP client status:', { stompClient: !!stompClient, connected });
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!user) return;
    try {
      await markMessagesAsRead(senderId);
      setMessages(prev => {
        const currentChat = prev[senderId] || [];
        const updatedChat = currentChat.map(msg => ({
          ...msg,
          isRead: msg.recipientId === user.id ? true : msg.isRead
        }));
        return {
          ...prev,
          [senderId]: updatedChat
        };
      });
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const setChatHistory = (recipientId: string, history: ChatMessage[]) => {
    setMessages(prev => ({
      ...prev,
      [recipientId]: history
    }));
  };

  const sendTyping = (recipientId: string, typing: boolean) => {
      if (stompClient && connected && user) {
          stompClient.publish({
              destination: '/app/typing',
              body: JSON.stringify({
                  type: 'TYPING',
                  senderId: user.id,
                  recipientId,
                  typing,
                  timestamp: Date.now()
              })
          });
      }
  };

  const sendReadReceipt = (senderId: string, messageId?: string) => {
      if (stompClient && connected && user) {
          stompClient.publish({
              destination: '/app/read-receipt',
              body: JSON.stringify({
                  type: 'READ_RECEIPT',
                  senderId: user.id, // I am the one who read it
                  recipientId: senderId, // person who sent the message
                  messageId,
                  timestamp: Date.now()
              })
          });
      }
  };

  return (
    <ChatContext.Provider value={{ 
        messages, 
        sendMessage, 
        markAsRead, 
        sendTyping, 
        sendReadReceipt,
        onlineUsers, 
        typingStatus,
        connected, 
        setChatHistory 
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
