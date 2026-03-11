import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function severityColor(severity: string): string {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    MEDIUM: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    LOW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    COSMETIC: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colors[severity] || colors.MEDIUM;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    ACTIONED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    IN_REVIEW: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    DONE: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    ARCHIVED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colors[status] || colors.OPEN;
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    BUG: "Bug",
    FEATURE: "Feature",
    UI_UX: "UI/UX",
    PERFORMANCE: "Performance",
    SECURITY: "Security",
    OTHER: "Other",
  };
  return labels[category] || category;
}
