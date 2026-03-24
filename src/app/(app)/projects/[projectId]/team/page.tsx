"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  Trash2,
  AlertTriangle,
  Shield,
  User,
  Search,
} from "lucide-react";
import { useProject } from "@/components/providers/project-provider";

interface ProjectMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function ProjectTeamPage() {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("PROJECT_REPORTER");
  const [isAdding, setIsAdding] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { activeProject, projects } = useProject();
  const { data: session } = useSession();

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        setAvailableUsers(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch available users", error);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchMembers();
      if (session?.user?.role === "OWNER") {
        fetchAvailableUsers();
      }
    }
  }, [projectId, fetchMembers, session]);

  // Wait until we determine if user is admin
  const isGlobalOwner = session?.user?.role === "OWNER";
  const myMemberRecord = members.find(m => m.user.id === session?.user?.id);
  const isProjectAdmin = myMemberRecord?.role === "PROJECT_ADMIN" || isGlobalOwner;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser, role: selectedRole })
      });
      if (res.ok) {
        await fetchMembers();
        setShowAddMember(false);
        setSelectedUser("");
      } else {
        alert("Failed to add member.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this project?`)) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members?userId=${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchMembers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!isProjectAdmin) {
    return (
      <div className="card p-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400/50 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white/60 mb-2">Access Denied</h3>
        <p className="text-sm text-white/40">You must be a Project Admin to manage the team.</p>
        <button onClick={() => router.push(`/projects/${projectId}`)} className="btn-secondary mt-6">
          Back to Project
        </button>
      </div>
    );
  }

  // Filter out users already in the project for the dropdown
  const unassignedUsers = availableUsers.filter(
    (u) => !members.some((m) => m.user.id === u.id)
  ).filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <button
        onClick={() => router.push(`/projects/${projectId}`)}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {activeProject?.name || "Project"} Issues
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Project Team</h1>
          <p className="text-white/40 mt-1">Manage who has access to {activeProject?.name}</p>
        </div>
        {!showAddMember && (
          <button onClick={() => { setShowAddMember(true); fetchAvailableUsers(); }} className="btn-primary">
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {showAddMember && (
        <div className="card p-6 border border-brand-500/30">
          <h2 className="text-lg font-semibold text-white mb-4">Add Project Member</h2>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Select User</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 mb-2" 
                  />
                </div>
                <select 
                  size={4}
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="input-field w-full h-32"
                  required
                >
                  {unassignedUsers.map(u => (
                    <option key={u.id} value={u.id} className="p-2 hover:bg-white/5 rounded">
                      {u.name} ({u.email})
                    </option>
                  ))}
                  {unassignedUsers.length === 0 && <option disabled>No users found</option>}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/60">Project Role</label>
                <select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="input-field"
                >
                  <option value="PROJECT_REPORTER">Project Reporter</option>
                  <option value="PROJECT_ADMIN">Project Admin</option>
                </select>
                <p className="text-xs text-white/30 mt-2">
                  Admins can manage this team and close issues. Reporters can only view and submit issues.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={!selectedUser || isAdding} className="btn-primary">
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add to Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase">User</th>
              <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase">System Role</th>
              <th className="text-left p-4 text-xs font-semibold text-white/30 uppercase">Project Role</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-white/[0.02]">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-800 flex items-center justify-center text-xs font-bold shrink-0">
                      {m.user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/90">{m.user.name}</div>
                      <div className="text-xs text-white/40">{m.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`badge text-[10px] ${m.user.role === 'OWNER' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-400'}`}>
                    {m.user.role}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`badge text-[10px] ${m.role === 'PROJECT_ADMIN' ? 'bg-brand-500/10 text-brand-400 border-brand-500/30' : 'bg-surface-800 text-white/50'}`}>
                    {m.role === 'PROJECT_ADMIN' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                    {m.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {m.user.id !== session?.user?.id && (!isGlobalOwner || m.user.role !== "OWNER") && (
                    <button 
                      onClick={() => handleRemoveMember(m.user.id, m.user.name)}
                      className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
