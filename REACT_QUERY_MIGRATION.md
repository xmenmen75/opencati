# React Query Migration - OpenCATI

## Overview

We've successfully migrated from vanilla `fetch` calls to **TanStack Query** (React Query) for better API state management, caching, and user experience.

## Benefits

✅ **Automatic Caching** - Reduces unnecessary API calls  
✅ **Background Updates** - Keeps data fresh automatically  
✅ **Error Handling** - Centralized error management with retry logic  
✅ **Loading States** - Built-in loading indicators  
✅ **Optimistic Updates** - Instant UI feedback  
✅ **Offline Support** - Works with poor network conditions  
✅ **Devtools** - Visual debugging in development  

## Key Files Added

- `/src/lib/react-query.ts` - Query client configuration
- `/src/lib/api-client.ts` - Centralized API client with error handling
- `/src/services/api.ts` - API service functions
- `/src/hooks/queries.ts` - React Query hooks
- `/src/hooks/useAuth.ts` - New auth hook using React Query
- `/src/components/providers/QueryProvider.tsx` - React Query provider
- `/src/components/providers/GlobalErrorBoundary.tsx` - Error boundary
- `/src/components/ui/Loading.tsx` - Loading components

## Usage Examples

### 1. Fetching User Data

**Before (with fetch):**
```typescript
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchUser();
}, []);
```

**After (with React Query):**
```typescript
import { useAuthMe } from '@/hooks/queries';

const { data: authData, isLoading, error } = useAuthMe();
const user = authData?.user;
```

### 2. Mutations (Creating/Updating Data)

**Pack Opening Example:**
```typescript
import { useOpenPack } from '@/hooks/queries';

const openPackMutation = useOpenPack();

const handleOpenPack = async () => {
  try {
    const result = await openPackMutation.mutateAsync();
    // Success! Data is automatically cached and UI updated
  } catch (error) {
    // Error handling
  }
};

return (
  <button 
    onClick={handleOpenPack}
    disabled={openPackMutation.isPending}
  >
    {openPackMutation.isPending ? 'Opening...' : 'Open Pack'}
  </button>
);
```

### 3. Cache Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queries';

const queryClient = useQueryClient();

// Invalidate specific data
queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });

// Clear all cache on logout
queryClient.clear();
```

## Query Keys

Centralized query keys prevent cache inconsistencies:

```typescript
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
    nonce: (address: string) => ['auth', 'nonce', address] as const,
  },
  user: {
    profile: ['user', 'profile'] as const,
  },
  cards: {
    owned: ['cards', 'owned'] as const,
  },
} as const;
```

## Error Handling

### API Client
- Automatic retry on network errors
- Proper error types with status codes
- Timeout handling

### React Query Configuration
- No retry on 401/403/404 errors
- Custom retry logic for different error types
- Global error boundary for unhandled errors

## Best Practices Implemented

### 1. Separation of Concerns
- `api.ts` - Pure API functions
- `queries.ts` - React Query hooks
- `api-client.ts` - HTTP client logic

### 2. Type Safety
- Full TypeScript support
- Proper error types
- API response types

### 3. Performance
- Smart caching strategies
- Background refetching
- Optimistic updates

### 4. User Experience
- Loading states
- Error boundaries
- Retry mechanisms

## Development Tools

React Query Devtools are available in development mode:
- View cached queries
- See loading states
- Trigger refetches
- Clear cache

## Migration Checklist

✅ Install TanStack Query packages  
✅ Set up QueryClient and Provider  
✅ Create API client with error handling  
✅ Migrate fetch calls to React Query hooks  
✅ Add loading and error states  
✅ Implement cache invalidation  
✅ Add error boundaries  
✅ Test all functionality  

## Future Enhancements

1. **Offline Support** - Add persistence adapter
2. **Optimistic Updates** - Implement for mutations
3. **Infinite Queries** - For paginated data
4. **Subscription Support** - Real-time updates
5. **Background Sync** - Sync when app becomes active

## API Endpoints Ready for Backend

The following API functions are ready to connect to your backend:

- `authApi.getNonce(address)` - Get auth nonce
- `authApi.verify(data)` - Verify SIWE signature  
- `authApi.getMe()` - Get current user
- `authApi.logout()` - Logout user
- `userApi.updateProfile(data)` - Update user profile
- `cardsApi.getOwnedCards()` - Get user's cards
- `cardsApi.openPack()` - Open card pack
- `seasonsApi.getActiveSeasons()` - Get active seasons
- `transactionsApi.getTransactions()` - Get transaction history

Simply update the API endpoints when your backend is ready!
