"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProject } from "@/components/providers/project-provider";
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Flame,
  Activity,
  FolderKanban,
  Plus,
  History,
  MessageSquare,
  FileUp,
  X,
  User as UserIcon,
} from "lucide-react";
import { formatRelativeTime, severityColor, statusColor } from "@/lib/utils";

interface DashboardData {
  metrics: {
    totalOpen: number;
    totalCritical: number;
    actionedThisWeek: number;
  };
  recentIssues: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    updatedAt: string;
    reporter: { name: string };
    project: { id: string; name: string };
    projectId: string;
  }>;
  projectStats: Array<{
    id: string;
    name: string;
    totalIssues: number;
    openIssues: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    details?: string;
    createdAt: string;
    userName: string;
    issueTitle: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProject, projects, setActiveProject } = useProject();
  const router = useRouter();
  
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quickLogForm, setQuickLogForm] = useState({
    title: "",
    projectId: activeProject?.id || "",
    severity: "MEDIUM",
  });

  useEffect(() => {
    if (activeProject) {
      setQuickLogForm((prev) => ({ ...prev, projectId: activeProject.id }));
    }
  }, [activeProject]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const url = activeProject 
        ? `/api/dashboard?projectId=${activeProject.id}`
        : "/api/dashboard";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeProject]);

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLogForm.title || !quickLogForm.projectId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quickLogForm),
      });

      if (res.ok) {
        setIsQuickLogOpen(false);
        setQuickLogForm((prev) => ({ ...prev, title: "" }));
        fetchDashboard(); // Refresh data
      }
    } catch (error) {
      console.error("Failed to log issue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-vh-60">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: "Open Issues",
      value: data?.metrics.totalOpen ?? 0,
      icon: AlertCircle,
      color: "from-emerald-500 to-emerald-600",
      bgGlow: "bg-emerald-500/10",
      textColor: "text-emerald-400",
    },
    {
      label: "Critical",
      value: data?.metrics.totalCritical ?? 0,
      icon: Flame,
      color: "from-red-500 to-red-600",
      bgGlow: "bg-red-500/10",
      textColor: "text-red-400",
      pulse: (data?.metrics.totalCritical ?? 0) > 0,
    },
    {
      label: "Actioned This Week",
      value: data?.metrics.actionedThisWeek ?? 0,
      icon: TrendingUp,
      color: "from-blue-500 to-blue-600",
      bgGlow: "bg-blue-500/10",
      textColor: "text-blue-400",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Quick Log Modal Overlay */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg card p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsQuickLogOpen(false)}
              className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              Quick Log Issue
            </h2>
            <p className="text-white/40 text-sm mb-8">Rapidly report a new issue from the dashboard.</p>
            
            <form onSubmit={handleQuickLogSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Project</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                  value={quickLogForm.projectId}
                  onChange={(e) => setQuickLogForm({...quickLogForm, projectId: e.target.value})}
                  required
                >
                  <option value="" disabled className="bg-[#0a0a0a]">Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#0a0a0a]">{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Issue Title</label>
                <input 
                  type="text"
                  placeholder="Summarize the problem..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500/50 transition-colors"
                  value={quickLogForm.title}
                  onChange={(e) => setQuickLogForm({...quickLogForm, title: e.target.value})}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setQuickLogForm({...quickLogForm, severity: sev})}
                      className={`py-2 rounded-lg text-[10px] font-bold transition-all ${
                        quickLogForm.severity === sev 
                          ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsQuickLogOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors border border-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? "Logging..." : "Create Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Title & Project Selector */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Dashboard
          </h1>
          <p className="text-white/40 mt-1">
            {activeProject 
              ? `Overview for ${activeProject.name}`
              : "Overview of all issues across projects"}
          </p>
        </div>

        <button
          onClick={() => setIsQuickLogOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Issue
        </button>
      </div>

      {/* Project Selector Toggle */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setActiveProject(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
            !activeProject
              ? "bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
              : "border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/10 hover:text-white/60"
          }`}
        >
          <Activity className="w-4 h-4" />
          All Projects
        </button>
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => setActiveProject(project)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border whitespace-nowrap ${
              activeProject?.id === project.id
                ? "bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "border-white/5 bg-white/5 text-white/40 hover:bg-white/10 hover:border-white/10 hover:text-white/60"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            {project.name}
          </button>
        ))}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`card p-6 relative overflow-hidden ${
              metric.pulse ? "animate-pulse-glow" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/40 font-medium">
                  {metric.label}
                </p>
                <p className={`text-3xl font-bold mt-2 ${metric.textColor}`}>
                  {metric.value}
                </p>
              </div>
              <div
                className={`w-10 h-10 rounded-xl ${metric.bgGlow} flex items-center justify-center`}
              >
                <metric.icon className={`w-5 h-5 ${metric.textColor}`} />
              </div>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.color} opacity-60`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-white">Latest Activity</h2>
            </div>
            {activeProject && (
              <button
                onClick={() => router.push(`/projects/${activeProject.id}`)}
                className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Issues Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Recent Issues
              </h3>
              {data?.recentIssues && data.recentIssues.length > 0 ? (
                <div className="space-y-3">
                  {data.recentIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => router.push(`/projects/${issue.projectId || issue.project.id}/issues/${issue.id}`)}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          issue.severity === "CRITICAL" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : 
                          issue.severity === "HIGH" ? "bg-orange-500" : "bg-blue-500"
                        }`} />
                        <p className="text-sm font-medium text-white/80 group-hover:text-white truncate">{issue.title}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2 pl-5">
                        <span className="text-[10px] text-white/30">{issue.project.name}</span>
                        <span className="text-[10px] text-white/20">{formatRelativeTime(issue.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-xl text-white/10 text-xs">No issues yet</div>
              )}
            </div>

            {/* Audit Log Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" />
                Audit Logs
              </h3>
              {data?.recentActivity && data.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} className="p-3 rounded-xl bg-white/[0.01] border border-white/5">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {activity.action === "CREATION" ? <Plus className="w-3 h-3 text-emerald-400" /> : <Activity className="w-3 h-3 text-brand-400" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[12px] text-white/70 leading-relaxed">
                            <span className="text-white font-semibold">{activity.userName}</span> {activity.action === "CREATION" ? "logged" : "updated"} <span className="text-brand-400">#{activity.issueTitle}</span>
                          </p>
                          {activity.details && <p className="text-[10px] text-white/30 mt-1 truncate">{activity.details}</p>}
                          <p className="text-[9px] text-white/20 mt-1">{formatRelativeTime(activity.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-xl text-white/10 text-xs">No activity yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Project Overview Column */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">System Status</h2>
          </div>

          <div className="space-y-4">
            {data?.projectStats.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white/90">{project.name}</span>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{project.totalIssues - project.openIssues} FIXED</span>
                  </div>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 transition-all duration-1000"
                    style={{ width: `${project.totalIssues > 0 ? ((project.totalIssues - project.openIssues) / project.totalIssues) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-white/20">{project.totalIssues} total</span>
                  <span className="text-[10px] text-brand-400">{project.openIssues} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
