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
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { issues: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("REPORTER");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const { data: session } = useSession();

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
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
        setRole("REPORTER");
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
        alert(err.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Failed to delete user:", err);
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
              <div className="space-y-2">
                <label htmlFor="user-role" className="text-sm font-medium text-white/60">
                  Role
                </label>
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                >
                  <option value="REPORTER" className="bg-surface-900">
                    Reporter
                  </option>
                  <option value="ADMIN" className="bg-surface-900">
                    Admin
                  </option>
                </select>
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
        {users.map((user) => (
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
                        user.role === "ADMIN"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {user.role === "ADMIN" ? (
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
