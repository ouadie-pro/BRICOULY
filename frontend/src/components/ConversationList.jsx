import { Link } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';

export default function ConversationList({ conversations, currentUserId, selectedUserId }) {
  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?';
  };

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white rounded-xl border border-slate-200">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <FiMessageCircle style={{ fontSize: '40px' }} className="text-4xl text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No conversations yet</h3>
          <p className="text-slate-500 text-sm">
            Start a conversation by visiting a provider's profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900">Messages</h2>
        <p className="text-sm text-slate-500">{conversations.length} conversations</p>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conv) => {
          const isSelected = String(conv.userId) === String(selectedUserId);
          
          return (
            <Link
              key={conv.userId}
              to={`/messages/${conv.userId}`}
              className={`flex items-center gap-3 p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 transition-colors ${
                isSelected ? 'bg-primary/5 border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="relative shrink-0">
                {conv.userAvatar ? (
                  <img
                    src={conv.userAvatar}
                    alt={conv.userName}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center border border-slate-200">
                    <span className="text-white font-semibold text-lg">
                      {getInitials(conv.userName)}
                    </span>
                  </div>
                )}
                {conv.unread && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                    !
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h3 className={`font-semibold truncate ${conv.unread ? 'text-slate-900' : 'text-slate-700'}`}>
                    {conv.userName}
                  </h3>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
                    {formatTime(conv.lastMessageTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {conv.userRole === 'provider' && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {conv.userProfession || 'Provider'}
                    </span>
                  )}
                  <p className={`text-sm truncate ${conv.unread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                    {conv.lastMessage}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
