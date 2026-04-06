"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RedirectToUnifiedNewIssue() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  useEffect(() => {
    // Redirect to the unified canonical path for issue reporting
    router.replace(`/issues/new?projectId=${projectId}`);
  }, [projectId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      <p className="text-white/40 text-sm font-medium">Redirecting to Unified Dispatcher...</p>
    </div>
  );
}
