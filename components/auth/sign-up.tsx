"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            account_number: formData.accountNumber,
            user_type: userType,
            receive_updates: formData.receiveUpdates,
          },
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error signing up",
          description: error.message,
        });
      } else {
        toast({
          title: "Success",
          description: "Check your email to confirm your account.",
        });
        onClose();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
            <span className="text-lg font-semibold">Buy</span>
            <span className="text-sm text-muted-foreground mt-2 px-4">
              Browse and collect
              <br />
              unique pieces
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-32 flex flex-col"
            onClick={() => setUserType("seller")}
          >
            <span className="text-lg font-semibold">Sell</span>
            <span className="text-sm text-muted-foreground mt-2 px-4">
              Share and monetize
              <br />
              your collection
            </span>
          </Button>
        </div>
        <div className="text-center">
          <Button
            variant="link"
            onClick={onModeChange}
            className="text-sm text-muted-foreground"
          >
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">
          {userType === "buyer" ? "Buyer" : "Seller"} Registration
        </h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>
      </div>

      {userType === "buyer" && (
        <div className="space-y-2">
          <Label htmlFor="accountNumber">
            Account Number (if you have bought or sold through AI Curator before)
          </Label>
          <Input
            id="accountNumber"
            type="text"
            value={formData.accountNumber}
            onChange={(e) =>
              setFormData({ ...formData, accountNumber: e.target.value })
            }
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Checkbox
          id="receiveUpdates"
          checked={formData.receiveUpdates}
          onCheckedChange={(checked: boolean) =>
            setFormData({ ...formData, receiveUpdates: checked })
          }
        />
        <Label htmlFor="receiveUpdates">
          Receive regular updates on new collectibles
        </Label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => setUserType(null)}
        >
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Creating Account..." : "Continue"}
        </Button>
      </div>

      <div className="text-center pt-2">
        <Button
          variant="link"
          onClick={onModeChange}
          className="text-sm text-muted-foreground"
        >
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
}