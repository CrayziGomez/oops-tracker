"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { NewIssueForm } from "@/components/issues/new-issue-form";

export default function UnifiedNewIssuePage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      {/* Dynamic Back Navigation */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-all mb-8 group"
      >
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to previous context
      </button>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          <p className="text-white/40 text-sm font-medium">Initializing Dispatcher...</p>
        </div>
      }>
        <NewIssueForm />
      </Suspense>
    </div>
  );
}
