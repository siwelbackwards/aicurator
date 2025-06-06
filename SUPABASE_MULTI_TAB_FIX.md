# Supabase Multi-Tab Session Management Fix

This document explains the comprehensive solution implemented to fix Supabase connection and refresh token issues when multiple browser tabs are open.

## 🚨 Problems Solved

### Original Issues:
1. **Session conflicts between tabs**: Multiple tabs trying to refresh tokens simultaneously
2. **Stale sessions**: Tabs not receiving updated session information from other tabs
3. **Connection failures**: Fast page refresh causing authentication errors
4. **Token refresh race conditions**: Multiple clients competing for token refresh
5. **Inconsistent auth state**: UI components showing different authentication states across tabs

## 🔧 Solution Overview

The fix involves several key components working together:

### 1. Enhanced Supabase Client (`lib/supabase-client.ts`)
- **Single client instance per window**: Prevents multiple clients from conflicting
- **Cross-tab synchronization**: Custom storage implementation that notifies other tabs of session changes
- **Session validation**: Automatic detection of expired sessions with refresh attempts
- **Proper event handling**: Comprehensive auth state change management

### 2. Authentication Hook (`hooks/use-auth.ts`)
- **Centralized auth state**: Single source of truth for authentication status
- **Automatic session validation**: Periodic checks and refreshes
- **Cross-tab event handling**: Listens for auth events from other tabs
- **Error recovery**: Automatic retry and fallback mechanisms

### 3. Retry Wrapper (`lib/with-auth-retry.tsx`)
- **Automatic retry logic**: Intelligent retry for auth-related failures
- **Session refresh integration**: Ensures valid sessions before database operations
- **Exponential backoff**: Prevents overwhelming the server with retry attempts
- **Comprehensive error handling**: Distinguishes between retryable and permanent errors

## 🚀 How to Use

### 1. Basic Authentication

```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, isAuthenticated, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) return <div>Please sign in</div>;

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### 2. Data Fetching with Retry Logic

```tsx
import { withSupabaseRetry } from '@/lib/with-auth-retry';
import { supabase } from '@/lib/supabase-client';

async function fetchUserData() {
  const { data, error } = await withSupabaseRetry(
    () => supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId),
    'Fetch user profile'
  );
  
  if (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
  
  return data;
}
```

### 3. Component with Auth-Protected Data

```tsx
import { useAuth } from '@/hooks/use-auth';
import { withSupabaseRetry } from '@/lib/with-auth-retry';

function DataComponent() {
  const { isAuthenticated, user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await withSupabaseRetry(
          () => supabase.from('my_table').select('*'),
          'Fetch my data'
        );
        
        if (!error) setData(data || []);
      } catch (err) {
        console.error('Data fetch failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Component JSX...
}
```

## 🔍 Key Features

### Cross-Tab Synchronization
- When a user signs in/out in one tab, all other tabs are immediately updated
- Session refreshes in one tab automatically sync to all other tabs
- Prevents conflicts when multiple tabs try to refresh simultaneously

### Intelligent Retry Logic
- Automatically retries failed requests due to expired tokens
- Distinguishes between auth errors and other types of failures
- Uses exponential backoff to prevent server overload
- Maintains user experience by handling retries transparently

### Session Validation
- Periodic checks ensure sessions remain valid
- Proactive refresh before tokens expire
- Automatic cleanup of expired sessions
- Graceful handling of network interruptions

### Error Recovery
- Comprehensive error handling for different failure scenarios
- Automatic fallback mechanisms for auth failures
- User-friendly error messages and recovery options
- Logging for debugging and monitoring

## 🛠️ Configuration Options

### Retry Configuration

```tsx
import { withSupabaseRetry } from '@/lib/with-auth-retry';

// Custom retry configuration
const { data, error } = await withSupabaseRetry(
  () => mySupabaseQuery(),
  'My operation',
  {
    maxRetries: 5,
    retryDelay: 2000,
    shouldRetry: (error) => error.status === 401
  }
);
```

### Auth Hook Options

The `useAuth` hook automatically handles:
- Session initialization and validation
- Cross-tab synchronization
- Periodic session refresh (every 5 minutes)
- Error recovery and cleanup

## 🔧 Migration Guide

### Before (Problematic Pattern)
```tsx
// ❌ Direct Supabase calls without retry logic
const { data } = await supabase.from('table').select('*');

// ❌ Manual auth state management
const [user, setUser] = useState(null);
useEffect(() => {
  supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user || null);
  });
}, []);
```

### After (Fixed Pattern)
```tsx
// ✅ Use retry wrapper for all data operations
const { data } = await withSupabaseRetry(
  () => supabase.from('table').select('*'),
  'Fetch table data'
);

// ✅ Use centralized auth hook
const { user, isAuthenticated } = useAuth();
```

## 📋 Best Practices

### 1. Always Use Auth Hook
```tsx
// ✅ Good
const { user, isAuthenticated } = useAuth();

// ❌ Avoid direct Supabase auth calls in components
const [user, setUser] = useState(null);
```

### 2. Wrap Database Operations
```tsx
// ✅ Good - with retry logic
const result = await withSupabaseRetry(() => supabase.from('table').select('*'));

// ❌ Risky - no retry handling
const result = await supabase.from('table').select('*');
```

### 3. Handle Loading States
```tsx
const { user, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) return <SignInPrompt />;
return <AuthenticatedContent />;
```

### 4. Error Handling
```tsx
try {
  const { data, error } = await withSupabaseRetry(myQuery);
  if (error) throw error;
  // Handle success
} catch (error) {
  // Handle final failure after retries
  console.error('Operation failed:', error);
  showErrorMessage(error.message);
}
```

## 🐛 Debugging

### Console Logs
The system provides detailed console logging:
- `🔄` Session sync events
- `✅` Successful operations
- `❌` Errors and failures
- `🔍` Retry attempts

### Common Issues

1. **"Session expired" errors**: The system should automatically refresh
2. **"Client not initialized"**: Check environment variables
3. **Retry loops**: Verify your retry configuration and error handling

### Monitoring
- Watch browser console for auth events
- Check Network tab for token refresh requests
- Monitor localStorage for session data

## 🚦 Testing Multi-Tab Behavior

1. Open your app in multiple tabs
2. Sign in from one tab
3. Verify other tabs automatically update
4. Sign out from one tab
5. Confirm all tabs update to signed-out state
6. Test rapid page refreshes
7. Check data fetching across tabs

## 🔐 Security Considerations

- Sessions are stored in localStorage (as recommended by Supabase)
- Cross-tab communication uses browser's Storage events
- Refresh tokens are automatically rotated by Supabase
- Failed refresh attempts trigger automatic sign-out

## 📞 Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase configuration
3. Test with a single tab first
4. Review the retry logic configuration
5. Check if the issue persists after the fix

---

This solution provides a robust, production-ready implementation for handling Supabase authentication and data fetching across multiple browser tabs while maintaining excellent user experience and reliability. 