"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SignUpProps {
  onModeChange: () => void;
  onClose: () => void;
}

type UserType = 'buyer' | 'seller' | null;

export default function SignUp({ onModeChange, onClose }: SignUpProps) {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    title: '',
    firstName: '',
    lastName: '',
    accountNumber: '',
    receiveUpdates: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    
    setLoading(true);
    setError('');

    try {
      // First create the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            account_number: formData.accountNumber,
            user_type: userType,
            receive_updates: formData.receiveUpdates
          }
        }
      });

      if (signUpError) throw signUpError;

      // Immediately sign in the user after successful signup
      if (authData.user) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) throw signInError;
      }
      
      onClose();
      router.refresh();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div>
        <div className="relative h-40 -mx-6 -mt-6 mb-6">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('/images/categories/art.webp')`
            }}
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-2xl font-bold text-white">Join Our Community</h2>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-medium text-center mb-6">I want to...</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-32 flex flex-col"
              onClick={() => setUserType('buyer')}
            >
              <span className="text-lg font-semibold">Buy</span>
              <span className="text-sm text-gray-600 mt-2 px-4">
                Browse and collect
                <br />
                unique pieces
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-32 flex flex-col"
              onClick={() => setUserType('seller')}
            >
              <span className="text-lg font-semibold">Sell</span>
              <span className="text-sm text-gray-600 mt-2 px-4">
                Share and monetize
                <br />
                your collection
              </span>
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={onModeChange}
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-40 -mx-6 -mt-6 mb-6">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/images/categories/art.webp')`
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="px-6 pb-6">
        <h2 className="text-2xl font-bold mb-4">Create an account</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div>
            <Input
              placeholder="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          {userType === 'buyer' && (
            <div>
              <Input
                placeholder="Account Number (if you have bought or sold through AI Curator before)"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="receiveUpdates"
              checked={formData.receiveUpdates}
              onChange={(e) => setFormData({ ...formData, receiveUpdates: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="receiveUpdates">
              Receive regular updates on new collectibles
            </Label>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setUserType(null)}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Creating Account...' : 'Continue'}
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={onModeChange}
              className="text-primary hover:underline font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}