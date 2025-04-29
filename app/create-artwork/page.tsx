'use client';

import ArtworkUploadForm from "@/components/artwork/artwork-upload-form";
import { Suspense } from "react";

export default function CreateArtworkActualPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create New Artwork</h1>
      <Suspense fallback={<div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>}>
        <ArtworkUploadForm />
      </Suspense>
    </div>
  );
} 