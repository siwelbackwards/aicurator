"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // detectSessionInUrl is enabled in the client, so loading this page
        // with the auth code should be enough to establish the session.
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        const redirect = searchParams?.get("redirect") || "/dashboard";
        if (session) {
          router.replace(redirect);
        } else {
          // If session not yet available, give it a moment then retry once
          setTimeout(async () => {
            const { data: retry } = await supabase.auth.getSession();
            if (retry?.session) {
              router.replace(redirect);
            } else {
              router.replace("/auth" + (redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""));
            }
          }, 400);
        }
      } catch {
        router.replace("/auth");
      }
    };

    completeAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}



