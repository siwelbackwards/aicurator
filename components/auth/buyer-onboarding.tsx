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

interface OnboardingProps {
  userId: string;
  userEmail: string;
  onComplete: () => void;
}

export default function BuyerOnboarding({ userId, userEmail, onComplete }: OnboardingProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
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
    address: "",
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
            user_type: 'buyer',
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create basic profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            title: formData.title,
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: 'buyer',
            email: formData.email,
          });

        if (profileError) {
          console.error('Error creating initial profile:', profileError);
          // Continue anyway as we'll update it in step 2
        }
        
        // Update userId for step 2
        userId = authData.user.id;
        setStep(2);
        window.scrollTo(0, 0);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      if (error instanceof Error) {
        if (error.message.includes('Email already registered')) {
          setError('This email is already registered. Please sign in instead.');
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
      // Upload files if they exist
      let photoIdUrl = null;
      let proofOfAddressUrl = null;
      
      if (formData.photoIdFile) {
        const { data: photoData, error: photoError } = await supabase.storage
          .from('verifications')
          .upload(`${userId}/photo-id`, formData.photoIdFile);
          
        if (photoError) throw photoError;
        photoIdUrl = photoData?.path;
      }
      
      if (formData.proofOfAddressFile) {
        const { data: proofData, error: proofError } = await supabase.storage
          .from('verifications')
          .upload(`${userId}/proof-of-address`, formData.proofOfAddressFile);
          
        if (proofError) throw proofError;
        proofOfAddressUrl = proofData?.path;
      }

      // Update profile with all collected data
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          title: formData.title,
          first_name: formData.firstName,
          last_name: formData.lastName,
          address: formData.address,
          phone: formData.phone,
          is_mobile: formData.isMobile,
          date_of_birth: formData.dateOfBirth,
          previously_transacted: formData.previouslyTransacted,
          communication_preference: formData.communicationPreference === "yes",
          photo_id_url: photoIdUrl,
          proof_of_address_url: proofOfAddressUrl,
          interested_categories: formData.categories,
          collection_description: formData.collection,
          wishlist: formData.wishlist,
          role: 'buyer',
          onboarding_completed: true,
          updated_at: new Date(),
          collection_interests: formData.collectionInterests,
          budget_range: formData.budgetRange,
          experience_level: formData.experienceLevel,
          preferred_art_periods: formData.preferredArtPeriods
        });

      if (error) throw error;
      
      onComplete();
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile information. Please try again.');
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
          You have now created a My AI CURATOR account.
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
            <Label htmlFor="address" className="text-sm font-medium">Primary residential address</Label>
            <Input 
              id="address"
              value={formData.address}
              onChange={(e) => updateForm('address', e.target.value)}
              placeholder="Your full address"
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
      <div className="bg-primary text-white p-4 text-center">
        <h2 className="font-bold text-xl">Buyer Registration</h2>
      </div>
      
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
    </div>
  );
} 