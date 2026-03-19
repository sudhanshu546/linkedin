import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from './UserContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { markMessagesAsRead } from '../api/chatApi';
import { ChatMessage } from '../types';

interface ChatContextType {
  messages: Record<string, ChatMessage[]>;
  sendMessage: (recipientId: string, content: string) => void;
  markAsRead: (senderId: string) => Promise<void>;
  connected: boolean;
  setChatHistory: (recipientId: string, history: ChatMessage[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({}); 
  const [connected, setConnected] = useState(false);

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

  return (
    <ChatContext.Provider value={{ messages, sendMessage, markAsRead, connected, setChatHistory }}>
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
