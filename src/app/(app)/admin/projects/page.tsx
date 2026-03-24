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
  Edit2,
  Users,
  ExternalLink,
  X,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { refreshProjects } = useProject();
  const router = useRouter();

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

  const startEdit = (project: Project) => {
    setEditId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || "");
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() }),
      });

      if (res.ok) {
        setEditId(null);
        await fetchProjects();
        await refreshProjects();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update project");
      }
    } catch {
      alert("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
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
      <div className="space-y-4 stagger-children">
        {projects.map((project) => (
          <div key={project.id} className="card p-5">
            {editId === project.id ? (
              <div className="space-y-4 animate-fade-in py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 uppercase">Project Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/50 uppercase">Description</label>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => setEditId(null)} className="btn-secondary">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={() => handleUpdate(project.id)} disabled={isUpdating} className="btn-primary">
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-white/40 mt-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-white/30">Created {formatDate(project.createdAt)}</span>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5">
                        <Hash className="w-3 h-3 text-white/30" />
                        <span className="text-xs text-white/50">{project._count.issues} issues</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <button
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors border border-white/5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Issues
                  </button>
                  <button
                    onClick={() => router.push(`/projects/${project.id}/team`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 text-xs font-semibold transition-colors border border-brand-500/20"
                  >
                    <Users className="w-3.5 h-3.5" /> Team
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
                  <button
                    onClick={() => startEdit(project)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project.id, project.name)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
