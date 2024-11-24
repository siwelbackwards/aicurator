"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SignInProps {
  onModeChange: () => void;
  onClose: () => void;
}

export default function SignIn({ onModeChange, onClose }: SignInProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      onClose();
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="relative h-40 -mx-6 -mt-6 mb-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://s3-alpha-sig.figma.com/img/7b02/bcd3/201ac4886d1756b3a3480f026737b155?Expires=1733097600&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=k25qe0TLX0A0yJct5Myp7xMTHyd1R9NZ1u2TRhNJCTvl35qW41T4cCjzQzvMofkMsKHQgjeCE1cS6l4eMgHRgJOzbchSjEpkcQXyagViuSFcuYVT72tRsIrNx5umjfTkexFoCYOcdeAAIjMt0JSdGj57yvG-KRcsYmFk8kt5eeG1u5lfTf0G74Z3m-KCvFegxS1GDd6cLcOlNofzuA~uoFNHbrc9RtD9WCw4oqiSiwfDIKrQqsYU0o303W-qYCO-16jUNzEl0tnUf5rYidu1i-Kye6QBhHyuEQWkYKe1RQFyp~JZ7R-IjFxRco4CVt-5MG90NMHrXtL6AwVCTgQHkw__')`
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-200">We're excited to have you as part of our community!</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <form onSubmit={handleSignIn} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2"
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => {/* Handle forgot password */}}
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={onModeChange}
              className="text-primary hover:underline font-medium"
            >
              Get Started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}