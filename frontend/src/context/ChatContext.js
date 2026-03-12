import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from './UserContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useUser();
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState({}); // { recipientId: [messages] }
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!user || !user.id) return;

    let wsUrl = process.env.REACT_APP_CHAT_WS_URL || 'http://localhost:9191/ws-chat';
    
    const socket = new SockJS(wsUrl);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to Chat WS');
      setConnected(true);
      
      client.subscribe(`/user/${user.id}/queue/messages`, (message) => {
        const receivedMsg = JSON.parse(message.body);
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

  const sendMessage = (recipientId, content) => {
    if (stompClient && connected) {
      const chatMessage = {
        senderId: user.id,
        recipientId: recipientId,
        content: content,
        timestamp: new Date().toISOString()
      };

      stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(chatMessage)
      });

      // Add to local state
      setMessages(prev => {
        const currentChat = prev[recipientId] || [];
        return {
          ...prev,
          [recipientId]: [...currentChat, chatMessage]
        };
      });
    } else {
      console.error('Cannot send message: Not connected');
    }
  };

  const setChatHistory = (recipientId, history) => {
    setMessages(prev => ({
      ...prev,
      [recipientId]: history
    }));
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, connected, setChatHistory }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
