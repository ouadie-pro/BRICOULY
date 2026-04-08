import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FiX, FiImage, FiVideo, FiMic, FiSend, FiPhone, FiInfo, FiMessageCircle,
  FiArrowLeft, FiVolume2, FiSearch
} from 'react-icons/fi';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'À l\'instant';
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR');
};

const getMessagePreview = (msg) => {
  const text = msg.content || msg.text || '';
  
  if (msg.type === 'image') return '[Photo]';
  if (msg.type === 'video') return '[Vidéo]';
  if (msg.type === 'voice') return '[Audio]';
  
  return text || '[Média]';
};

export default function MessagesScreen({ isDesktop }) {
  const { providerId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [provider, setProvider] = useState(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await api.getConversations();
        const conversations = Array.isArray(data) ? data : [];
        setConversations(conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      }
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (providerId) {
      const loadChat = async () => {
        try {
          const msgs = await api.getMessages(providerId);
          // Handle both array (old format) and object with data (new format)
          const messagesArray = Array.isArray(msgs) ? msgs : (msgs?.data || []);
          setMessages(messagesArray || []);
          
          let providerData = await api.getProvider(providerId).catch(() => null);
          if (!providerData || providerData.error) {
            providerData = await api.getUser(providerId).catch(() => null);
          }
          // Ensure provider has avatar from message data if available
          if (messagesArray.length > 0) {
            const firstReceivedMsg = messagesArray.find(m => 
              String(m.senderId) !== String(currentUser.id)
            );
            if (firstReceivedMsg && firstReceivedMsg.senderAvatar) {
              providerData = {
                ...providerData,
                avatar: providerData?.avatar || firstReceivedMsg.senderAvatar,
                name: providerData?.name || firstReceivedMsg.senderName
              };
            }
          }
          setProvider(providerData);
        } catch (error) {
          console.error('Error loading chat:', error);
          setMessages([]);
        }
      };
      loadChat();
    }
  }, [providerId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !mediaPreview) return;

    if (mediaPreview) {
      try {
        const uploadResult = await api.uploadMedia(mediaPreview.file);
        console.log('Upload result:', uploadResult);
        if (uploadResult.success) {
          const type = mediaPreview.type.startsWith('video') ? 'video' : 
                       mediaPreview.type.startsWith('audio') ? 'voice' : 'image';
          const sent = await api.sendMediaMessage(
            providerId, 
            uploadResult.filePath, 
            type, 
            newMessage
          );
          console.log('Sent message:', sent);
          if (sent && !sent.error) {
            setMessages(prev => [...prev, { ...sent, senderId: currentUser.id, receiverId: providerId, type, mediaUrl: uploadResult.filePath }]);
          }
        } else {
          console.error('Upload failed:', uploadResult.error);
        }
      } catch (err) {
        console.error('Error sending media:', err);
      }
      setMediaPreview(null);
    } else {
      const sent = await api.sendMessage(providerId, newMessage);
      if (sent && !sent.error) {
        setMessages(prev => [...prev, { ...sent, senderId: currentUser.id, receiverId: providerId }]);
      }
    }
    setNewMessage('');
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMediaPreview({
        file,
        url: previewUrl,
        type: file.type,
      });
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
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(file);
        setMediaPreview({
          file,
          url: previewUrl,
          type: 'audio/webm',
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  };

  const cancelMedia = () => {
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url);
    }
    setMediaPreview(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSenderAvatar = (msg, isOwn) => {
    if (isOwn) {
      return currentUser?.avatar;
    }
    // Use message's senderAvatar first, then fall back to provider avatar
    return msg.senderAvatar || provider?.avatar;
  };

  const getSenderName = (msg, isOwn) => {
    if (isOwn) {
      return currentUser?.name;
    }
    return msg.senderName || provider?.name;
  };

  const getAvatarFallback = (name) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const renderMessageContent = (msg) => {
    const text = msg.content || msg.text || '';
    
    if (msg.type === 'image' && msg.mediaUrl) {
      return (
        <div className="max-w-[250px]">
          <img 
            src={msg.mediaUrl} 
            alt="Shared image" 
            className="rounded-lg max-h-[200px] object-cover"
          />
          {text && <p className="mt-1">{text}</p>}
        </div>
      );
    }
    
    if (msg.type === 'video' && msg.mediaUrl) {
      return (
        <div className="max-w-[250px]">
          <video 
            src={msg.mediaUrl} 
            controls 
            className="rounded-lg max-h-[200px]"
          />
          {text && <p className="mt-1">{text}</p>}
        </div>
      );
    }
    
    if (msg.type === 'voice' && msg.mediaUrl) {
      return (
        <div className="flex items-center gap-2">
          <FiVolume2 className="text-primary" />
          <audio src={msg.mediaUrl} controls className="h-8" />
          {text && <p className="mt-1">{text}</p>}
        </div>
      );
    }
    
    return <p>{text || '📎 Media'}</p>;
  };

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;
    
    return (
      <div className="relative p-2 bg-slate-100 rounded-lg">
        <button
          onClick={cancelMedia}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
        >
          <FiX style={{ fontSize: '16px' }} />
        </button>
        {mediaPreview.type.startsWith('image') && (
          <img src={mediaPreview.url} alt="Preview" className="h-20 rounded" />
        )}
        {mediaPreview.type.startsWith('video') && (
          <video src={mediaPreview.url} className="h-20 rounded" />
        )}
        {mediaPreview.type.startsWith('audio') && (
          <div className="flex items-center gap-2">
            <FiVolume2 className="text-primary" />
            <audio src={mediaPreview.url} controls className="h-8" />
          </div>
        )}
      </div>
    );
  };

  const renderRecorder = () => {
    if (!isRecording) return null;
    
    return (
      <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        <span className="text-red-600 font-medium">{formatTime(recordingTime)}</span>
        <button
          onClick={stopRecording}
          className="ml-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm"
        >
          Stop
        </button>
      </div>
    );
  };

  if (!isDesktop) {
    return (
      <div className="relative flex h-screen w-full flex-col max-w-md mx-auto shadow-2xl bg-background-light dark:bg-background-dark overflow-hidden">
        <header className="flex items-center justify-between bg-surface-light dark:bg-surface-dark px-4 py-3 border-b border-slate-200 dark:border-slate-800 z-10 shrink-0">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <button 
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:text-primary dark:text-slate-400 transition-colors p-1 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <FiArrowLeft style={{ fontSize: '24px' }} />
            </button>
            <div className="flex flex-col min-w-0">
              <h2 className="text-slate-900 dark:text-white text-base font-bold leading-tight truncate">
                {provider?.name || 'Messages'}
              </h2>
              <p className="text-primary text-xs font-medium truncate">{provider?.profession || ''}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {messages.map((msg, index) => {
            const isOwn = String(msg.senderId) === String(currentUser.id) || String(msg.sender) === String(currentUser.id);
            const avatarUrl = getSenderAvatar(msg, isOwn);
            const senderName = getSenderName(msg, isOwn);
            // Show avatar only on last message of consecutive group
            const nextMsg = messages[index + 1];
            const isNextFromSameSender = nextMsg && (
              String(nextMsg.senderId) === String(msg.senderId) || 
              String(nextMsg.sender) === String(msg.sender)
            );
            const showAvatar = !isNextFromSameSender;
            
            return (
            <div
              key={msg.id || msg._id}
              className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
            >
              {showAvatar && avatarUrl ? (
                <div
                  className="w-8 h-8 rounded-full bg-cover bg-center shrink-0 flex-shrink-0"
                  style={{ backgroundImage: `url("${avatarUrl}")` }}
                />
              ) : showAvatar ? (
                <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {getAvatarFallback(senderName)}
                  </span>
                </div>
              ) : (
                <div className="w-8 shrink-0" />
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] ${
                isOwn
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-surface-light dark:bg-surface-dark text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {renderMessageContent(msg)}
              </div>
            </div>
          );
          })}
          <div ref={messagesEndRef} />
        </main>

        <footer className="bg-surface-light dark:bg-surface-dark px-4 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {mediaPreview && (
            <div className="mb-2">
              {renderMediaPreview()}
            </div>
          )}
          {isRecording && (
            <div className="mb-2">
              {renderRecorder()}
            </div>
          )}
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="file"
                ref={imageInputRef}
                onChange={(e) => handleMediaSelect(e)}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center justify-center size-10 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <FiImage style={{ fontSize: '20px' }} />
              </button>
              <input
                type="file"
                ref={videoInputRef}
                onChange={(e) => handleMediaSelect(e)}
                accept="video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center justify-center size-10 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <FiVideo style={{ fontSize: '20px' }} />
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center justify-center size-10 rounded-full ${
                  isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isRecording ? <FiX /> : <FiMic style={{ fontSize: '20px' }} />}
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center min-h-[44px] px-4 py-2 border border-transparent focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none text-[15px]"
                placeholder="Type a message..."
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() && !mediaPreview}
              className={`flex items-center justify-center size-10 rounded-full ${(!newMessage.trim() && !mediaPreview) ? 'bg-slate-300' : 'bg-primary text-white'}`}
            >
              <FiSend style={{ fontSize: '20px' }} />
            </button>
          </form>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-64px)] overflow-hidden">
      <div className="w-80 bg-white rounded-xl border border-slate-200 flex flex-col shrink-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Messages</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style={{ fontSize: '16px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-100 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <FiMessageCircle style={{ fontSize: '40px' }} className="text-4xl mb-2" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations
              .filter((conv) => {
                if (!searchQuery) return true;
                return conv.userName?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conv) => (
              <Link
                key={conv.userId}
                to={`/messages/${conv.userId}`}
                className={`flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 ${
                  String(providerId) === String(conv.userId) ? 'bg-blue-50' : ''
                }`}
              >
                {conv.userAvatar ? (
                  <div
                    className="w-12 h-12 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${conv.userAvatar}")` }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-white">
                      {conv.userName?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 truncate">{conv.userName}</h3>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(conv.lastMessageTime || conv.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">
                    {getMessagePreview(conv)}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="min-w-[20px] h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center px-1.5">
                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
        {providerId ? (
          <>
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {provider?.avatar ? (
                    <div
                      className="w-12 h-12 rounded-full bg-cover bg-center border border-slate-200"
                      style={{ backgroundImage: `url("${provider.avatar}")` }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center border border-slate-200">
                      <span className="text-sm font-bold text-white">
                        {provider?.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900">{provider?.name || 'Unknown User'}</h2>
                  <p className="text-primary text-sm font-medium">{provider?.profession || provider?.role || ''}</p>
                </div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
              {messages.map((msg, index) => {
                const isOwn = String(msg.senderId) === String(currentUser.id) || String(msg.sender) === String(currentUser.id);
                const avatarUrl = getSenderAvatar(msg, isOwn);
                const senderName = getSenderName(msg, isOwn);
                // Show avatar only on last message of consecutive group
                const nextMsg = messages[index + 1];
                const isNextFromSameSender = nextMsg && (
                  String(nextMsg.senderId) === String(msg.senderId) || 
                  String(nextMsg.sender) === String(msg.sender)
                );
                const showAvatar = !isNextFromSameSender;
                
                return (
                <div
                  key={msg.id || msg._id}
                  className={`flex items-end gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                >
                  {showAvatar && avatarUrl ? (
                    <div
                      className="w-8 h-8 rounded-full bg-cover bg-center shrink-0 flex-shrink-0"
                      style={{ backgroundImage: `url("${avatarUrl}")` }}
                    />
                  ) : showAvatar ? (
                    <div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {getAvatarFallback(senderName)}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}
        
                  <div className={`flex flex-col gap-1 max-w-[60%] ${isOwn ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-[15px] ${
                      isOwn
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}>
                      {renderMessageContent(msg)}
                    </div>
                    <span className="text-[11px] text-slate-400 px-1">
                      {formatRelativeTime(msg.createdAt || msg.time)}
                    </span>
                  </div>
                </div>
              );
              })}
              <div ref={messagesEndRef} />
            </main>

            <footer className="px-6 py-4 border-t border-slate-200 flex-shrink-0 bg-white z-10">
              {mediaPreview && (
                <div className="mb-2">
                  {renderMediaPreview()}
                </div>
              )}
              {isRecording && (
                <div className="mb-2">
                  {renderRecorder()}
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-3">
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={(e) => handleMediaSelect(e)}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-200"
                  >
                    <FiImage style={{ fontSize: '20px' }} />
                  </button>
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={(e) => handleMediaSelect(e)}
                    accept="video/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-200"
                  >
                    <FiVideo style={{ fontSize: '20px' }} />
                  </button>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                {isRecording ? <FiX /> : <FiMic style={{ fontSize: '20px' }} />}
                  </button>
                </div>
                <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-3 border border-transparent focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-slate-900 placeholder-slate-400 focus:outline-none text-[15px]"
                    placeholder="Type a message..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() && !mediaPreview}
                  className={`flex items-center justify-center w-12 h-12 rounded-full shadow-sm transition-all ${(!newMessage.trim() && !mediaPreview) ? 'bg-slate-300 text-slate-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}
                >
                  <FiSend style={{ fontSize: '20px' }} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiMessageCircle style={{ fontSize: '60px' }} className="text-6xl text-slate-200" />
              <p className="text-slate-500 mt-4">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
