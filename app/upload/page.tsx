'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import ArtworkUploadForm from '@/components/artwork/artwork-upload-form';

export default function UploadPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) {
        router.push('/sign-in');
        return;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth error:', error);
        router.push('/sign-in');
        return;
      }

      if (!user) {
        router.push('/sign-in');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Artwork</h1>
      <ArtworkUploadForm />
    </div>
  );
} 