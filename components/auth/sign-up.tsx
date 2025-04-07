"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

interface SignUpProps {
  onModeChange: () => void;
  onClose: () => void;
}

type UserType = "buyer" | "seller" | null;

interface FormData {
  email: string;
  password: string;
  title: string;
  firstName: string;
  lastName: string;
  accountNumber?: string;
  receiveUpdates: boolean;
}

export default function SignUp({ onModeChange, onClose }: SignUpProps) {
  const [userType, setUserType] = useState<UserType>(null);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    title: "",
    firstName: "",
    lastName: "",
    accountNumber: "",
    receiveUpdates: false,
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    setLoading(true);

    try {
      // 1. Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: userType,
            receive_updates: formData.receiveUpdates,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // 2. Create the user's profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            user_type: userType,
            receive_updates: formData.receiveUpdates,
            account_number: formData.accountNumber || null,
          });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Account created successfully! You can now sign in.",
        });
        onClose();
        router.refresh();
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!userType) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium">I want to...</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-32 flex flex-col"
            onClick={() => setUserType("buyer")}
          >
            <span className="text-2xl mb-2">🛍️</span>
            <span>Buy Art & Collectibles</span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col"
            onClick={() => setUserType("seller")}
          >
            <span className="text-2xl mb-2">🎨</span>
            <span>Sell Art & Collectibles</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          minLength={6}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          required
        />
      </div>

      {userType === "seller" && (
        <div className="space-y-2">
          <Label htmlFor="accountNumber">Account Number (Optional)</Label>
          <Input
            id="accountNumber"
            value={formData.accountNumber}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="receiveUpdates"
          checked={formData.receiveUpdates}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, receiveUpdates: checked as boolean })
          }
        />
        <Label htmlFor="receiveUpdates" className="text-sm">
          I want to receive updates about new artworks and events
        </Label>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onModeChange}
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
}