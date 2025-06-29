"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { withSupabaseRetry } from '@/lib/with-auth-retry';

interface DataContextType {
  trendingProducts: any[];
  adminStats: any | null;
  isLoading: boolean;
  error: string | null;
  refreshTrendingProducts: () => Promise<void>;
  refreshAdminStats: () => Promise<void>;
  clearCache: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
}

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<{ [key: string]: number }>({});

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  const shouldRefetch = useCallback((key: string) => {
    const now = Date.now();
    const lastFetchTime = lastFetch[key] || 0;
    return now - lastFetchTime > CACHE_DURATION;
  }, [lastFetch]);

  const refreshTrendingProducts = useCallback(async () => {
    if (!shouldRefetch('trending') && trendingProducts.length > 0) {
      return; // Use cached data
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: artworks, error } = await withSupabaseRetry(
        () => supabase
          .from('artworks')
          .select(`
            id,
            title,
            artist_name,
            price,
            currency,
            category,
            description,
            images:artwork_images(file_path, is_primary)
          `)
          .eq('status', 'approved')
          .order('price', { ascending: false })
          .limit(12),
        'Fetch trending products'
      );

      if (error) throw error;

      setTrendingProducts((artworks as any[]) || []);
      setLastFetch(prev => ({ ...prev, trending: Date.now() }));
    } catch (err: any) {
      console.error('Error fetching trending products:', err);
      setError(err.message || 'Failed to fetch trending products');
    } finally {
      setIsLoading(false);
    }
  }, [shouldRefetch, trendingProducts.length]);

  const refreshAdminStats = useCallback(async () => {
    if (!shouldRefetch('admin') && adminStats) {
      return; // Use cached data
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all stats in parallel with retry logic
      const [usersCount, buyersCount, sellersCount, artworksCount, pendingCount] = await Promise.all([
        withSupabaseRetry(
          () => supabase.from('profiles').select('*', { count: 'exact', head: true }),
          'Count total users'
        ),
        withSupabaseRetry(
          () => supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'buyer'),
          'Count buyers'
        ),
        withSupabaseRetry(
          () => supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('user_type', 'seller'),
          'Count sellers'
        ),
        withSupabaseRetry(
          () => supabase.from('artworks').select('*', { count: 'exact', head: true }),
          'Count artworks'
        ),
        withSupabaseRetry(
          () => supabase.from('artworks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          'Count pending artworks'
        )
      ]);

      // Check for errors
      const errors = [usersCount.error, buyersCount.error, sellersCount.error, artworksCount.error, pendingCount.error]
        .filter(Boolean);

      if (errors.length > 0) {
        throw new Error(`Failed to fetch stats: ${errors.map(e => e?.message).join(', ')}`);
      }

      const stats = {
        totalUsers: (usersCount as any).count || 0,
        totalBuyers: (buyersCount as any).count || 0,
        totalSellers: (sellersCount as any).count || 0,
        totalArtworks: (artworksCount as any).count || 0,
        pendingArtworks: (pendingCount as any).count || 0,
      };

      setAdminStats(stats);
      setLastFetch(prev => ({ ...prev, admin: Date.now() }));
    } catch (err: any) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Failed to fetch admin stats');
    } finally {
      setIsLoading(false);
    }
  }, [shouldRefetch, adminStats]);

  const clearCache = useCallback(() => {
    setTrendingProducts([]);
    setAdminStats(null);
    setLastFetch({});
    setError(null);
  }, []);

  // Preload trending products on mount
  useEffect(() => {
    refreshTrendingProducts();
  }, [refreshTrendingProducts]);

  const value: DataContextType = {
    trendingProducts,
    adminStats,
    isLoading,
    error,
    refreshTrendingProducts,
    refreshAdminStats,
    clearCache,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
} 