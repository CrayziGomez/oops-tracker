"use client";

import { useState } from "react";
import { X, MessageSquare, Send, Loader2 } from "lucide-react";

interface RevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  issueTitle: string;
}

export default function RevisionModal({
  isOpen,
  onClose,
  onSubmit,
  issueTitle,
}: RevisionModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason("");
      onClose();
    } catch (error) {
      console.error("Failed to submit revision reason:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative card p-6 max-w-md w-full animate-fade-in shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-white/30 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Ask for Revisions</h3>
            <p className="text-xs text-white/40 truncate max-w-xs">{issueTitle}</p>
          </div>
        </div>

        <p className="text-sm text-white/60 mb-6 leading-relaxed">
          Provide feedback to the reporter explaining what needs to be changed or fixed before this can be approved.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Please attach the log files from the crash..."
              className="input-field min-h-[120px] resize-none text-sm"
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="btn-primary"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Request Revisions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
