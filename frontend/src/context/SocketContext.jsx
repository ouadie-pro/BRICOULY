import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('newMessage', (message) => {
      setConversations(prev => {
        const exists = prev.find(c => c.conversationId === message.conversationId);
        if (exists) {
          return prev.map(c => 
            c.conversationId === message.conversationId 
              ? { ...c, lastMessage: message.content, lastMessageTime: message.createdAt, unread: c.unread + 1 }
              : c
          );
        }
        return [{
          conversationId: message.conversationId,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unread: 1,
          userId: message.senderId,
          userName: message.senderName,
          userAvatar: message.senderAvatar
        }, ...prev];
      });
    });

    newSocket.on('userTyping', ({ userId, userName, conversationId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), { userId, userName }]
      }));
    });

    newSocket.on('userStoppedTyping', ({ userId, conversationId }) => {
      setTypingUsers(prev => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter(u => u.userId !== userId)
      }));
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const joinConversation = useCallback((conversationId) => {
    if (socket) {
      socket.emit('joinConversation', conversationId);
    }
  }, [socket]);

  const leaveConversation = useCallback((conversationId) => {
    if (socket) {
      socket.emit('leaveConversation', conversationId);
    }
  }, [socket]);

  const sendTyping = useCallback((conversationId) => {
    if (socket) {
      socket.emit('typing', { conversationId });
    }
  }, [socket]);

  const sendStopTyping = useCallback((conversationId) => {
    if (socket) {
      socket.emit('stopTyping', { conversationId });
    }
  }, [socket]);

  const onNewMessage = useCallback((callback) => {
    if (socket) {
      socket.on('newMessage', callback);
      return () => socket.off('newMessage', callback);
    }
  }, [socket]);

  const value = {
    socket,
    connected,
    conversations,
    typingUsers,
    joinConversation,
    leaveConversation,
    sendTyping,
    sendStopTyping,
    onNewMessage,
    setConversations
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;