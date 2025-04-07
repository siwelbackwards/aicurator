"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const steps = [
  {
    number: '01',
    title: 'Tell Us About Item',
    description: 'Complete our tour for each item tour to review.',
    icon: '📝'
  },
  {
    number: '02',
    title: 'Upload Photos & Documents',
    description: 'Documents are optional but we need at least three photographs of each item.',
    icon: '📸'
  },
  {
    number: '03',
    title: 'Review & Submit',
    description: 'Submit your item for review - we will be in touch soon.',
    icon: '✓'
  }
];

export default function SellPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=/sell/new');
    } else {
      router.push('/sell/new');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] -mx-4 sm:-mx-6 lg:-mx-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80')`,
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        <div className="relative h-full flex items-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Want to sell through AI Curator</h1>
            <p className="text-lg text-gray-200 max-w-2xl leading-relaxed">
              Selling your artwork or item via AI Curator is an easy and seamless process. We leverage our worldwide network, AI-powered matchmaking for our registered sellers and buyers, and our meticulously crafted global outreach to secure the best price for your asset.
            </p>
          </div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-12">Steps to sell</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-white p-6 rounded-xl border">
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="text-sm text-primary mb-2">Step {step.number}</div>
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}