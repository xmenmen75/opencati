import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-white/20 border-t-white ${sizeClasses[size]}`}
        aria-label="Loading"
      />
      {text && (
        <p className="text-white/80 text-sm font-medium">{text}</p>
      )}
    </div>
  );
}

export function LoadingCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/10 rounded-lg ${className}`}>
      <div className="space-y-3 p-4">
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
        <div className="h-3 bg-white/20 rounded w-1/2"></div>
        <div className="h-3 bg-white/20 rounded w-5/6"></div>
      </div>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#362A85] to-[#7F174C] flex items-center justify-center">
      <Loading size="lg" text="Loading OpenCATI..." />
    </div>
  );
}
