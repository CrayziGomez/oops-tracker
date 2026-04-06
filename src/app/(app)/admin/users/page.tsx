"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  Loader2,
  AlertTriangle,
  Shield,
  User,
  Mail,
  Hash,
  Eye,
  EyeOff,
  Trash2,
  KeyRound,
  Settings2,
  FolderKanban,
  CheckCircle2,
  X,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { issues: number };
  projectMembers: { 
    projectId: string; 
    role: string; 
    project: { name: string } 
  }[];
}

interface ProjectItem {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [manageProjectUserId, setManageProjectUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: session } = useSession();

  const fetchUsers = async () => {
    try {
      const [usersRes, projectsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/projects")
      ]);

      if (usersRes.ok) setUsers(await usersRes.json());
      if (projectsRes.ok) setAllProjects(await projectsRes.json());
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, role }),
      });

      if (res.ok) {
        setName("");
        setEmail("");
        setPassword("");
        setRole("USER");
        setShowCreate(false);
        await fetchUsers();
      } else {
        const err = await res.json();
        setError(err.error || "Failed to create user");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!resetPassword || resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters");
      return;
    }
    setIsResetting(true);
    setResetError("");
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: resetPassword }),
      });
      if (res.ok) {
        setResetUserId(null);
        setResetPassword("");
      } else {
        const err = await res.json();
        setResetError(err.error || "Failed to reset password");
      }
    } catch {
      setResetError("An unexpected error occurred");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === session?.user?.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete the user "${name}"? This will permanently remove their access.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchUsers();
      } else {
        const err = await res.json();
        
        // If it's a history error, ask for Force Delete
        if (err.error === "Cannot delete user with active history") {
          if (confirm(`${err.details}\n\nWould you like to FORCE DELETE this user? Their issues and comments will be reassigned to YOU to preserve history.`)) {
            const forceRes = await fetch(`/api/users/${id}?force=true`, { method: "DELETE" });
            if (forceRes.ok) {
              await fetchUsers();
              return;
            } else {
              const forceErr = await forceRes.json();
              alert(forceErr.error || "Force delete failed");
            }
          }
        } else {
          const message = err.details ? `${err.error}: ${err.details}` : (err.error || "Failed to delete user");
          alert(message);
        }
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("An unexpected error occurred");
    }
  };

  const handleSyncMemberships = async (userId: string, memberships: any[]) => {
    setIsSyncing(true);
    try {
      // Clean memberships for the API (extract only IDs and Roles)
      const cleanMemberships = memberships.map(m => ({
        projectId: m.projectId,
        role: m.role
      }));

      const res = await fetch(`/api/users/${userId}/memberships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberships: cleanMemberships }),
      });

      if (res.ok) {
        // Optimistic update or just refetch
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update project access");
      }
    } catch (err) {
      console.error("Membership sync error:", err);
      alert("An unexpected error occurred");
    } finally {
      setIsSyncing(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Users</h1>
          <p className="text-white/40 mt-1">Manage user accounts</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="card p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">
            Create User
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="user-name" className="text-sm font-medium text-white/60">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="user-email" className="text-sm font-medium text-white/60">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="john@company.com"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="user-password" className="text-sm font-medium text-white/60">
                  Password <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
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
                disabled={isCreating || !name.trim() || !email.trim() || !password}
                className="btn-primary"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3 stagger-children">
        {users.map((user: UserItem) => (
          <div key={user.id} className="card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-white">
                      {user.name}
                    </h3>
                    <span
                      className={`badge text-[10px] ${
                        user.role === "OWNER"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {user.role === "OWNER" ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {user.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="w-3 h-3 text-white/20" />
                    <span className="text-sm text-white/40">{user.email}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {user.projectMembers.map((m) => (
                      <span 
                        key={m.projectId}
                        className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border 
                          ${m.role === "PROJECT_ADMIN" 
                            ? "bg-brand-500/10 text-brand-400 border-brand-500/20" 
                            : "bg-white/5 text-white/40 border-white/10"}`}
                      >
                        {m.role === "PROJECT_ADMIN" && <Shield className="w-2.5 h-2.5 inline mr-1 -mt-0.5" />}
                        {m.project.name}
                      </span>
                    ))}
                    {user.projectMembers.length === 0 && user.role !== "OWNER" && (
                      <span className="text-[9px] font-bold text-white/10 italic">No project access</span>
                    )}
                    {user.role === "OWNER" && user.projectMembers.length === 0 && (
                      <span className="text-[9px] font-black text-amber-400/40 uppercase tracking-[0.1em]">Global Access</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-white/30">
                    <Hash className="w-3.5 h-3.5" />
                    {user._count.issues} issues
                  </div>
                  <span className="text-xs text-white/20">
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>
                <button
                  onClick={() => setManageProjectUserId(user.id)}
                  className={`p-2 rounded-lg transition-all ${
                    manageProjectUserId === user.id
                      ? "text-brand-400 bg-brand-400/10"
                      : "text-white/20 hover:text-brand-400 hover:bg-brand-400/10"
                  }`}
                  title="Manage project memberships"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setResetUserId(resetUserId === user.id ? null : user.id);
                    setResetPassword("");
                    setResetError("");
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    resetUserId === user.id
                      ? "text-brand-400 bg-brand-400/10"
                      : "text-white/20 hover:text-brand-400 hover:bg-brand-400/10"
                  }`}
                  title="Reset password"
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                {user.id !== session?.user?.id && (
                  <button
                    onClick={() => handleDelete(user.id, user.name)}
                    className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Inline reset password form */}
            {resetUserId === user.id && (
              <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                <p className="text-xs text-white/40 mb-3">Set a new password for <span className="text-white/60">{user.name}</span></p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="input-field pr-10 text-sm"
                      placeholder="New password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
                    >
                      {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    disabled={isResetting || !resetPassword}
                    className="btn-primary text-sm"
                  >
                    {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </button>
                  <button
                    onClick={() => { setResetUserId(null); setResetPassword(""); setResetError(""); }}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
                {resetError && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {resetError}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Project Manager Modal */}
      {manageProjectUserId && (() => {
        const user = users.find(u => u.id === manageProjectUserId);
        if (!user) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="card w-full max-w-lg p-6 shadow-2xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Project Access</h2>
                  <p className="text-sm text-white/40">Manage projects for <span className="text-brand-400 font-medium">{user.name}</span></p>
                </div>
                <button 
                  onClick={() => setManageProjectUserId(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {allProjects.map((project) => {
                  const membership = user.projectMembers.find(m => m.projectId === project.id);
                  const isMember = !!membership;
                  const isAdmin = membership?.role === "PROJECT_ADMIN";

                  return (
                    <div 
                      key={project.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all 
                        ${isMember ? "bg-white/[0.04] border-white/10" : "bg-transparent border-white/5 opacity-60"}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center 
                          ${isMember ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-white/20"}`}>
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <span className={`text-sm font-medium ${isMember ? "text-white" : "text-white/40"}`}>
                          {project.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isMember ? (
                          <>
                            <button
                              onClick={async () => {
                                const newRole = isAdmin ? "PROJECT_REPORTER" : "PROJECT_ADMIN";
                                await handleSyncMemberships(user.id, 
                                  user.projectMembers.map(m => m.projectId === project.id ? { ...m, role: newRole } : m)
                                );
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border
                                ${isAdmin 
                                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                                  : "bg-white/5 text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"}`}
                            >
                              <Shield className="w-3 h-3" />
                              {isAdmin ? "Admin" : "Reporter"}
                            </button>
                            <button
                              onClick={() => handleSyncMemberships(user.id, user.projectMembers.filter(m => m.projectId !== project.id))}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-colors"
                              title="Remove access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleSyncMemberships(user.id, [...user.projectMembers, { projectId: project.id, role: "PROJECT_REPORTER", project: { name: project.name } }])}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setManageProjectUserId(null)}
                  className="btn-primary w-full"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {users.length === 0 && !showCreate && (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white/60 mb-2">
            No users yet
          </h3>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create User
          </button>
        </div>
      )}
    </div>
  );
}
