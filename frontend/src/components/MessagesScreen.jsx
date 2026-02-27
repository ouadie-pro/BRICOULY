import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

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
  const mediaInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchConversations = async () => {
      const data = await api.getConversations();
      setConversations(data);
    };
    fetchConversations();
  }, []);

  useEffect(() => {
    if (providerId) {
      const loadChat = async () => {
        const [msgs, providerData] = await Promise.all([
          api.getMessages(providerId),
          api.getProvider(providerId),
        ]);
        setMessages(msgs);
        setProvider(providerData);
      };
      loadChat();
    }
  }, [providerId, conversations]);

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
      const uploadResult = await api.uploadMedia(mediaPreview.file);
      if (uploadResult.success) {
        const type = mediaPreview.type.startsWith('video') ? 'video' : 
                     mediaPreview.type.startsWith('audio') ? 'voice' : 'image';
        const sent = await api.sendMediaMessage(
          providerId, 
          uploadResult.filePath, 
          type, 
          newMessage
        );
        if (sent) {
          setMessages([...messages, { ...sent.message, senderId: currentUser.id, receiverId: parseInt(providerId) }]);
        }
      }
      setMediaPreview(null);
    } else {
      const sent = await api.sendMessage(providerId, newMessage);
      if (sent) {
        setMessages([...messages, { ...sent.message, senderId: currentUser.id, receiverId: parseInt(providerId) }]);
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

  const renderMessageContent = (msg) => {
    if (msg.type === 'image' && msg.mediaUrl) {
      return (
        <div className="max-w-[250px]">
          <img 
            src={msg.mediaUrl} 
            alt="Shared image" 
            className="rounded-lg max-h-[200px] object-cover"
          />
          {msg.text && <p className="mt-1">{msg.text}</p>}
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
          {msg.text && <p className="mt-1">{msg.text}</p>}
        </div>
      );
    }
    
    if (msg.type === 'voice' && msg.mediaUrl) {
      return (
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">graphic_eq</span>
          <audio src={msg.mediaUrl} controls className="h-8" />
          {msg.text && <p className="mt-1">{msg.text}</p>}
        </div>
      );
    }
    
    return <p>{msg.text}</p>;
  };

  const renderMediaPreview = () => {
    if (!mediaPreview) return null;
    
    return (
      <div className="relative p-2 bg-slate-100 rounded-lg">
        <button
          onClick={cancelMedia}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
        {mediaPreview.type.startsWith('image') && (
          <img src={mediaPreview.url} alt="Preview" className="h-20 rounded" />
        )}
        {mediaPreview.type.startsWith('video') && (
          <video src={mediaPreview.url} className="h-20 rounded" />
        )}
        {mediaPreview.type.startsWith('audio') && (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">graphic_eq</span>
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
              <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
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
          {messages.map((msg) => (
            <div
              key={msg.id || msg._id}
              className={`flex items-end gap-2 ${(msg.senderId === currentUser.id || msg.sender === currentUser.id) ? 'flex-row-reverse' : ''}`}
            >
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] ${
                (msg.senderId === currentUser.id || msg.sender === currentUser.id)
                  ? 'bg-primary text-white rounded-tr-sm' 
                  : 'bg-surface-light dark:bg-surface-dark text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {renderMessageContent(msg)}
              </div>
            </div>
          ))}
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
          <form onSubmit={handleSend} className="flex items-end gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowMediaPicker(!showMediaPicker)}
                className="flex items-center justify-center size-10 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center justify-center size-10 rounded-full ${
                  isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{isRecording ? 'stop' : 'mic'}</span>
              </button>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center min-h-[44px] px-4 py-2 focus-within:ring-2 focus-within:ring-primary/50">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full bg-transparent border-none p-0 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 text-[15px]"
                placeholder="Type a message..."
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center size-10 rounded-full bg-primary text-white"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
          {showMediaPicker && (
            <div className="absolute bottom-20 left-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-2 flex gap-2">
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleMediaSelect}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="flex flex-col items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <span className="material-symbols-outlined text-primary">image</span>
                <span className="text-xs">Image</span>
              </button>
              <input
                type="file"
                ref={mediaInputRef}
                onChange={handleMediaSelect}
                accept="video/*"
                className="hidden"
              />
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="flex flex-col items-center p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <span className="material-symbols-outlined text-purple-500">videocam</span>
                <span className="text-xs">Video</span>
              </button>
            </div>
          )}
        </footer>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-64px)]">
      <div className="w-80 bg-white rounded-xl border border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble</span>
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <Link
                key={conv.userId}
                to={`/messages/${conv.userId}`}
                className={`flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 ${
                  parseInt(providerId) === conv.userId ? 'bg-blue-50' : ''
                }`}
              >
                <div
                  className="w-12 h-12 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${conv.userAvatar}")` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900 truncate">{conv.userName}</h3>
                    <span className="text-xs text-slate-400">{conv.lastMessageTime?.split('T')[0]}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread && (
                  <span className="w-3 h-3 bg-primary rounded-full"></span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col">
        {providerId ? (
          <>
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full bg-cover bg-center border border-slate-200"
                    style={{ backgroundImage: provider?.avatar ? `url("${provider.avatar}")` : undefined }}
                  />
                  <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-slate-900">{provider?.name}</h2>
                  <p className="text-primary text-sm font-medium">{provider?.profession}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center justify-center w-10 h-10 rounded-full text-primary hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">call</span>
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <span className="material-symbols-outlined text-[24px]">info</span>
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id || msg._id}
                  className={`flex items-end gap-3 ${(msg.senderId === currentUser.id || msg.sender === currentUser.id) ? 'flex-row-reverse' : ''}`}
                >
                  {(msg.senderId !== currentUser.id && msg.sender !== currentUser.id) && (
                    <div
                      className="w-8 h-8 rounded-full bg-cover bg-center shrink-0"
                      style={{ backgroundImage: provider?.avatar ? `url("${provider.avatar}")` : undefined }}
                    />
                  )}
                  <div className={`flex flex-col gap-1 max-w-[60%] ${(msg.senderId === currentUser.id || msg.sender === currentUser.id) ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-[15px] ${
                      (msg.senderId === currentUser.id || msg.sender === currentUser.id)
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-sm'
                    }`}>
                      {renderMessageContent(msg)}
                    </div>
                    <span className="text-[11px] text-slate-400 px-1">
                      {msg.time || msg.createdAt}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </main>

            <footer className="px-6 py-4 border-t border-slate-200">
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
              <form onSubmit={handleSend} className="flex items-end gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker(!showMediaPicker)}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-200"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                  </button>
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isRecording ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{isRecording ? 'stop' : 'mic'}</span>
                  </button>
                </div>
                <div className="flex-1 bg-slate-100 rounded-2xl flex items-center px-4 py-3 focus-within:ring-2 focus-within:ring-primary/50">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-slate-900 placeholder-slate-400 focus:ring-0 text-[15px]"
                    placeholder="Type a message..."
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="material-symbols-outlined text-6xl text-slate-200">chat</span>
              <p className="text-slate-500 mt-4">Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
