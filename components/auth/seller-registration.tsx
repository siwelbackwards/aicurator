"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const titles = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Sir", "Lady", "Lord"];
const artCategories = ["Paintings", "Sculptures", "Digital Art", "Photography", "Prints", "Mixed Media", "Other"];

interface SellerRegistrationProps {
  onComplete: () => void;
  onAuthSuccess?: () => void;
  redirectPath?: string;
}

export default function SellerRegistration({ onComplete, onAuthSuccess, redirectPath }: SellerRegistrationProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    title: "",
    firstName: "",
    lastName: "",
    businessName: "",
    website: "",
    phone: "",
    addressLine1: "",
    city: "",
    country: "",
    postcode: "",
    vatNumber: "",
    categories: [] as string[],
    acceptTerms: false
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (!formData.acceptTerms) {
      setError("You must accept the terms and conditions");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Register the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: 'seller',
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Generate full name from first and last name
        const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
        
        // Create the seller profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            full_name: fullName,
            user_type: 'seller',
            email: formData.email,
            business_name: formData.businessName,
            website: formData.website,
            phone: formData.phone,
            full_address: `${formData.addressLine1}, ${formData.city}, ${formData.country}, ${formData.postcode}`.trim(),
            vat_number: formData.vatNumber,
            interested_categories: formData.categories,
            onboarding_completed: true,
            role: 'seller',
            updated_at: new Date()
          });

        if (profileError) {
          console.error('Error creating seller profile:', profileError);
          throw profileError;
        }
        
        // Create user settings with default values
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: authData.user.id,
            notifications: {
              email: true,
              updates: true,
              marketing: true // Sellers typically want marketing
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (settingsError) {
          console.error('Error creating user settings for seller:', settingsError);
          // Continue even if this fails, it's not critical
        } else {
          console.log('Created user settings for seller:', authData.user.id);
        }

        toast.success('Seller account created successfully!');
        
        // Sign in the user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (signInError) {
          console.error('Error signing in after registration:', signInError);
          toast.error('Account created but sign-in failed. Please sign in manually.');
        }

        onComplete();
        
        // Redirect to dashboard or a welcome page
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred during registration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div className="bg-primary text-white p-4 text-center">
        <h2 className="font-bold text-xl">Seller Registration</h2>
      </div>
      
      <div className="p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="font-semibold text-xl mb-2">Create Seller Account</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Complete your registration to start selling your unique collectables.
        </p>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700 mb-4">
            <p className="font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="Your email"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateForm('password', e.target.value)}
                placeholder="Your password"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="passwordConfirm">Confirm Password</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => updateForm('passwordConfirm', e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Select 
              value={formData.title}
              onChange={(value) => updateForm('title', value)}
              as="div"
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select title">{formData.title || "Select title"}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {titles.map(title => (
                  <SelectItem key={title} value={title}>{title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateForm('firstName', e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateForm('lastName', e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="businessName">Business Name (if applicable)</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => updateForm('businessName', e.target.value)}
              placeholder="Your business name"
            />
          </div>

          <div>
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => updateForm('website', e.target.value)}
              placeholder="https://your-website.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateForm('phone', e.target.value)}
              placeholder="+44"
              required
            />
          </div>

          <div>
            <Label htmlFor="addressLine1">Address Line</Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => updateForm('addressLine1', e.target.value)}
              placeholder="Street address"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateForm('city', e.target.value)}
                placeholder="City"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => updateForm('postcode', e.target.value)}
                placeholder="Postcode"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => updateForm('country', e.target.value)}
              placeholder="Country"
              required
            />
          </div>

          <div>
            <Label htmlFor="vatNumber">VAT Number (if applicable)</Label>
            <Input
              id="vatNumber"
              value={formData.vatNumber}
              onChange={(e) => updateForm('vatNumber', e.target.value)}
              placeholder="VAT number"
            />
          </div>

          <div>
            <Label className="mb-2 block">Art Categories You Sell</Label>
            <div className="grid grid-cols-2 gap-2">
              {artCategories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category}`}
                    checked={formData.categories.includes(category)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateForm('categories', [...formData.categories, category]);
                      } else {
                        updateForm('categories', formData.categories.filter(c => c !== category));
                      }
                    }}
                  />
                  <Label htmlFor={`category-${category}`} className="text-sm cursor-pointer">
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox 
              id="acceptTerms" 
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => updateForm('acceptTerms', checked)}
              className="mt-1"
            />
            <Label 
              htmlFor="acceptTerms" 
              className="text-sm font-normal"
            >
              I agree to the Terms and Conditions and Privacy Policy, including consent to electronic communications and I am at least 18 years old.
            </Label>
          </div>

          <Button 
            type="submit" 
            className="w-full py-3" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Complete Registration'}
          </Button>
        </form>
      </div>
    </div>
  );
} 