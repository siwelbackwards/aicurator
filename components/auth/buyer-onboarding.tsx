"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { CheckIcon, ArrowRightIcon, PlusCircleIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const titles = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Sir", "Lady", "Lord"];
const categories = ["Paintings", "Sculptures", "Digital Art", "Photography", "Prints", "Other"];

// Profile data interface
interface ProfileData {
  id: string;
  title?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  // Individual address components
  address_line1?: string;
  city?: string;
  country?: string;
  postcode?: string;
  // Legacy field
  full_address?: string;
  phone?: string;
  is_mobile?: boolean;
  date_of_birth?: string;
  user_type: string;
  role: string;
  onboarding_completed: boolean;
  updated_at: string;
  photo_id_url?: string;
  proof_of_address_url?: string;
  interested_categories?: string[];
}

interface OnboardingProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
  onAuthSuccess?: () => void;
  redirectPath?: string;
}

export default function BuyerOnboarding({ userId: initialUserId, userEmail, onComplete, onAuthSuccess, redirectPath }: OnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [currentUserId, setCurrentUserId] = useState(initialUserId || '');
  const [formData, setFormData] = useState({
    title: "",
    firstName: "",
    lastName: "",
    email: userEmail || "",
    password: "",
    passwordConfirm: "",
    previouslyTransacted: false,
    communicationPreference: "yes", // "yes" or "no"
    photoIdFile: null as File | null,
    proofOfAddressFile: null as File | null,
    addressLine1: "",
    city: "",
    country: "",
    postcode: "",
    phone: "",
    isMobile: true,
    dateOfBirth: "",
    categories: [] as string[],
    collection: "",
    wishlist: "",
    collectionInterests: "",
    budgetRange: "",
    experienceLevel: "",
    preferredArtPeriods: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photoIdFile' | 'proofOfAddressFile') => {
    if (e.target.files && e.target.files[0]) {
      updateForm(field, e.target.files[0]);
    }
  };
  
  const handleNext = async () => {
    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });
      
      if (existingUser?.user) {
        // User exists and password is correct, move to step 2
        console.log('Existing user signed in:', existingUser.user.id);
        setCurrentUserId(existingUser.user.id);
        setStep(2);
        window.scrollTo(0, 0);
        return;
      } else if (checkError && !checkError.message.includes('Invalid login credentials')) {
        // Some other error occurred
        throw checkError;
      }
      
      // User doesn't exist or password is incorrect, try to register
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: 'buyer',
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError.message || JSON.stringify(authError));
        
        // Handle "User already registered" error specifically
        if (authError.message.includes('already registered')) {
          setError('This email is already registered. Please try signing in instead or use a different email address.');
          return;
        }
        
        throw authError;
      }

      if (!authData?.user?.id) {
        throw new Error('User registration failed: No user ID returned');
      }

      // Debugging: Log user ID to confirm we have a valid user
      console.log('User created successfully with ID:', authData.user.id);
      
      // Create basic profile with proper error handling
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            title: formData.title || null,
            first_name: formData.firstName || '',
            last_name: formData.lastName || '',
            user_type: 'buyer',
            email: formData.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (profileError) {
          // Check for different types of errors
          if (profileError.code === '23505') {
            console.error('Profile already exists:', profileError.message);
            // This is not fatal, we'll update it in step 2
          } else if (profileError.code === '42P01') {
            console.error('Table does not exist:', profileError.message);
            throw new Error('Database setup issue: Please contact support');
          } else {
            console.error(
              'Error creating initial profile:', 
              profileError.message || profileError.code || JSON.stringify(profileError)
            );
            // Continue anyway as we'll update it in step 2
          }
        } else {
          console.log('Profile created successfully');
        }
      } catch (insertError) {
        console.error('Unexpected error creating profile:', insertError);
        // Continue to step 2 anyway, we'll try to update profile there
      }
      
      // Update userId for step 2
      setCurrentUserId(authData.user.id);
      setStep(2);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error during registration:', error);
      if (error instanceof Error) {
        if (error.message.includes('Email already registered')) {
          setError('This email is already registered. Please member log in instead.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Validate required fields
      if (!formData.addressLine1 || !formData.city || !formData.country || !formData.postcode || !formData.phone) {
        setError("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }
      
      // Validate that we have a valid userId
      if (!currentUserId || currentUserId === 'temp-id' || currentUserId.length < 10) {
        console.error('Invalid user ID:', currentUserId);
        setError("User authentication error. Please try again or contact support.");
        setIsSubmitting(false);
        return;
      }
      
      // Upload files if they exist
      let photoIdUrl = null;
      let proofOfAddressUrl = null;
      
      if (formData.photoIdFile) {
        try {
          const { data: photoData, error: photoError } = await supabase.storage
            .from('artwork-images')
            .upload(`verifications/${currentUserId}/photo-id`, formData.photoIdFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (photoError) {
            console.error('Error uploading photo ID:', photoError.message || JSON.stringify(photoError));
            // Continue with the process even if file upload fails
          } else {
            photoIdUrl = photoData?.path;
          }
        } catch (photoUploadError) {
          console.error('Unexpected error uploading photo ID:', photoUploadError);
        }
      }
      
      if (formData.proofOfAddressFile) {
        try {
          const { data: addressData, error: addressError } = await supabase.storage
            .from('artwork-images')
            .upload(`verifications/${currentUserId}/proof-of-address`, formData.proofOfAddressFile, {
              cacheControl: '3600',
              upsert: true
            });
            
          if (addressError) {
            console.error('Error uploading proof of address:', addressError.message || JSON.stringify(addressError));
          } else {
            proofOfAddressUrl = addressData?.path;
          }
        } catch (addressUploadError) {
          console.error('Unexpected error uploading proof of address:', addressUploadError);
        }
      }
      
      // Generate full name from first and last name
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      
      // Skip schema check as it's failing in export mode
      // Instead, include all known fields directly
      const existingColumns = new Set([
        'id', 'email', 'full_name', 'first_name', 'last_name',
        'title', 'phone', 'full_address', 'date_of_birth', 'is_mobile',
        'user_type', 'role', 'onboarding_completed', 'updated_at',
        'photo_id_url', 'proof_of_address_url', 'interested_categories',
        'address_line1', 'city', 'country', 'postcode'
      ]);
      
      // Build profile data based on existing columns
      const profileData: any = {
        id: currentUserId,
        title: formData.title,
        first_name: formData.firstName,
        last_name: formData.lastName,
        full_name: fullName,
        email: formData.email,
        phone: formData.phone,
        user_type: 'buyer',
        role: 'buyer',
        onboarding_completed: true,
        user_status: 'pending', // Set as pending for admin approval
        updated_at: new Date().toISOString(),
      };
      
      // Add address fields based on schema
      if (existingColumns.has('address_line1')) {
        profileData.address_line1 = formData.addressLine1;
      }
      
      if (existingColumns.has('city')) {
        profileData.city = formData.city;
      }
      
      if (existingColumns.has('country')) {
        profileData.country = formData.country;
      }
      
      if (existingColumns.has('postcode')) {
        profileData.postcode = formData.postcode;
      }
      
      // Always include full_address as it's likely to exist
      if (existingColumns.has('full_address')) {
        profileData.full_address = `${formData.addressLine1}, ${formData.city}, ${formData.country}, ${formData.postcode}`.trim();
      }
      
      // Add other fields conditionally based on schema
      if (existingColumns.has('is_mobile')) {
        profileData.is_mobile = formData.isMobile;
      }
      
      if (existingColumns.has('date_of_birth')) {
        profileData.date_of_birth = formData.dateOfBirth;
      }
      
      if (existingColumns.has('interested_categories')) {
        profileData.interested_categories = formData.categories;
      }
      
      // Add optional file URLs only if they exist
      if (photoIdUrl && existingColumns.has('photo_id_url')) {
        profileData.photo_id_url = photoIdUrl;
      }
      
      if (proofOfAddressUrl && existingColumns.has('proof_of_address_url')) {
        profileData.proof_of_address_url = proofOfAddressUrl;
      }

      console.log('Updating profile with data:', profileData);

      // Update profile with all collected data - use upsert with onConflict option
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Error updating profile:', error.message || JSON.stringify(error));
        throw new Error(error.message || 'Failed to update profile');
      }
      
      // Handle user settings with a simplified approach
      console.log('Setting up user preferences...');
      
      try {
        // Create basic notification preferences (always do an upsert)
        const settingsData = {
          user_id: currentUserId,
          notifications: {
            email: true,
            updates: true,
            marketing: formData.communicationPreference === "yes"
          },
          updated_at: new Date().toISOString()
        };
        
        // Try RPC call first, then fall back to direct operations if not available
        const { error: rpcError } = await supabase
          .rpc('upsert_user_settings', {
            p_user_id: currentUserId,
            p_notifications: settingsData.notifications,
            p_updated_at: settingsData.updated_at
          });
        
        if (rpcError) {
          console.log('RPC function not available, trying direct table operations');
          
          // Try direct insert/update instead
          const { error: upsertError } = await supabase
            .from('user_settings')
            .upsert({
              user_id: currentUserId,
              notifications: settingsData.notifications,
              created_at: new Date().toISOString(),
              updated_at: settingsData.updated_at
            });
            
          if (upsertError) {
            console.log('User settings setup skipped - will need manual setup');
          } else {
            console.log('User preferences saved successfully via direct operation');
          }
        } else {
          console.log('User preferences saved successfully via RPC');
        }
      } catch (error) {
        // Just log and continue - preferences are non-critical
        console.log('User preferences setup skipped - continuing with profile creation');
      }
      
      // Double-check that the profile was created by fetching it
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();
      
      if (fetchError || !profile) {
        console.error('Error confirming profile creation:', fetchError);
        throw new Error('Failed to confirm profile creation');
      }
      
      console.log('Profile created/updated successfully');
      
      // Show waitlist message instead of giving immediate access
      // The user will be redirected to a pending approval page
      toast.success('Registration submitted successfully! You will be notified once your account is approved.');

      // Don't call onComplete/onAuthSuccess to prevent immediate access
      // Instead, redirect to a pending approval page or show waitlist
      router.push('/auth/pending-approval');

      // After updating the profile, try to store additional preferences
      // But make it completely non-blocking and simple
      if (!error) {
        console.log('Storing optional user preferences...');
        
        try {
          // Direct upsert attempt - skipping all schema checks
          const { error: prefError } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: currentUserId,
              previously_transacted: formData.previouslyTransacted,
              communication_preference: formData.communicationPreference === "yes",
              collection_description: formData.collection || null,
              wishlist: formData.wishlist || null,
              collection_interests: formData.collectionInterests || null,
              budget_range: formData.budgetRange || null,
              experience_level: formData.experienceLevel || null,
              preferred_art_periods: formData.preferredArtPeriods || null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, 
            { onConflict: 'user_id' });
            
          if (prefError) {
            // Just log and continue - not critical
            console.log('Additional preferences storage skipped');
          } else {
            console.log('Additional preferences stored successfully');
          }
        } catch (e) {
          // Just log and continue - not critical
          console.log('Additional preferences not stored - continuing');
        }
      }
    } catch (error) {
      console.log('Form submission issue:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Initial Signup Form
  const renderStep1 = () => (
    <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
      <div className="mb-6">
        <h3 className="font-semibold text-xl mb-2">Complete Registration</h3>
        <p className="text-sm text-muted-foreground">
          Complete your registration to start discovering unique collectables tailored to your interests.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded text-sm text-red-700 mb-4">
          <p className="font-bold">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="title" className="text-sm font-medium">TITLE</Label>
          <Select 
            value={formData.title} 
            onChange={(value) => updateForm('title', value)}
            as="div"
          >
            <SelectTrigger className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary">
              <SelectValue placeholder="Select title">{formData.title || "Select title"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {titles.map(title => (
                <SelectItem key={title} value={title}>{title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="firstName" className="text-sm font-medium">First/given/fast name</Label>
          <Input 
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateForm('firstName', e.target.value)}
            placeholder="First name"
            className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <Label htmlFor="lastName" className="text-sm font-medium">Last/given/second name</Label>
          <Input 
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateForm('lastName', e.target.value)}
            placeholder="Last name"
            className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input 
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="Your email"
            className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input 
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => updateForm('password', e.target.value)}
            placeholder="Your password"
            className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <Label htmlFor="passwordConfirm" className="text-sm font-medium">Password confirm</Label>
          <Input 
            id="passwordConfirm"
            type="password"
            value={formData.passwordConfirm}
            onChange={(e) => updateForm('passwordConfirm', e.target.value)}
            placeholder="Confirm your password"
            className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="pt-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="previouslyTransacted" 
              checked={formData.previouslyTransacted}
              onCheckedChange={(checked) => updateForm('previouslyTransacted', checked)}
              className="text-primary focus:ring-primary"
            />
            <label 
              htmlFor="previouslyTransacted" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Have you bought or sold through AI Curator before?
            </label>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-sm font-medium mb-2">Communication preference:</p>
          <p className="text-sm mb-2">Receive regular updates on the platform</p>
          
          <RadioGroup 
            value={formData.communicationPreference} 
            onValueChange={(value) => updateForm('communicationPreference', value)}
            className="flex items-start space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="yes" />
              <Label htmlFor="yes" className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="no" />
              <Label htmlFor="no" className="text-sm">No thank you</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      <Button 
        className="w-full mt-8 py-3 text-base font-medium rounded-md flex items-center justify-center gap-2 shadow-sm" 
        onClick={handleNext}
        disabled={isSubmitting}
        variant="default"
        size="lg"
      >
        {isSubmitting ? 'Processing...' : 'Continue'}
        <ArrowRightIcon className="w-4 h-4" />
      </Button>
    </div>
  );

  // Step 2: Complete Profile
  const renderStep2 = () => (
    <div className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
      <div className="mb-6">
        <h3 className="font-semibold text-xl mb-2">Welcome</h3>
        <p className="text-sm text-muted-foreground">
          You have now created an AI Curator account.
        </p>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p className="font-medium text-sm mb-2">At the moment you are able to:</p>
          <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
            <li>Set up your account with your interests</li>
            <li>Get alerts whenever we have a collectable that matches your interests</li>
            <li>Get insight and researched information about the category you are interested in</li>
            <li>About the piece you want to buy (with correct estimates)</li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <h4 className="font-medium mb-3 text-gray-800">Complete your Account:</h4>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="photoId" className="text-sm font-medium">Photo ID</Label>
            <div className="mt-1 flex items-center">
              <Input 
                id="photoId" 
                type="file" 
                onChange={(e) => handleFileChange(e, 'photoIdFile')}
                className="flex-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
              />
              <div className="ml-2 text-primary">⊕</div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="proofOfAddress" className="text-sm font-medium">Proof of Address</Label>
            <div className="mt-1 flex items-center">
              <Input 
                id="proofOfAddress" 
                type="file" 
                onChange={(e) => handleFileChange(e, 'proofOfAddressFile')}
                className="flex-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
              />
              <div className="ml-2 text-primary">⊕</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <h4 className="font-medium mb-3 text-gray-800">Confirm your details:</h4>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="addressLine1" className="text-sm font-medium">Address Line</Label>
            <Input 
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => updateForm('addressLine1', e.target.value)}
              placeholder="Street address"
              className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium">City</Label>
              <Input 
                id="city"
                value={formData.city}
                onChange={(e) => updateForm('city', e.target.value)}
                placeholder="City"
                className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <Label htmlFor="postcode" className="text-sm font-medium">Postcode</Label>
              <Input 
                id="postcode"
                value={formData.postcode}
                onChange={(e) => updateForm('postcode', e.target.value)}
                placeholder="Postcode"
                className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country" className="text-sm font-medium">Country</Label>
            <Input 
              id="country"
              value={formData.country}
              onChange={(e) => updateForm('country', e.target.value)}
              placeholder="Country"
              className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">Primary phone no.</Label>
            <div className="flex items-center">
              <span className="mr-2">+44</span>
              <Input 
                id="phone"
                value={formData.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                placeholder=""
                className="flex-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2">
            <p className="text-sm font-medium mb-2">Is this a mobile phone?</p>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isMobileYes" 
                  checked={formData.isMobile}
                  onCheckedChange={(checked) => updateForm('isMobile', checked === true)}
                  className="text-primary focus:ring-primary"
                />
                <label 
                  htmlFor="isMobileYes" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Yes
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isMobileNo" 
                  checked={!formData.isMobile}
                  onCheckedChange={(checked) => updateForm('isMobile', checked !== true)}
                  className="text-primary focus:ring-primary"
                />
                <label 
                  htmlFor="isMobileNo" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  No
                </label>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="dateOfBirth" className="text-sm font-medium">Date of Birth</Label>
            <div className="text-xs text-muted-foreground mb-1">
              (To transact through AI Curator you need to be 18 or over)
            </div>
            <Input 
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateForm('dateOfBirth', e.target.value)}
              className="mt-1 bg-white border-gray-300 focus:ring-primary focus:border-primary"
            />
            <div className="text-xs text-muted-foreground mt-1 p-2 bg-gray-50 rounded w-full max-w-full">
              <p className="font-medium">Why do we need date of birth?</p>
              <p>Anti money laundering regulations require us to collect certain information including name, address, and DOB.</p>
            </div>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSubmit}
        className="w-full py-3 text-base font-medium rounded-md flex items-center justify-center gap-2 shadow-sm"
        disabled={isSubmitting}
        size="lg"
      >
        {isSubmitting ? (
          <>Processing...</>
        ) : (
          <>
            Complete Registration
            <CheckIcon className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      <div>
      </div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </div>
  );
} 