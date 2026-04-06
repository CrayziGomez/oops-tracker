"use client";

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
  Trophy,
  AlertCircle as AlertIcon,
  Send,
  Link,
  ChevronDown,
  Loader2,
} from "lucide-react";
import useSWR from "swr";
import { formatRelativeTime, severityColor, statusColor } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
    serialNumber: number;
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

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  count: number;
}

export default function DashboardPage() {
  const { activeProject, projects, setActiveProject } = useProject();
  const router = useRouter();

  // 1. SWR for Dashboard Metrics & Activity
  const dashboardKey = activeProject 
    ? `/api/dashboard?projectId=${activeProject.id}`
    : "/api/dashboard";
    
  const { 
    data, 
    isLoading: isDashboardLoading 
  } = useSWR<DashboardData>(dashboardKey, fetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60000, // Background poll every minute
  });

  // 2. SWR for Leaderboard
  const { 
    data: leaderboard = [] 
  } = useSWR<LeaderboardUser[]>("/api/dashboard/leaderboard", fetcher);

  const isLoading = isDashboardLoading;

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
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-white/40 mt-1 sm:mt-2 text-sm">
            {activeProject 
              ? `Real-time health for ${activeProject.name}`
              : "Cross-system status monitors and activity logs"}
          </p>
        </div>

        <button
          onClick={() => router.push("/issues/new")}
          className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:scale-[1.03] active:scale-95 group"
        >
          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-3 h-3" />
          </div>
          + OOPS log
        </button>
      </div>

      {/* Project Selector Chips (Wrapping) */}
      <div className="flex flex-wrap items-center gap-3 pb-2 animate-stagger-in">
        <button
          onClick={() => setActiveProject(null)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 border whitespace-nowrap
            ${!activeProject
              ? "bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-[0_0_25px_rgba(59,130,246,0.2)] scale-[1.03]"
              : "border-white/5 bg-white/5 text-white/30 hover:bg-white/10 hover:border-white/10 hover:text-white/60 hover:scale-105 active:scale-95"
            }`}
        >
          <Activity className="w-3.5 h-3.5" />
          General Status
        </button>
        {projects.map((project) => {
          const isSelected = activeProject?.id === project.id;
          return (
            <button
              key={project.id}
              onClick={() => setActiveProject(project)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all duration-300 border whitespace-nowrap
                ${isSelected
                  ? "bg-brand-500/20 border-brand-500/40 text-brand-400 shadow-[0_0_25px_rgba(59,130,246,0.2)] scale-[1.03]"
                  : "border-white/5 bg-white/5 text-white/30 hover:bg-white/10 hover:border-white/10 hover:text-white/60 hover:scale-105 active:scale-95"
                }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              {project.name}
            </button>
          );
        })}
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
                        <p className="text-sm font-medium text-white/80 group-hover:text-white truncate">
                          <span className="text-brand-400 font-bold mr-2">OOPS-{issue.serialNumber}</span>
                          {issue.title}
                        </p>
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

        {/* Project Overview & Leaderboard Column */}
        <div className="space-y-6">
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

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-6">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Top Reporters</h2>
            </div>
            
            <div className="space-y-4">
              {leaderboard.length > 0 ? leaderboard.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? "bg-amber-500/20 text-amber-500 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
                      index === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/50" :
                      index === 2 ? "bg-amber-700/20 text-amber-600 border border-amber-700/50" :
                      "bg-white/5 text-white/50"
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{user.name}</p>
                      <p className="text-[10px] text-white/40">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-400">{user.count}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">Issues</p>
                  </div>
                </div>
              )) : (
                <div className="py-8 text-center border border-dashed border-white/5 rounded-xl text-white/10 text-xs">No reporters yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
