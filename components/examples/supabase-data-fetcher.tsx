"use client";

import { useState, useEffect } from 'react';
import { withSupabaseRetry } from '@/lib/with-auth-retry';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';

interface ExampleDataFetcherProps {
  tableName: string;
  title: string;
}

/**
 * Example component showing proper Supabase data fetching with:
 * - Authentication state management
 * - Automatic retry on auth failures
 * - Multi-tab session synchronization
 * - Proper error handling
 */
export default function SupabaseDataFetcher({ tableName, title }: ExampleDataFetcherProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!isAuthenticated) {
      setError('Please member log in to view this data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use withSupabaseRetry to automatically handle auth issues
      const { data: fetchedData, error: fetchError } = await withSupabaseRetry(
        () => supabase
          .from(tableName)
          .select('*')
          .limit(10),
        `Fetch ${tableName} data`
      );

      if (fetchError) {
        throw fetchError;
      }

      setData((fetchedData as any[]) || []);
      console.log(`✅ Successfully fetched ${(fetchedData as any[])?.length || 0} items from ${tableName}`);
    } catch (err: any) {
      console.error(`❌ Error fetching ${tableName}:`, err);
      setError(err.message || `Failed to fetch ${tableName} data`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when component mounts and user auth state changes
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchData();
    } else if (!authLoading && !isAuthenticated) {
      setData([]);
      setError('Please member log in to view this data');
    }
  }, [isAuthenticated, authLoading, tableName]);

  if (authLoading) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-yellow-700">Please member log in to view this data.</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-green-600">
            ✅ User: {user?.email}
          </span>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading && !data.length && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading {tableName} data...</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-4">
          <p className="text-sm text-red-700">
            <strong>Error:</strong> {error}
          </p>
          <button
            onClick={fetchData}
            className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {data.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Showing {data.length} items from {tableName}:
          </p>
          <div className="max-h-40 overflow-y-auto bg-gray-50 p-2 rounded">
            {data.map((item, index) => (
              <div key={item.id || index} className="text-xs border-b border-gray-200 py-1">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && data.length === 0 && (
        <p className="text-sm text-gray-500">No data found in {tableName}.</p>
      )}
    </div>
  );
}

// Usage examples:
export function ProfilesDataFetcher() {
  return <SupabaseDataFetcher tableName="profiles" title="User Profiles" />;
}

export function ArtworksDataFetcher() {
  return <SupabaseDataFetcher tableName="artworks" title="Artworks" />;
} 