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
      console.log('🔍 Data Context: Fetching trending products...');

      // Try to get admin-selected trending products first
      let adminSelectedProducts = null;

      try {
        // Try the Netlify function first (for production)
        let response = await fetch(`${typeof window !== 'undefined' ? '' : 'http://localhost:9000'}/.netlify/functions/admin-trending-products`);
        console.log('📡 Data Context: Netlify function response status:', response.status);

        if (response.ok) {
          const adminData = await response.json();
          adminSelectedProducts = adminData.filter((tp: any) => tp.is_active);
          console.log('✅ Data Context: Found admin-selected products:', adminSelectedProducts.length);
        }
      } catch (netlifyError) {
        console.log('❌ Data Context: Netlify function failed, trying direct Supabase...');
      }

      // If no admin-selected products or function failed, try direct Supabase
      if (!adminSelectedProducts || adminSelectedProducts.length === 0) {
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admin_trending_products')
            .select(`
              *,
              artwork:artworks(
                id,
                title,
                artist_name,
                price,
                currency,
                category,
                description,
                images:artwork_images(file_path, is_primary)
              )
            `)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          if (!adminError && adminData) {
            adminSelectedProducts = adminData.map((tp: any) => ({
              ...tp.artwork,
              images: tp.artwork?.images || []
            })).filter(Boolean);
            console.log('✅ Data Context: Found admin-selected products from direct query:', adminSelectedProducts.length);
          }
        } catch (directError) {
          console.log('❌ Data Context: Direct Supabase query failed:', directError);
        }
      }

      // If we have admin-selected products, use them
      if (adminSelectedProducts && adminSelectedProducts.length > 0) {
        console.log('🎯 Data Context: Using admin-selected trending products');
        setTrendingProducts(adminSelectedProducts);
        setLastFetch(prev => ({ ...prev, trending: Date.now() }));
      } else {
        // Fallback to automatic selection (highest priced)
        console.log('🔄 Data Context: No admin-selected products, using automatic selection');
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
          'Fetch trending products (fallback)'
        );

        if (error) throw error;

        setTrendingProducts((artworks as any[]) || []);
        setLastFetch(prev => ({ ...prev, trending: Date.now() }));
      }
    } catch (err: any) {
      console.error('❌ Data Context: Error fetching trending products:', err);
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
      console.log('🔧 Data Context: Fetching admin stats...');

      // Fetch all stats in parallel with retry logic
      const [usersCount, buyersCount, sellersCount, artworksCount, pendingCount] = await Promise.all([
        withSupabaseRetry(
          () => supabase.from('profiles').select('*', { count: 'exact', head: true }),
          'Count total users'
        ),
        withSupabaseRetry(
          () => supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'buyer'),
          'Count buyers'
        ),
        withSupabaseRetry(
          () => supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'seller'),
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

      // Debug logging
      console.log('📊 Admin stats query results:', {
        users: { count: (usersCount as any).count, error: usersCount.error },
        buyers: { count: (buyersCount as any).count, error: buyersCount.error },
        sellers: { count: (sellersCount as any).count, error: sellersCount.error },
        artworks: { count: (artworksCount as any).count, error: artworksCount.error },
        pending: { count: (pendingCount as any).count, error: pendingCount.error }
      });

      // Check for errors
      const errors = [usersCount.error, buyersCount.error, sellersCount.error, artworksCount.error, pendingCount.error]
        .filter(Boolean);

      if (errors.length > 0) {
        console.error('❌ Admin stats errors:', errors);
        throw new Error(`Failed to fetch stats: ${errors.map(e => e?.message).join(', ')}`);
      }

      const stats = {
        totalUsers: (usersCount as any).count || 0,
        totalBuyers: (buyersCount as any).count || 0,
        totalSellers: (sellersCount as any).count || 0,
        totalArtworks: (artworksCount as any).count || 0,
        pendingArtworks: (pendingCount as any).count || 0,
      };

      console.log('✅ Admin stats calculated:', stats);
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