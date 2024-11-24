"use client";

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import SignIn from './sign-in';
import SignUp from './sign-up';

export type AuthMode = 'signin' | 'signup';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}

export default function AuthDialog({ isOpen, onClose, initialMode = 'signin' }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0">
        {mode === 'signin' ? (
          <SignIn onModeChange={() => setMode('signup')} onClose={onClose} />
        ) : (
          <SignUp onModeChange={() => setMode('signin')} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}