"use client";

import { supabase, refreshSession, isSessionValid } from '@/lib/supabase-client';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (error: any) => boolean;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  shouldRetry: (error: any) => {
    // Retry on auth errors, network errors, or token expired errors
    const shouldRetry = 
      error?.message?.includes('JWT') ||
      error?.message?.includes('invalid_token') ||
      error?.message?.includes('token_expired') ||
      error?.message?.includes('Session not found') ||
      error?.code === 'PGRST301' || // JWT expired
      error?.code === 'PGRST302' || // JWT invalid
      error?.status === 401 ||
      error?.status === 403;
    
    console.log('🔍 Retry check:', { 
      error: error?.message, 
      code: error?.code, 
      status: error?.status, 
      shouldRetry 
    });
    
    return shouldRetry;
  }
};

class SupabaseRetryWrapper {
  private static instance: SupabaseRetryWrapper;
  private retryConfig: Required<RetryConfig>;

  constructor(config: RetryConfig = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  static getInstance(config?: RetryConfig): SupabaseRetryWrapper {
    if (!SupabaseRetryWrapper.instance) {
      SupabaseRetryWrapper.instance = new SupabaseRetryWrapper(config);
    }
    return SupabaseRetryWrapper.instance;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async ensureValidSession(): Promise<boolean> {
    try {
      // Check if current session is valid
      const isValid = await isSessionValid();
      
      if (!isValid) {
        console.log('🔄 Session invalid, attempting refresh...');
        const refreshed = await refreshSession();
        
        if (!refreshed) {
          console.log('❌ Session refresh failed');
          return false;
        }
        
        console.log('✅ Session refreshed successfully');
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error ensuring valid session:', error);
      return false;
    }
  }

  async executeWithRetry<T>(
    operation: () => Promise<{ data: T; error: any }>,
    operationName: string = 'Supabase operation'
  ): Promise<{ data: T; error: any }> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} - Attempt ${attempt}/${this.retryConfig.maxRetries}`);
        
        // Ensure we have a valid session before the operation
        if (attempt > 1) {
          const sessionValid = await this.ensureValidSession();
          if (!sessionValid) {
            console.log('❌ Could not ensure valid session for retry');
            return {
              data: null as T,
              error: { 
                message: 'Authentication session expired. Please member log in again.',
                code: 'SESSION_EXPIRED'
              }
            };
          }
        }
        
        const result = await operation();
        
        if (result.error && this.retryConfig.shouldRetry(result.error)) {
          console.log(`⚠️ ${operationName} failed (attempt ${attempt}):`, result.error);
          lastError = result.error;
          
          if (attempt < this.retryConfig.maxRetries) {
            console.log(`🕐 Waiting ${this.retryConfig.retryDelay}ms before retry...`);
            await this.sleep(this.retryConfig.retryDelay * attempt); // Exponential backoff
            continue;
          }
        }
        
        if (result.error) {
          console.log(`❌ ${operationName} failed (non-retryable):`, result.error);
        } else {
          console.log(`✅ ${operationName} completed successfully`);
        }
        
        return result;
      } catch (error) {
        console.error(`❌ ${operationName} exception (attempt ${attempt}):`, error);
        lastError = error;
        
        if (attempt < this.retryConfig.maxRetries && this.retryConfig.shouldRetry(error)) {
          await this.sleep(this.retryConfig.retryDelay * attempt);
          continue;
        }
        
        return {
          data: null as T,
          error: error
        };
      }
    }
    
    return {
      data: null as T,
      error: lastError || new Error(`${operationName} failed after ${this.retryConfig.maxRetries} attempts`)
    };
  }

  // Wrapper for SELECT operations
  async select<T>(
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    operationName?: string
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(
      queryFn,
      operationName || 'SELECT query'
    );
  }

  // Wrapper for INSERT operations
  async insert<T>(
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    operationName?: string
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(
      queryFn,
      operationName || 'INSERT query'
    );
  }

  // Wrapper for UPDATE operations
  async update<T>(
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    operationName?: string
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(
      queryFn,
      operationName || 'UPDATE query'
    );
  }

  // Wrapper for DELETE operations
  async delete<T>(
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    operationName?: string
  ): Promise<{ data: T[] | null; error: any }> {
    return this.executeWithRetry(
      queryFn,
      operationName || 'DELETE query'
    );
  }

  // Wrapper for COUNT operations
  async count(
    queryFn: () => Promise<{ data: any; error: any; count?: number }>,
    operationName?: string
  ): Promise<{ data: any; error: any; count: number | null }> {
    const result = await this.executeWithRetry(
      queryFn,
      operationName || 'COUNT query'
    );
    
    return {
      ...result,
      count: (result.data as any)?.count || 0
    };
  }
}

// Export singleton instance
export const supabaseRetry = SupabaseRetryWrapper.getInstance();

// Export factory function for custom configs
export const createSupabaseRetry = (config?: RetryConfig) => 
  new SupabaseRetryWrapper(config);

// Utility function to wrap any Supabase operation with retry logic
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T; error: any }>,
  operationName?: string,
  config?: RetryConfig
): Promise<{ data: T; error: any }> {
  const retryWrapper = config ? 
    new SupabaseRetryWrapper(config) : 
    supabaseRetry;
    
  return retryWrapper.executeWithRetry(operation, operationName);
}

// Hook for React components
export function useSupabaseRetry(config?: RetryConfig) {
  return config ? createSupabaseRetry(config) : supabaseRetry;
} 