// frontend/src/components/MessagesScreen.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { io } from 'socket.io-client';
import { useToast } from '../context/ToastContext';
import { 
  FiX, FiImage, FiVideo, FiMic, FiSend, FiPhone, FiInfo, FiMessageCircle,
  FiArrowLeft, FiVolume2, FiSearch, FiCheck, FiClock, FiCalendar,
  FiMapPin, FiDollarSign, FiStar, FiCheckCircle, FiAlertCircle,
  FiLoader, FiMoreVertical
} from 'react-icons/fi';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const getMessagePreview = (msg) => {
  const text = msg.content || msg.text || '';
  
  if (msg.type === 'image') return '📷 Photo';
  if (msg.type === 'video') return '🎥 Video';
  if (msg.type === 'voice') return '🎙️ Voice message';
  
  return text || '📎 Media';
};

const BookingContextCard = ({ booking, onViewBooking }) => {
  if (!booking) return null;
  
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    accepted: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    in_progress: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };
  
  const statusIcons = {
    pending: '⏳',
    accepted: '✓',
    confirmed: '✅',
    in_progress: '🔄',
    completed: '🎉',
    cancelled: '❌'
  };
  
  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FiCalendar className="text-slate-400 text-sm" />
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {new Date(booking.date).toLocaleDateString()} at {booking.time}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[booking.status] || statusColors.pending}`}>
          <span>{statusIcons[booking.status] || '📋'}</span>
          {booking.status}
        </span>
      </div>
      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{booking.service}</p>
      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <FiDollarSign className="text-xs" />
          <span>{booking.price} MAD</span>
        </div>
        {booking.address && (
          <div className="flex items-center gap-1">
            <FiMapPin className="text-xs" />
            <span className="truncate max-w-[150px]">{booking.address}</span>
          </div>
        )}
      </div>
      <button
        onClick={onViewBooking}
        className="mt-2 w-full py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      >
        View Booking Details
      </button>
    </div>
  );
};

export default function MessagesScreen({ isDesktop }) {
  const { providerId } = useParams();
  const [searchParams] = useSearchParams();
  const initialBookingId = searchParams.get('bookingId');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState(null);
  const [booking, setBooking] = useState(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [socket, setSocket] = useState(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const typingTimeoutRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Socket.IO setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = currentUser.id;
    
    if (token && userId) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
        auth: { token },
        transports: ['websocket']
      });
      
      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO');
        if (userId) newSocket.emit('join', userId);
      });
      
      newSocket.on('newMessage', (message) => {
        if (providerId && (
          (message.senderId === providerId && message.receiverId === currentUser.id) ||
          (message.senderId === currentUser.id && message.receiverId === providerId)
        )) {
          setMessages(prev => [...prev, message]);
          setTimeout(scrollToBottom, 100);
        }
        updateConversationList(message);
      });

      newSocket.on('userTyping', ({ fromUserId }) => {
        if (String(fromUserId) === String(providerId)) setIsOtherTyping(true);
      });
      
      newSocket.on('userStoppedTyping', ({ fromUserId }) => {
        if (String(fromUserId) === String(providerId)) setIsOtherTyping(false);
      });
      
      newSocket.on('messagesRead', ({ by, conversationWith }) => {
        if (String(by) === String(providerId)) {
          setMessages(prev => prev.map(m => ({ ...m, read: true })));
        }
      });
      
      newSocket.on('messageSeen', ({ messageId }) => {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, seen: true } : m));
      });
      
      newSocket.on('onlineUsers', (users) => {
        setIsOnline(users.includes(String(providerId)));
      });
      
      newSocket.on('booking_status_update', (data) => {
        if (booking?._id === data.bookingId) {
          setBooking(prev => ({ ...prev, status: data.status }));
          showToast(data.message, 'info');
        }
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.close();
      };
    }
  }, [currentUser.id, providerId]);

  // Load conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.getConversations();
        setConversations(Array.isArray(data) ? data : []);
        const unread = (Array.isArray(data) ? data : []).reduce((sum, c) => sum + (c.unread || 0), 0);
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load user and booking data
  useEffect(() => {
    if (providerId) {
      const loadChatData = async () => {
        setLoading(true);
        try {
          // Fetch user info
          let userData = await api.getProvider(providerId).catch(() => null);
          if (!userData || userData.error) {
            userData = await api.getUser(providerId).catch(() => null);
          }
          setUser(userData);
          
          // Fetch booking if bookingId is present
          if (initialBookingId) {
            try {
              const bookingData = await api.getBookingById(initialBookingId);
              if (bookingData.success) {
                setBooking(bookingData.booking);
              }
            } catch (err) {
              console.error('Error fetching booking:', err);
            }
          }
          
          // Mark messages as read
          await api.markMessagesAsRead(providerId);
        } catch (error) {
          console.error('Error loading chat:', error);
        } finally {
          setLoading(false);
        }
      };
      loadChatData();
    } else {
      setLoading(false);
    }
  }, [providerId, initialBookingId]);

  // Load messages with pagination
  const loadMessages = useCallback(async (reset = true, page = 1) => {
    if (!providerId) return;
    setLoadingMessages(true);
    try {
      const result = await api.getMessages(providerId, page);
      const messagesData = result.data || [];
      setHasMoreMessages(result.pagination?.pages > page);
      setMessagePage(page);
      
      if (reset) {
        setMessages(messagesData);
      } else {
        setMessages(prev => [...messagesData, ...prev]);
      }
      
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId) {
      loadMessages(true, 1);
    }
  }, [providerId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const updateConversationList = (message) => {
    setConversations(prev => {
      const existingConv = prev.find(c => c.userId === message.senderId || c.userId === message.receiverId);
      const updatedConv = existingConv ? {
        ...existingConv,
        lastMessage: message.content || (message.type === 'image' ? '📷 Photo' : message.type === 'video' ? '🎥 Video' : '[Media]'),
        lastMessageTime: message.createdAt,
        unread: message.senderId !== currentUser.id ? (existingConv.unread || 0) + 1 : existingConv.unread
      } : null;
      
      if (updatedConv) {
        return [updatedConv, ...prev.filter(c => c.userId !== updatedConv.userId)];
      }
      return prev;
    });
    
    if (message.senderId !== currentUser.id) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaPreview) || !providerId) return;

    clearTimeout(typingTimeoutRef.current);
    socket?.emit('stopTyping', { fromUserId: currentUser.id, toUserId: providerId });

    if (mediaPreview) {
      try {
        const uploadResult = await api.uploadMessageMedia(mediaPreview.file);
        if (uploadResult.success) {
          const messageData = {
            receiverId: providerId,
            content: newMessage,
            type: mediaPreview.type.startsWith('image/') ? 'image' : 'video',
            mediaUrl: uploadResult.filePath,
            bookingId: booking?._id
          };
          
          if (socket) {
            socket.emit('send_message', messageData);
          } else {
            await api.sendMessage(providerId, newMessage, uploadResult.filePath, null, messageData.type, booking?._id);
          }
          
          const tempMessage = {
            id: Date.now().toString(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            content: newMessage,
            type: messageData.type,
            mediaUrl: uploadResult.filePath,
            createdAt: new Date().toISOString(),
            read: false
          };
          setMessages(prev => [...prev, tempMessage]);
        }
      } catch (err) {
        console.error('Error sending media:', err);
        showToast('Failed to send media', 'error');
      }
      setMediaPreview(null);
      setNewMessage('');
    } else if (newMessage.trim()) {
      const messageData = {
        receiverId: providerId,
        content: newMessage,
        type: 'text',
        bookingId: booking?._id
      };
      
      if (socket) {
        socket.emit('send_message', messageData);
      } else {
        await api.sendMessage(providerId, newMessage, null, null, 'text', booking?._id);
      }
      
      const tempMessage = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        senderName: currentUser.name,
        content: newMessage,
        type: 'text',
        createdAt: new Date().toISOString(),
        read: false
      };
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage('');
    }
  };

  const handleTyping = (isTyping) => {
    socket?.emit(isTyping ? 'typing' : 'stopTyping', {
      fromUserId: currentUser.id,
      toUserId: providerId
    });
  };

  const onTyping = (e) => {
    setNewMessage(e.target.value);
    handleTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleTyping(false), 1500);
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview({ file, url: previewUrl, type: file.type });
      setShowMediaPicker(false);
    }
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview({ file, url: previewUrl, type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      showToast('Microphone access required for voice messages', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };

  const cancelMedia = () => {
    if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url);
    setMediaPreview(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSenderAvatar = (msg, isOwn) => {
    if (isOwn) return currentUser?.avatar;
    return msg.senderAvatar || user?.avatar;
  };

  const getSenderName = (msg, isOwn) => {
    if (isOwn) return currentUser?.name;
    return msg.senderName || user?.name;
  };

  const renderMessageContent = (msg) => {
    if (msg.type === 'image' && msg.mediaUrl) {
      return (
        <div className="max-w-[250px]">
          <img src={msg.mediaUrl} alt="Shared" className="rounded-lg max-h-[200px] object-cover cursor-pointer" onClick={() => window.open(msg.mediaUrl, '_blank')} />
          {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
        </div>
      );
    }
    if (msg.type === 'video' && msg.mediaUrl) {
      return (
        <div className="max-w-[250px]">
          <video src={msg.mediaUrl} controls className="rounded-lg max-h-[200px]" />
          {msg.content && <p className="mt-2 text-sm">{msg.content}</p>}
        </div>
      );
    }
    if (msg.type === 'voice' && msg.mediaUrl) {
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <audio src={msg.mediaUrl} controls className="h-8 flex-1" />
          {msg.content && <p className="text-sm ml-2">{msg.content}</p>}
        </div>
      );
    }
    return <p className="whitespace-pre-wrap break-words">{msg.content}</p>;
  };

  const handleViewBooking = () => {
    if (booking) navigate(`/bookings?id=${booking._id}`);
  };

  const ConversationItem = ({ conv }) => (
    <Link
      to={`/messages/${conv.userId}${conv.bookingInfo?.id ? `?bookingId=${conv.bookingInfo.id}` : ''}`}
      className={`flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors ${
        String(providerId) === String(conv.userId) ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
      }`}
    >
      {conv.userAvatar ? (
        <img src={conv.userAvatar} className="w-12 h-12 rounded-full object-cover" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{conv.userName?.charAt(0)?.toUpperCase() || '?'}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-slate-900 dark:text-white truncate">{conv.userName}</h3>
          <span className="text-xs text-slate-400 ml-2 shrink-0">{formatRelativeTime(conv.lastMessageTime)}</span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{getMessagePreview(conv)}</p>
        {conv.bookingInfo && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-400">📋 {conv.bookingInfo.service}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              conv.bookingInfo.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              conv.bookingInfo.status === 'confirmed' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {conv.bookingInfo.status}
            </span>
          </div>
        )}
      </div>
      {conv.unread > 0 && (
        <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center shrink-0">
          {conv.unread > 9 ? '9+' : conv.unread}
        </span>
      )}
    </Link>
  );

  const MessageBubble = ({ msg, index }) => {
    const isOwn = String(msg.senderId) === String(currentUser.id);
    const avatarUrl = getSenderAvatar(msg, isOwn);
    const senderName = getSenderName(msg, isOwn);
    const nextMsg = messages[index + 1];
    const isNextFromSameSender = nextMsg && String(nextMsg.senderId) === String(msg.senderId);
    const showAvatar = !isNextFromSameSender;

    return (
      <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn && showAvatar && (
          avatarUrl ? (
            <img src={avatarUrl} className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{senderName?.charAt(0) || '?'}</span>
            </div>
          )
        )}
        {!isOwn && !showAvatar && <div className="w-8 shrink-0" />}
        
        <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2.5 rounded-2xl ${
            isOwn 
              ? 'bg-blue-500 text-white rounded-br-sm' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm shadow-sm border border-slate-200 dark:border-slate-700'
          }`}>
            {renderMessageContent(msg)}
          </div>
          <div className={`flex items-center gap-1 mt-1 text-[10px] ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className={`${isOwn ? 'text-blue-400' : 'text-slate-400'}`}>
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isOwn && (
              <span className={msg.read ? 'text-blue-300' : 'text-blue-400'}>
                {msg.seen ? '✓✓' : msg.read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FiLoader className="animate-spin text-3xl text-blue-500" />
      </div>
    );
  }

  // Mobile Layout
  if (!isDesktop) {
    // Show conversation list on mobile when no conversation selected
    if (!providerId) {
      return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <h2 className="font-semibold text-slate-900 dark:text-white">Messages</h2>
          </header>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center">
                <FiMessageCircle className="text-4xl text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No conversations yet</p>
              </div>
            ) : (
              conversations.map(conv => <ConversationItem key={conv.userId} conv={conv} />)
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 -ml-2">
              <FiArrowLeft className="text-xl text-slate-600 dark:text-slate-400" />
            </button>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-white">{user?.name || 'Loading...'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {isOnline ? (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full" /> Online
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Offline</span>
                )}
                {booking && (
                  <span className="text-xs text-slate-400">• Booking #{booking._id?.slice(-6)}</span>
                )}
              </div>
            </div>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              <FiMoreVertical className="text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </header>

        {/* Booking Context Card */}
        {booking && <BookingContextCard booking={booking} onViewBooking={handleViewBooking} />}

        {/* Messages */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3" ref={messagesContainerRef}>
          {loadingMessages && messagePage > 1 && (
            <div className="text-center py-2">
              <FiLoader className="animate-spin text-blue-500 mx-auto" />
            </div>
          )}
          {messages.map((msg, idx) => <MessageBubble key={msg.id || msg._id} msg={msg} index={idx} />)}
          {isOtherTyping && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3">
          {mediaPreview && (
            <div className="relative inline-block mb-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              {mediaPreview.type.startsWith('image') && <img src={mediaPreview.url} className="h-16 rounded" />}
              {mediaPreview.type.startsWith('video') && <video src={mediaPreview.url} className="h-16 rounded" />}
              {mediaPreview.type.startsWith('audio') && <div className="flex items-center gap-2"><FiVolume2 /><span>Voice message</span></div>}
              <button onClick={cancelMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><FiX className="text-xs" /></button>
            </div>
          )}
          {isRecording && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 text-sm">{formatTime(recordingTime)}</span>
              <button onClick={stopRecording} className="ml-auto px-3 py-1 bg-red-500 text-white rounded-lg text-sm">Send</button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex gap-1">
              <button type="button" onClick={() => setShowMediaPicker(!showMediaPicker)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <FiImage className="text-xl" />
              </button>
              <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                <FiMic className="text-xl" />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
              <input
                type="text"
                value={newMessage}
                onChange={onTyping}
                placeholder="Type a message..."
                className="w-full bg-transparent border-none outline-none text-sm"
              />
            </div>
            <button type="submit" disabled={!newMessage.trim() && !mediaPreview} className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50">
              <FiSend className="text-xl" />
            </button>
          </form>
          {showMediaPicker && (
            <div className="absolute bottom-20 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-2 flex gap-2">
              <button onClick={() => imageInputRef.current?.click()} className="p-3 hover:bg-slate-100 rounded-lg">
                <FiImage className="text-green-500" />
                <span className="text-xs">Photo</span>
              </button>
              <button onClick={() => videoInputRef.current?.click()} className="p-3 hover:bg-slate-100 rounded-lg">
                <FiVideo className="text-purple-500" />
                <span className="text-xs">Video</span>
              </button>
              <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleMediaSelect} />
              <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={handleMediaSelect} />
            </div>
          )}
        </footer>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex gap-6 h-[calc(100vh-64px)] overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messages</h2>
          <div className="relative mt-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <FiMessageCircle className="text-4xl text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations
              .filter(c => !searchQuery || c.userName?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(conv => <ConversationItem key={conv.userId} conv={conv} />)
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {providerId && user ? (
          <>
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {user?.avatar ? (
                  <img src={user.avatar} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">{user?.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-white">{user?.name}</h2>
                  <div className="flex items-center gap-2">
                    {isOnline ? <span className="text-xs text-green-500">Online</span> : <span className="text-xs text-slate-400">Offline</span>}
                    {booking && <span className="text-xs text-slate-400">• Booking #{booking._id?.slice(-6)}</span>}
                  </div>
                </div>
              </div>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <FiInfo className="text-slate-500" />
              </button>
            </header>

            {booking && <BookingContextCard booking={booking} onViewBooking={handleViewBooking} />}

            <main className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages && messagePage > 1 && (
                <div className="text-center py-2"><FiLoader className="animate-spin text-blue-500 mx-auto" /></div>
              )}
              {messages.map((msg, idx) => <MessageBubble key={msg.id || msg._id} msg={msg} index={idx} />)}
              {isOtherTyping && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1"><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                  <span className="text-sm">Typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </main>

            <footer className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              {mediaPreview && (
                <div className="relative inline-block mb-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  {mediaPreview.type.startsWith('image') && <img src={mediaPreview.url} className="h-16 rounded" />}
                  {mediaPreview.type.startsWith('video') && <video src={mediaPreview.url} className="h-16 rounded" />}
                  <button onClick={cancelMedia} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><FiX className="text-xs" /></button>
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><FiImage /></button>
                  <button type="button" onClick={() => videoInputRef.current?.click()} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><FiVideo /></button>
                  <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}><FiMic /></button>
                </div>
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-2">
                  <input type="text" value={newMessage} onChange={onTyping} placeholder="Type a message..." className="w-full bg-transparent border-none outline-none text-sm" />
                </div>
                <button type="submit" disabled={!newMessage.trim() && !mediaPreview} className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50"><FiSend /></button>
              </form>
              <input type="file" ref={imageInputRef} accept="image/*" className="hidden" onChange={handleMediaSelect} />
              <input type="file" ref={videoInputRef} accept="video/*" className="hidden" onChange={handleMediaSelect} />
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiMessageCircle className="text-6xl text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}