import { useState, forwardRef } from 'react';
import { LoadingSpinner } from './Loading';
import { FiCheck, FiChevronDown, FiX, FiUpload } from 'react-icons/fi';

export const Input = forwardRef(({ 
  label, 
  error, 
  icon: Icon, 
  className = '', 
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        {Icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon className="text-lg" />
          </span>
        )}
        <input
          ref={ref}
          className={`input-field ${Icon ? 'pl-10' : ''} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({ 
  label, 
  error, 
  className = '', 
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <textarea
        ref={ref}
        className={`input-field resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ 
  label, 
  error, 
  options = [],
  placeholder = 'Select an option',
  className = '', 
  containerClassName = '',
  ...props 
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="relative">
        <select
          ref={ref}
          className={`input-field appearance-none pr-10 ${error ? 'border-red-300 focus:border-red-500' : ''} ${className}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <FiChevronDown className="text-lg" />
        </span>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export function Checkbox({ label, checked, onChange, className = '' }) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div 
          className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
            checked 
              ? 'bg-primary border-primary' 
              : 'border-slate-300 hover:border-slate-400'
          }`}
        >
          {checked && (
            <FiCheck className="text-white text-lg" />
          )}
        </div>
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

export function Toggle({ label, checked, onChange, className = '' }) {
  return (
    <label className={`flex items-center justify-between cursor-pointer ${className}`}>
      <span className="text-sm text-slate-700">{label}</span>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div 
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-primary' : 'bg-slate-300'
          }`}
        >
          <div 
            className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </div>
      </div>
    </label>
  );
}

export function FileUpload({ 
  label, 
  accept, 
  onChange, 
  preview,
  loading,
  className = '' 
}) {
  const [dragOver, setDragOver] = useState(false);
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };
  
  return (
    <div className={className}>
      {label && <label className="text-sm font-medium text-slate-700 mb-2 block">{label}</label>}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-slate-300 hover:border-slate-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner className="mb-2" />
            <p className="text-sm text-slate-500">Uploading...</p>
          </div>
        ) : preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="Preview" className="max-h-40 rounded-lg" />
              <button
                type="button"
                onClick={onChange.bind(null, null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <FiX className="text-lg" />
              </button>
          </div>
        ) : (
          <label className="cursor-pointer">
            <input type="file" accept={accept} onChange={(e) => e.target.files[0] && onChange(e.target.files[0])} className="hidden" />
            <FiUpload className="text-4xl text-slate-400 mb-2" />
            <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 10MB</p>
          </label>
        )}
      </div>
    </div>
  );
}

export function Avatar({ src, name, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };
  
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  
  if (src) {
    return (
      <div 
        className={`${sizeClasses[size]} rounded-full bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url("${src}")` }}
      />
    );
  }
  
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-semibold text-slate-600 ${className}`}
    >
      {initial}
    </div>
  );
}

export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
  };
  
  return (
    <span className={`badge ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function Card({ children, className = '', elevated = false }) {
  return (
    <div className={`card ${elevated ? 'card-elevated' : ''} ${className}`}>
      {children}
    </div>
  );
}
