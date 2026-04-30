import { FiPlay, FiCheck } from 'react-icons/fi';
export default function MessageBubble({ message, isOwn, showAvatar }) {
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getAvatarFallback = (name) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const getMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="rounded-lg overflow-hidden">
            <img 
              src={message.mediaUrl} 
              alt="Shared image" 
              className="max-w-[250px] rounded-lg object-cover"
              loading="lazy"
            />
          </div>
        );
      case 'video':
        return (
          <div className="rounded-lg overflow-hidden">
            <video 
              src={message.mediaUrl} 
              controls 
              className="max-w-[250px] rounded-lg"
            />
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center gap-2 min-w-[200px]">
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <FiPlay style={{ fontSize: '14px' }} className="text-white text-sm" />
            </button>
            <div className="flex-1 h-8 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-1/3 bg-white/30 rounded-full" />
            </div>
            <span className="text-xs text-white/70 shrink-0">
              {formatTime(message.createdAt)}
            </span>
          </div>
        );
      default:
        return (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div className={`flex items-end gap-2 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <div className="shrink-0 flex-shrink-0">
          {showAvatar ? (
            message.senderAvatar ? (
              <img
                src={message.senderAvatar}
                alt={message.senderName || 'User'}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                }}
              />
            ) : null
          ) : (
            <div className="w-8" />
          )}
          {showAvatar && !message.senderAvatar && (
            <div 
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
            >
              <span className="text-xs font-bold text-white">
                {getAvatarFallback(message.senderName)}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div 
          className={`px-4 py-3 rounded-2xl shadow-sm ${
            isOwn 
              ? 'bg-primary text-white rounded-br-sm' 
              : 'bg-white text-slate-800 rounded-bl-sm border border-slate-200'
          }`}
        >
          {getMessageContent()}
        </div>
        
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className={`text-[11px] ${isOwn ? 'text-white/60' : 'text-slate-400'}`}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <span className="text-[10px] text-white/60 ml-1">
              {message.read ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
