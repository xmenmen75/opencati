'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for this provider
  // This ensures we don't share state between different parts of the app
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
            retry: (failureCount, error) => {
              // Don't retry on 401, 403, 404
              if (error && typeof error === 'object' && 'status' in error) {
                const status = (error as { status: number }).status;
                if ([401, 403, 404].includes(status)) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false, // Disable automatic refetch on window focus
            refetchOnReconnect: false, // Disable automatic refetch on reconnect to prevent logout issues
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show devtools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
