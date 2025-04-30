"use client";

import SignIn from './sign-in';
import SignUp from './sign-up';
import { supabase } from "@/lib/supabase-client";

interface AuthFormProps {
  variant: "sign-in" | "sign-up";
  onModeChange?: () => void;
  onClose?: () => void;
}

export default function AuthForm({ variant, onModeChange, onClose }: AuthFormProps) {
  return (
    <>
      {variant === "sign-in" ? (
        <SignIn onModeChange={onModeChange || (() => {})} onClose={onClose || (() => {})} />
      ) : (
        <SignUp onModeChange={onModeChange || (() => {})} onClose={onClose || (() => {})} />
      )}
    </>
  );
} 