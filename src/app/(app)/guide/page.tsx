"use client";

import { 
  BookOpen, 
  PlusCircle, 
  MessageSquare, 
  Send, 
  Search, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle
} from "lucide-react";

export default function GuidePage() {
  const steps = [
    {
      title: "1. Projects & Teams",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      content: "Start by selecting a project from the header. If you're an Admin, you can invite team members via the 'Members' tab using just their email address."
    },
    {
      title: "2. Logging an OOPS",
      icon: <PlusCircle className="w-5 h-5 text-brand-400" />,
      content: "Use the '+ OOPS log' button to report Observations, Outages, Problems, or Suggestions. Be descriptive and attach logs or screenshots to help the team resolve it faster."
    },
    {
      title: "3. Professional Tracking",
      icon: <Search className="w-5 h-5 text-blue-400" />,
      content: "Every issue is assigned a unique ID (e.g., OOPS-42). Use this ID to quickly find, share, or reference specific logs across the dashboard and project lists."
    },
    {
      title: "4. Status Workflow",
      icon: <Clock className="w-5 h-5 text-purple-400" />,
      content: "Issues move from OPEN → ACTIONED (in progress) → IN REVIEW → DONE. Reporters can 'Submit for Review' once they believe a fix is ready."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
      {/* Header section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 shadow-xl mb-2">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">User Guide</h1>
        <p className="text-lg text-white/40 max-w-2xl mx-auto">
          Welcome to OOPS Tracker. This guide covers the essential workflows to get you and your team tracking issues efficiently.
        </p>
      </div>

      {/* Core Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="card p-6 hover:border-brand-500/30 transition-all group">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-brand-500/10 transition-colors">
                {step.icon}
              </div>
              <h3 className="font-bold text-white uppercase tracking-wider text-sm">{step.title}</h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              {step.content}
            </p>
          </div>
        ))}
      </div>

      {/* Mobile & Telegram Section */}
      <div className="card p-8 bg-gradient-to-br from-brand-500/5 to-purple-500/5 border-brand-500/20">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
              Mobile Integration (Live)
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Send className="w-6 h-6 text-brand-400" />
              Telegram Power-Ups
            </h2>
            <p className="text-white/60 leading-relaxed">
              The OOPS Tracker is now fully integrated with Telegram. You can receive real-time alerts and **respond to tickets directly from Telegram**.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <p className="text-sm text-white/40">
                  <span className="text-white/80 font-medium">Link Your Profile:</span> Once you save your <span className="text-brand-400">Telegram Chat ID</span> in your Profile settings, the bot will start sending you updates.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <p className="text-sm text-white/40">
                  <span className="text-white/80 font-medium">Reply-from-Mobile:</span> Simply reply to any notification message in Telegram. Your reply will automatically appear as a **Comment** on the OOPS ticket!
                </p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
                <p className="text-sm text-white/40">
                  <span className="text-white/80 font-medium">Instant Identification:</span> The OOPS bot uses the <span className="text-brand-400">OOPS-#</span> IDs to ensure your replies reach the correct issue instantly.
                </p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 aspect-square rounded-3xl bg-white/[0.03] border border-white/5 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent" />
             <div className="relative text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto">
                   <MessageSquare className="w-8 h-8 text-brand-400" />
                </div>
                <div className="space-y-1">
                   <p className="text-xs font-bold text-white/80">OOPS Bot</p>
                   <p className="text-[10px] text-white/30 truncate">Log updated by Admin</p>
                </div>
                <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                   <div className="w-2/3 h-full bg-brand-500" />
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Collaboration footer */}
      <div className="text-center space-y-4 pt-8">
        <p className="text-sm text-white/20">Need more help? Contact your System Owner.</p>
        <div className="flex justify-center gap-4">
           {/* Mock buttons for visual completeness */}
           <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(var(--brand-500),0.5)]" />
           <div className="w-2 h-2 rounded-full bg-white/10" />
           <div className="w-2 h-2 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
