"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Clock,
  User,
  Paperclip,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Edit3,
  Trash2,
  Loader2,
  AlertTriangle,
  Upload,
  X,
  MessageSquare,
  Send,
  CheckCircle2,
} from "lucide-react";
import {
  formatDate,
  formatRelativeTime,
  severityColor,
  statusColor,
  categoryLabel,
} from "@/lib/utils";

interface Attachment {
  id: string;
  url: string;
  filename: string;
  type: string;
  size?: number;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string; role: string };
}

interface Issue {
  id: string;
  title: string;
  description?: string;
  severity: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; name: string; email: string };
  project: { id: string; name: string };
  attachments: Attachment[];
}

const statuses = ["OPEN", "ACTIONED", "IN_REVIEW", "DONE", "ARCHIVED"];
const severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "COSMETIC"];
const categories = ["BUG", "FEATURE", "UI_UX", "PERFORMANCE", "SECURITY", "OTHER"];

export default function IssueDetailPage() {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Issue>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);

  const router = useRouter();
  const params = useParams();
  const issueId = params.issueId as string;
  const projectId = params.projectId as string;
  const { data: session } = useSession();

  const isAdmin = session?.user?.role === "OWNER";
  const isOwner = issue?.reporter.id === session?.user?.id;
  const canEdit = isAdmin || isOwner;

  const fetchIssue = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`);
      if (res.ok) {
        const data = await res.json();
        setIssue(data);
        setEditData(data);
      }
    } catch (error) {
      console.error("Failed to fetch issue:", error);
    } finally {
      setIsLoading(false);
    }
  }, [issueId]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setIsCommentsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchIssue();
    fetchComments();
  }, [fetchIssue, fetchComments]);

  const handleUpdate = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setIssue(updated);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Failed to update issue:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push(`/projects/${projectId}`);
      }
    } catch (error) {
      console.error("Failed to delete issue:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !issue) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("issueId", issue.id);

        await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
      }
      await fetchIssue();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setIssue(updated);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments([...comments, comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertTriangle className="w-12 h-12 text-white/20 mb-3" />
        <h2 className="text-lg font-semibold text-white/60">Issue not found</h2>
        <button
          onClick={() => router.back()}
          className="btn-secondary mt-4"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Back */}
      <button
        onClick={() => router.push(`/projects/${projectId}`)}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {issue.project.name}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card p-6">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editData.title || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  className="input-field text-lg font-bold"
                />
                <textarea
                  value={editData.description || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="input-field min-h-[150px] resize-y"
                  rows={6}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editData.severity}
                    onChange={(e) =>
                      setEditData({ ...editData, severity: e.target.value })
                    }
                    className="input-field"
                  >
                    {severities.map((s) => (
                      <option key={s} value={s} className="bg-surface-900">
                        {s}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editData.category}
                    onChange={(e) =>
                      setEditData({ ...editData, category: e.target.value })
                    }
                    className="input-field"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c} className="bg-surface-900">
                        {c === "UI_UX" ? "UI/UX" : c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="btn-primary"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditData(issue);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {issue.title}
                  </h1>
                  <div className="flex gap-2 shrink-0">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setEditData(issue);
                          setIsEditing(true);
                        }}
                        className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  <span className={`badge ${severityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className={`badge ${statusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                  <span className="badge bg-white/5 text-white/50 border-white/10">
                    {categoryLabel(issue.category)}
                  </span>
                </div>
                {issue.description && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                      {issue.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attachments */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-brand-400" />
                <h2 className="text-lg font-semibold text-white">
                  Attachments ({issue.attachments.length})
                </h2>
              </div>
              {canEdit && (
                <label className="btn-secondary cursor-pointer">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.log,.txt,.json,.xml,.csv"
                  />
                </label>
              )}
            </div>

            {issue.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {issue.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
                  >
                    {att.type === "image" ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={att.url}
                          alt={att.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 truncate group-hover:text-white">
                        {att.filename}
                      </p>
                      <p className="text-xs text-white/30 uppercase">
                        {att.type}
                      </p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-white/40 shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-white/20">
                <Paperclip className="w-8 h-8 mb-2" />
                <p className="text-sm">No attachments</p>
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <MessageSquare className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-white">
                Discussion ({comments.length})
              </h2>
            </div>

            <div className="space-y-6 mb-8 stagger-children">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0">
                    {comment.author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {comment.author.name}
                      </span>
                      <span className="text-[10px] text-white/20">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}

              {comments.length === 0 && !isCommentsLoading && (
                <div className="text-center py-6 text-white/20">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet. Start the discussion!</p>
                </div>
              )}

              {isCommentsLoading && (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                </div>
              )}
            </div>

            {/* Post Comment Input */}
            <form onSubmit={handlePostComment} className="relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="input-field pr-12 min-h-[80px] resize-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="absolute right-3 bottom-3 p-1.5 rounded-lg bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50 disabled:bg-white/5 disabled:hover:text-white/30 transition-all"
              >
                {isSubmittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white/60 mb-2">Actions</h3>
            
            {/* Reporter Actions */}
            {isOwner && (issue.status === "OPEN" || issue.status === "ACTIONED") && (
              <button
                onClick={() => handleStatusChange("DONE")}
                className="w-full flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                Submit for Review
              </button>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <>
                {issue.status === "IN_REVIEW" && (
                  <button
                    onClick={() => handleStatusChange("DONE")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Close
                  </button>
                )}
                
                {issue.status !== "ARCHIVED" && (
                  <button
                    onClick={() => handleStatusChange("ARCHIVED")}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl text-sm font-bold transition-all border border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                    Archive Issue
                  </button>
                )}
              </>
            )}

            {!isAdmin && !isOwner && (
              <p className="text-xs text-center text-white/20 italic">No actions available</p>
            )}
          </div>

          {isAdmin && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-white/60 mb-3">
                Force Status (Admin)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                      issue.status === s
                        ? `${statusColor(s)} border`
                        : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border border-transparent"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white/60">Details</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-xs text-white/30">Reporter</p>
                  <p className="text-sm text-white/70">{issue.reporter.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-xs text-white/30">Created</p>
                  <p className="text-sm text-white/70">
                    {formatDate(issue.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-white/30" />
                <div>
                  <p className="text-xs text-white/30">Last updated</p>
                  <p className="text-sm text-white/70">
                    {formatRelativeTime(issue.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative card p-6 max-w-sm w-full animate-fade-in">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-white/30 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Delete Issue
              </h3>
            </div>
            <p className="text-sm text-white/50 mb-6">
              Are you sure you want to delete &ldquo;{issue.title}&rdquo;?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="btn-danger">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
