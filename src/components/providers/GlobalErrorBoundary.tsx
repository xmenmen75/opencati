'use client';

import React from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#362A85] to-[#7F174C] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h2>
        <p className="text-white/80 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={reset}
          onError={(error: Error, errorInfo: React.ErrorInfo) => {
            console.error('Global error caught:', error, errorInfo);
            // Here you could send error to logging service
          }}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
