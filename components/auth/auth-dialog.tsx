"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import SignIn from './sign-in';
import SignUp from './sign-up';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthDialog({ open, onOpenChange, initialMode = 'signin' }: AuthDialogProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'signin' ? 'Sign In' : 'Create Account'}</DialogTitle>
          <DialogDescription>
            {mode === 'signin' 
              ? 'Enter your credentials to access your account'
              : 'Create a new account to start selling your artwork'
            }
          </DialogDescription>
        </DialogHeader>
        {mode === 'signin' ? (
          <SignIn onModeChange={() => setMode('signup')} onClose={() => onOpenChange(false)} />
        ) : (
          <SignUp onModeChange={() => setMode('signin')} onClose={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}