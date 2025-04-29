'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/supabase-provider';
import ArtworkUploadForm from '@/components/artwork/artwork-upload-form';

export default function UploadPage() {
  const router = useRouter();
  const supabase = useSupabase();

  useEffect(() => {
    const checkAuth = async () => {
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
  }, [router, supabase]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Artwork</h1>
      <ArtworkUploadForm />
    </div>
  );
} 