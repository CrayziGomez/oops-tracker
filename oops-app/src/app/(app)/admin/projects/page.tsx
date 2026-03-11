"use client";

import { useState, useEffect } from "react";
import { useProject } from "@/components/providers/project-provider";
import {
  FolderKanban,
  Plus,
  Loader2,
  AlertTriangle,
  Hash,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: { issues: number };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const { refreshProjects } = useProject();

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setShowCreate(false);
        await fetchProjects();
        await refreshProjects();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create project");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the project "${name}"? This will permanently delete all associated issues and attachments.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchProjects();
        await refreshProjects();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("An unexpected error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Projects
          </h1>
          <p className="text-white/40 mt-1">Manage your projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create Project
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium text-white/60">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="e.g., Website Redesign"
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium text-white/60">
                Description
              </label>
              <textarea
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field resize-y"
                placeholder="Optional project description"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setError("");
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="btn-primary"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Project List */}
      <div className="space-y-3 stagger-children">
        {projects.map((project) => (
          <div key={project.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderKanban className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-white/40 mt-0.5">
                      {project.description}
                    </p>
                  )}
                  <span className="text-xs text-white/20 mt-1 block">
                    Created {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5">
                  <Hash className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-sm text-white/50">
                    {project._count.issues} issues
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(project.id, project.name)}
                  className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && !showCreate && (
        <div className="card p-12 text-center">
          <FolderKanban className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white/60 mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-white/30 mb-6">
            Create your first project to start tracking issues
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      )}
    </div>
  );
}
