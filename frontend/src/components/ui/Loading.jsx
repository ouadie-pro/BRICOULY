export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
  };
  
  return (
    <div 
      className={`${sizeClasses[size]} border-slate-200 border-t-primary rounded-full animate-spin ${className}`}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function LoadingCard({ className = '' }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-slate-200 rounded-lg h-4 w-3/4 mb-2"></div>
      <div className="bg-slate-200 rounded-lg h-4 w-1/2"></div>
    </div>
  );
}

import { FiInbox, FiAlertCircle } from 'react-icons/fi';

export function EmptyState({ 
  icon = FiInbox, 
  title = 'No data found', 
  description = 'Nothing to display here yet.',
  action,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <icon className="text-slate-400 text-3xl" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-4">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

export function ErrorState({ 
  message = 'Something went wrong', 
  onRetry,
  className = '' 
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <FiAlertCircle className="text-red-500 text-3xl" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Oops!</h3>
      <p className="text-slate-500 text-sm max-w-xs mb-4">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">
          Try Again
        </button>
      )}
    </div>
  );
}
