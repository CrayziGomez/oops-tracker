"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useProject } from "@/components/providers/project-provider";
import { useSession } from "next-auth/react";
import {
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Archive,
  Paperclip,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import {
  formatRelativeTime,
  severityColor,
  statusColor,
  categoryLabel,
} from "@/lib/utils";

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
  _count?: { attachments: number };
}

const statusTabs = [
  { value: "ALL", label: "All", icon: Filter },
  { value: "OPEN", label: "Open", icon: AlertTriangle },
  { value: "ACTIONED", label: "Actioned", icon: Clock },
  { value: "DONE", label: "Done", icon: CheckCircle2 },
  { value: "ARCHIVED", label: "Archived", icon: Archive },
];

export default function ProjectIssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { activeProject, setActiveProject, projects } = useProject();
  const { data: session } = useSession();

  // Sync active project
  useEffect(() => {
    if (projectId && activeProject?.id !== projectId) {
      const proj = projects.find((p) => p.id === projectId);
      if (proj) setActiveProject(proj);
    }
  }, [projectId, activeProject, projects, setActiveProject]);

  const fetchIssues = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ projectId });
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/issues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, statusFilter]);

  useEffect(() => {
    if (projectId) fetchIssues();
  }, [projectId, statusFilter, fetchIssues]);

  const filteredIssues = searchQuery
    ? issues.filter(
        (i) =>
          i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.reporter.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : issues;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {activeProject?.name || "Issues"}
          </h1>
          <p className="text-white/40 mt-1">
            {filteredIssues.length} issue
            {filteredIssues.length !== 1 ? "s" : ""}
            {statusFilter !== "ALL" && ` (${statusFilter.toLowerCase()})`}
          </p>
        </div>
        <div className="flex gap-2">
          {session?.user?.role === "OWNER" && (
            <button
              onClick={() => router.push(`/projects/${projectId}/team`)}
              className="btn-secondary hidden sm:flex"
            >
              <Users className="w-4 h-4" />
              Manage Team
            </button>
          )}
          <button
            onClick={() => router.push(`/projects/${projectId}/issues/new`)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Issue
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-white/40 hover:text-white/60 hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search issues..."
            className="input-field pl-10 py-2"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
        </div>
      ) : filteredIssues.length === 0 ? (
        /* Empty State */
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-white/20" />
          </div>
          <h3 className="text-lg font-semibold text-white/60 mb-2">
            No issues found
          </h3>
          <p className="text-sm text-white/30 mb-6">
            {searchQuery
              ? "Try adjusting your search"
              : "Create the first issue for this project"}
          </p>
          <button
            onClick={() => router.push(`/projects/${projectId}/issues/new`)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Issue
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="stagger-children">
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    onClick={() =>
                      router.push(
                        `/projects/${projectId}/issues/${issue.id}`
                      )
                    }
                    className="border-b border-white/[0.03] hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/90 group-hover:text-white">
                          {issue.title}
                        </span>
                        {(issue._count?.attachments ?? 0) > 0 && (
                          <Paperclip className="w-3.5 h-3.5 text-white/20" />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`badge ${severityColor(issue.severity)}`}
                      >
                        {issue.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white/50">
                        {categoryLabel(issue.category)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${statusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white/50">
                        {issue.reporter.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-white/30">
                        {formatRelativeTime(issue.updatedAt)}
                      </span>
                    </td>
                    <td className="p-4">
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 stagger-children">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                onClick={() =>
                  router.push(`/projects/${projectId}/issues/${issue.id}`)
                }
                className="card-interactive p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white/90 truncate">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-white/30">
                        {issue.reporter.name}
                      </span>
                      <span className="text-white/10">•</span>
                      <span className="text-xs text-white/30">
                        {formatRelativeTime(issue.updatedAt)}
                      </span>
                      {(issue._count?.attachments ?? 0) > 0 && (
                        <Paperclip className="w-3 h-3 text-white/20" />
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`badge text-[10px] ${severityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className={`badge text-[10px] ${statusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                  <span className="text-xs text-white/30">
                    {categoryLabel(issue.category)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
