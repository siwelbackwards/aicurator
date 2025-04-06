"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SignIn from './sign-in';
import SignUp from './sign-up';

type Mode = 'signin' | 'signup';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: Mode;
}

export default function AuthDialog({
  isOpen,
  onClose,
  initialMode = 'signin',
}: AuthDialogProps) {
  const [mode, setMode] = useState<Mode>(initialMode);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>
        {mode === 'signin' ? (
          <SignIn onModeChange={() => setMode('signup')} onClose={onClose} />
        ) : (
          <SignUp onModeChange={() => setMode('signin')} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}