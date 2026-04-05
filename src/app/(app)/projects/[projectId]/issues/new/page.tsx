"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
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
} from "lucide-react";

interface UploadedFile {
  url: string;
  filename: string;
  type: string;
  size?: number;
}

const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "COSMETIC"];
const categories = ["BUG", "FEATURE", "UI_UX", "PERFORMANCE", "SECURITY", "OTHER"];

export default function NewIssuePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [category, setCategory] = useState("BUG");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

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
      // Reset input
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
          // Reset form for new issue
          setTitle("");
          setDescription("");
          setAttachments([]);
          setSuccess("Issue submitted successfully! Add another below.");
          
          // Focus title input
          document.getElementById("issue-title")?.focus();
          
          // Clear success message after 5 seconds
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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to issues
      </button>

      <div className="card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Report Issue</h1>
            <p className="text-sm text-white/40">
              Log a new observation, outage, problem, or suggestion
            </p>
          </div>
        </div>

        <form onSubmit={(e) => handleSubmit(e, "REDIRECT")} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="issue-title" className="text-sm font-medium text-white/60">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="issue-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Brief description of the issue"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="issue-description" className="text-sm font-medium text-white/60">
              Description
            </label>
            <textarea
              id="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[120px] resize-y"
              placeholder="Detailed description, steps to reproduce, expected behavior..."
              rows={5}
            />
          </div>

          {/* Severity & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="issue-severity" className="text-sm font-medium text-white/60">
                Severity
              </label>
              <select
                id="issue-severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="input-field appearance-none cursor-pointer"
              >
                {severities.map((s) => (
                  <option key={s} value={s} className="bg-surface-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="issue-category" className="text-sm font-medium text-white/60">
                Category
              </label>
              <select
                id="issue-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field appearance-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-surface-900">
                    {c === "UI_UX" ? "UI/UX" : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Category Guide */}
          <div className="px-4 py-4 rounded-2xl bg-brand-500/5 border border-brand-500/10 animate-fade-in">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white/80">Category Guide</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  <div className="text-[12px]">
                    <span className="text-brand-300 font-medium font-bold">BUG:</span>
                    <span className="text-white/40 ml-1">Something is broken or not working as intended.</span>
                  </div>
                  <div className="text-[12px]">
                    <span className="text-brand-300 font-medium font-bold">FEATURE:</span>
                    <span className="text-white/40 ml-1">Request for new functionality or enhancement.</span>
                  </div>
                  <div className="text-[12px]">
                    <span className="text-brand-300 font-medium font-bold">UI/UX:</span>
                    <span className="text-white/40 ml-1">Visual glitches, layout issues, or usability.</span>
                  </div>
                  <div className="text-[12px]">
                    <span className="text-brand-300 font-medium font-bold">PERFORMANCE:</span>
                    <span className="text-white/40 ml-1">Slow loading, lag, or high resource usage.</span>
                  </div>
                  <div className="text-[12px]">
                    <span className="text-brand-300 font-medium font-bold">SECURITY:</span>
                    <span className="text-white/40 ml-1">Vulnerabilities or access control issues.</span>
                  </div>
                  <div className="text-[12px]">
                    <span className="text-brand-300 font-medium font-bold">OTHER:</span>
                    <span className="text-white/40 ml-1">Anything that doesn't fit the above.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">
              Attachments
            </label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-6 hover:border-brand-500/30 transition-colors">
              <div className="flex flex-col items-center gap-3 text-center">
                <Upload className="w-8 h-8 text-white/20" />
                <div>
                  <p className="text-sm text-white/40">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-white/20 mt-1">
                    Images, logs, screenshots (max 10MB each)
                  </p>
                </div>
                <label className="btn-secondary cursor-pointer">
                  <Upload className="w-4 h-4" />
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

            {/* Upload Progress */}
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-brand-400 animate-fade-in">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </div>
            )}

            {/* Uploaded Files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 animate-fade-in"
                  >
                    {file.type === "image" ? (
                      <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                    )}
                    <span className="text-sm text-white/70 truncate flex-1">
                      {file.filename}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary w-full sm:w-auto order-3 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting || !title.trim()}
              onClick={(e) => handleSubmit(e as any, "NEW")}
              className="btn-secondary w-full sm:w-auto order-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Submit & Add Another
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="btn-primary w-full sm:w-auto order-1 sm:order-3"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Issue
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
