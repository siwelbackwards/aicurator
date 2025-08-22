"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SignIn from './sign-in';
import SignUp from './sign-up';
import BuyerOnboarding from './buyer-onboarding';
import SellerRegistration from './seller-registration';
import { supabase } from "@/lib/supabase-client";

type AuthMode = "signIn" | "signUp" | "buyerOnboarding" | "sellerRegistration";

interface AuthDialogProps {
  isOpen?: boolean;
  open?: boolean; // Support both naming conventions
  onOpenChange: (open: boolean) => void;
  initialMode?: AuthMode;
  redirectPath?: string;
  onAuthSuccess?: () => void; // New callback for successful authentication
}

export default function AuthDialog({
  isOpen,
  open,
  onOpenChange,
  initialMode = "signIn",
  redirectPath,
  onAuthSuccess,
}: AuthDialogProps) {
  // Support both open and isOpen props
  const isDialogOpen = isOpen !== undefined ? isOpen : open;
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || '');
      }
    };
    
    if (isDialogOpen) {
      checkUser();
    }
  }, [isDialogOpen]);

  const handleModeChange = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
  };

  const handleSignUpComplete = (id: string, email: string) => {
    setUserId(id);
    setUserEmail(email);
    setMode("buyerOnboarding");
  };

  const handleSellerSignUp = () => {
    setMode("sellerRegistration");
  };

  const handleRegistrationComplete = () => {
    onOpenChange(false);
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  const handleAuthSuccess = () => {
    onOpenChange(false);
    if (onAuthSuccess) {
      onAuthSuccess();
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "signIn":
        return "Member Log In";
      case "signUp":
        return "Get Started";
      case "buyerOnboarding":
        return "Buyer Registration";
      case "sellerRegistration":
        return "Seller Registration";
      default:
        return "Authentication";
    }
  };

  const getDialogWidth = () => {
    switch (mode) {
      case "buyerOnboarding":
      case "sellerRegistration":
        return "sm:max-w-md p-0 overflow-hidden";
      default: 
        return "sm:max-w-[425px] p-0 overflow-hidden";
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogWidth()}>
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold text-center">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>
        
        {mode === "signIn" && (
          <SignIn
            onModeChange={() => setMode("signUp")}
            onClose={() => onOpenChange(false)}
            onAuthSuccess={handleAuthSuccess}
            redirectPath={redirectPath}
          />
        )}
        
        {mode === "signUp" && (
          <SignUp
            onModeChange={() => setMode("signIn")}
            onSignUpComplete={handleSignUpComplete}
            onSellerSignUp={handleSellerSignUp}
            onClose={() => onOpenChange(false)}
            onAuthSuccess={handleAuthSuccess}
            redirectPath={redirectPath}
          />
        )}

        {mode === "buyerOnboarding" && (
          <BuyerOnboarding
            userId={userId || ""}
            userEmail={userEmail || ""}
            onComplete={handleRegistrationComplete}
            onAuthSuccess={handleAuthSuccess}
            redirectPath={redirectPath}
          />
        )}

        {mode === "sellerRegistration" && (
          <SellerRegistration
            onComplete={handleRegistrationComplete}
            onAuthSuccess={handleAuthSuccess}
            redirectPath={redirectPath}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}