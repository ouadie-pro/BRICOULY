import { useState, useRef } from 'react';
import { api } from '../services/api';
import { FiImage, FiVideo, FiMic, FiSend, FiPhone, FiPlus, FiX, FiLoader } from 'react-icons/fi';

export default function ChatInput({ receiverId, onMessageSent }) {
  const [message, setMessage] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioChunksRef = useRef([]);

  const handleSend = async (e) => {
    e?.preventDefault();
    
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      const sent = await api.sendMessage(receiverId, message.trim());
      if (sent && onMessageSent) {
        onMessageSent(sent);
      }
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      handleMediaUpload(file, type);
    }
    e.target.value = '';
  };

  const handleMediaUpload = async (file, type) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).id : null;
      
      const response = await fetch('/api/messages/media', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
        body: formData,
      });
      
      const result = await response.json();
      console.log('Media upload result:', result);
      
      if (result.success) {
        const sent = await api.sendMessage(
          receiverId, 
          '', 
          result.filePath, 
          null, 
          type
        );
        console.log('Media message sent:', sent);
        
        if (sent && onMessageSent) {
          onMessageSent(sent);
        }
      } else {
        console.error('Media upload failed:', result.error);
      }
    } catch (error) {
      console.error('Error uploading media:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
        
        stream.getTracks().forEach(track => track.stop());
        
        await handleMediaUpload(file, 'voice');
        setIsRecording(false);
        setRecordingTime(0);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      clearInterval(recordingTimerRef.current);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {isRecording && (
        <div className="flex items-center gap-3 mb-3 p-3 bg-red-50 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 font-medium">Recording...</span>
          <span className="text-red-500 font-mono">{formatRecordingTime(recordingTime)}</span>
          <button
            onClick={stopRecording}
            className="ml-auto px-3 py-1 bg-red-500 text-white rounded-full text-sm hover:bg-red-600"
          >
            Send
          </button>
        </div>
      )}
      
      {showMediaPicker && (
        <div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg border border-slate-200 p-2 flex gap-2 z-10">
          <input
            type="file"
            ref={imageInputRef}
            onChange={(e) => handleMediaSelect(e, 'image')}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            className="flex flex-col items-center p-3 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiImage className="text-green-500 text-2xl" />
            <span className="text-xs text-slate-600 mt-1">Photo</span>
          </button>
          
          <input
            type="file"
            ref={videoInputRef}
            onChange={(e) => handleMediaSelect(e, 'video')}
            accept="video/*"
            className="hidden"
          />
          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex flex-col items-center p-3 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiVideo className="text-purple-500 text-2xl" />
            <span className="text-xs text-slate-600 mt-1">Video</span>
          </button>
          
          <button
            onClick={startRecording}
            className="flex flex-col items-center p-3 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <FiMic className="text-red-500 text-2xl" />
            <span className="text-xs text-slate-600 mt-1">Voice</span>
          </button>
        </div>
      )}
      
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowMediaPicker(!showMediaPicker)}
            className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <FiPlus style={{ fontSize: '22px' }} />
          </button>
          
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
              isRecording 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {isRecording ? <FiX style={{ fontSize: '22px' }} /> : <FiMic style={{ fontSize: '22px' }} />}
          </button>
          
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <FiPhone style={{ fontSize: '22px' }} />
          </button>
        </div>
        
        <div className="flex-1 bg-slate-100 rounded-full flex items-center px-4 py-2 focus-within:ring-2 focus-within:ring-primary/30">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-[15px]"
          />
        </div>
        
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            message.trim() && !isSending
              ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/30' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <FiLoader style={{ fontSize: '18px' }} className="animate-spin" />
          ) : (
            <FiSend style={{ fontSize: '20px' }} />
          )}
        </button>
      </form>
    </div>
  );
}
