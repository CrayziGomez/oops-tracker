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
    project: { name: string };
  }>;
  projectStats: Array<{
    id: string;
    name: string;
    totalIssues: number;
    openIssues: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeProject } = useProject();
  const router = useRouter();

  useEffect(() => {
    async function fetchDashboard() {
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
    }
    fetchDashboard();
  }, [activeProject]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
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
            {/* Decorative gradient bar */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${metric.color} opacity-60`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-semibold text-white">
                Recent Activity
              </h2>
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

          {data?.recentIssues && data.recentIssues.length > 0 ? (
            <div className="space-y-3 stagger-children">
              {data.recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() =>
                    router.push(
                      `/projects/${activeProject?.id || ""}/issues/${issue.id}`
                    )
                  }
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      issue.severity === "CRITICAL"
                        ? "bg-red-500"
                        : issue.severity === "HIGH"
                        ? "bg-orange-500"
                        : issue.severity === "MEDIUM"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 group-hover:text-white truncate">
                      {issue.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-white/30">
                        {issue.project.name}
                      </span>
                      <span className="text-white/10">•</span>
                      <span className="text-xs text-white/30">
                        {issue.reporter.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`badge text-[10px] ${severityColor(
                        issue.severity
                      )}`}
                    >
                      {issue.severity}
                    </span>
                    <span
                      className={`badge text-[10px] ${statusColor(
                        issue.status
                      )}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <span className="text-xs text-white/20 shrink-0 hidden sm:block">
                    {formatRelativeTime(issue.updatedAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-white/20">
              <CheckCircle2 className="w-12 h-12 mb-3" />
              <p className="text-sm">No issues yet. Everything looks good!</p>
            </div>
          )}
        </div>

        {/* Project Overview */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <FolderKanban className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-semibold text-white">Projects</h2>
          </div>

          {data?.projectStats && data.projectStats.length > 0 ? (
            <div className="space-y-4">
              {data.projectStats.map((project) => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white/80 group-hover:text-white">
                      {project.name}
                    </span>
                    <span className="text-xs text-white/30">
                      {project.totalIssues} total
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            project.totalIssues > 0
                              ? ((project.totalIssues - project.openIssues) /
                                  project.totalIssues) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">
                      {project.openIssues} open
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-white/20">
              <FolderKanban className="w-10 h-10 mb-2" />
              <p className="text-sm">No projects yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
