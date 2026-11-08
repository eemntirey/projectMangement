import React from 'react';

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ name, photoURL, size = 'sm', className = '' }: AvatarProps) {
  const sizeClasses = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base'
  }[size];

  const initials = name
    ? name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full font-semibold ring-2 ring-white dark:ring-slate-900 bg-gradient-to-tr from-indigo-500 to-sky-400 text-white shadow-xs overflow-hidden ${sizeClasses} ${className}`}
      title={name}
    >
      {photoURL && !imgError ? (
        <img
          src={photoURL}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
