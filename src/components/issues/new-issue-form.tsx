"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProject } from "@/components/providers/project-provider";
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Loader2,
  AlertTriangle,
  Send,
  Info,
  CheckCircle2,
  Plus,
  FolderKanban,
} from "lucide-react";

interface UploadedFile {
  url: string;
  filename: string;
  type: string;
  size?: number;
}

const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "COSMETIC"];
const categories = ["BUG", "FEATURE", "UI_UX", "PERFORMANCE", "SECURITY", "OTHER"];

export function NewIssueForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, activeProject } = useProject();
  
  // Initial Project Selection from Query Param OR Active Project
  const initialProjectId = searchParams.get("projectId") || activeProject?.id || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId);
  const [severity, setSeverity] = useState("MEDIUM");
  const [category, setCategory] = useState("BUG");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Synchronize initial project from URL or Global Context (One-time or on URL change)
  useEffect(() => {
    const urlProjectId = searchParams.get("projectId");
    if (urlProjectId) {
      setProjectId(urlProjectId);
    } else if (!projectId && activeProject?.id) {
      setProjectId(activeProject.id);
    }
    // We intentionally exclude 'projectId' from dependencies to prevent "snapping back" 
    // to the URL value when the user manually clicks a project bubble.
  }, [searchParams, activeProject?.id]); 

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setAttachments((prev) => [...prev, data]);
        } else {
          const err = await res.json();
          setError(err.error || "Upload failed");
        }
      }
    } catch {
      setError("Failed to upload file");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, mode: "REDIRECT" | "NEW" = "REDIRECT") => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!projectId) {
      setError("Please select a project");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          category,
          projectId,
          attachments,
        }),
      });

      if (res.ok) {
        if (mode === "REDIRECT") {
          const issue = await res.json();
          router.push(`/projects/${projectId}/issues/${issue.id}`);
        } else {
          // Reset form for "Submit & Add Another"
          setTitle("");
          setDescription("");
          setAttachments([]);
          setSuccess("Issue submitted successfully! Add another below.");
          document.getElementById("issue-title")?.focus();
          setTimeout(() => setSuccess(""), 5000);
        }
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create issue");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6 sm:p-10 shadow-xl border-t border-brand-500/10">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center border border-brand-500/20">
          <Plus className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Provide your OOPS details</h1>
          <p className="text-sm text-white/40">Log a new observation, outage, or problem across any project.</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, "REDIRECT")} className="space-y-10">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in shadow-lg">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in shadow-lg">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* 1. Visual Project Selection Grid/Bubbles */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-4">
            Project Confirmation
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {projects.map((p) => {
              const isSelected = projectId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProjectId(p.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 group
                    ${isSelected 
                      ? "bg-brand-500/15 border-brand-500/40 text-brand-400 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]" 
                      : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05] hover:border-white/10 hover:text-white/60"}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors
                    ${isSelected ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-white/20 group-hover:bg-white/10"}`}>
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </div>
          {projects.length === 0 && (
            <p className="text-xs text-red-400/60 italic">No projects available. Please create a project first.</p>
          )}
        </div>

        {/* 2. Core Metadata */}
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-2">
            <label htmlFor="issue-title" className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              Issue Title <span className="text-red-400">*</span>
            </label>
            <input
              id="issue-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field py-4"
              placeholder="e.g. Broken login page, Data mismatch in reports..."
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="issue-description" className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              Description & Steps to Reproduce
            </label>
            <textarea
              id="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[140px] py-4"
              placeholder="Provide context, expected vs actual behavior, or log snippets..."
              rows={5}
            />
          </div>
        </div>

        {/* 3. Severity & Category Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Severity Scale</label>
            <div className="grid grid-cols-2 gap-2">
              {severities.map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 border
                    ${severity === sev 
                      ? "bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-lg shadow-brand-500/10" 
                      : "bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
                    }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Issue Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-3 rounded-xl text-[10px] font-black tracking-widest transition-all duration-300 border
                    ${category === cat 
                      ? "bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-lg shadow-brand-500/10" 
                      : "bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/[0.05] hover:border-white/10 hover:text-white"
                    }`}
                >
                  {cat === "UI_UX" ? "UI / UX" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Category Guide (Sticky Persistence) */}
        <div className="px-5 py-5 rounded-3xl bg-brand-500/5 border border-brand-500/10 animate-fade-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-3xl -mr-10 -mt-10 group-hover:bg-brand-500/10 transition-colors" />
          <div className="flex items-start gap-4 relative z-10">
            <Info className="w-6 h-6 text-brand-400 shrink-0 mt-0.5" />
            <div className="space-y-4">
              <h3 className="text-xs font-black text-white/80 uppercase tracking-widest">Category Guide</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                <div className="text-[11px] leading-relaxed">
                  <span className="text-brand-300 font-black">BUG:</span>
                  <span className="text-white/40 ml-2">Breakage or regression in existing features.</span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  <span className="text-brand-300 font-black">FEATURE:</span>
                  <span className="text-white/40 ml-2">New functionality or logic requested.</span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  <span className="text-brand-300 font-black">UI/UX:</span>
                  <span className="text-white/40 ml-2">Visual glitches or usability friction.</span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  <span className="text-brand-300 font-black">SECURITY:</span>
                  <span className="text-white/40 ml-2">Vulnerabilities or permission issues.</span>
                </div>
                <div className="text-[11px] leading-relaxed">
                  <span className="text-brand-300 font-black">PERF:</span>
                  <span className="text-white/40 ml-2">Latency, slowness, or resource leaks.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. File Attachments */}
        <div className="space-y-4">
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Evidence & Logs</label>
          <div className="border-2 border-dashed border-white/5 rounded-3xl p-8 hover:border-brand-500/30 transition-all group bg-white/[0.01]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-500/20 transition-colors">
                <Upload className="w-6 h-6 text-white/40 group-hover:text-brand-400 transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/60">Drop artifacts here or click to upload</p>
                <p className="text-xs text-white/20 mt-1">Images, logs, screenshots (max 10MB each)</p>
              </div>
              <label className="px-6 py-2 bg-white/5 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/5 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-500/20">
                Choose Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,.log,.txt,.json,.xml,.csv"
                />
              </label>
            </div>
          </div>

          {isUploading && (
            <div className="flex items-center gap-2 text-sm text-brand-400 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              Dispatching files...
            </div>
          )}

          {attachments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5 animate-fade-in group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {file.type === "image" ? (
                      <ImageIcon className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  <span className="text-[12px] text-white/60 truncate flex-1 font-medium">{file.filename}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6. Execution Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-8 border-t border-white/5">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-2xl transition-all border border-white/5 order-3 sm:order-1"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isSubmitting || !title.trim() || !projectId}
            onClick={(e) => handleSubmit(e as any, "NEW")}
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-brand-500/10 text-brand-400 text-sm font-bold rounded-2xl transition-all border border-brand-500/20 order-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Submit & Add Another
              </span>
            )}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !projectId}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white text-sm font-black rounded-2xl transition-all shadow-2xl shadow-brand-500/30 disabled:opacity-50 disabled:grayscale order-1 sm:order-3"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                Submit
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
