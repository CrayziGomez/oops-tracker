"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Mail, Lock, Loader2, AlertTriangle, CheckCircle, Eye, EyeOff, Send, Bell, ShieldOff, Settings } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  // Name form
  const [name, setName] = useState(session?.user?.name || "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email form
  const [email, setEmail] = useState(session?.user?.email || "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Telegram Settings (Foundation)
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasLoadedTelegram, setHasLoadedTelegram] = useState(false);

  interface ProjectPreference {
    id: string;
    name: string;
    isMember: boolean;
    enabled: boolean;
  }

  // Notification Preferences (New)
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [projectPrefs, setProjectPrefs] = useState<ProjectPreference[]>([]);
  const [prefsLoading, setPrefsLoading] = useState(false);

  const userId = session?.user?.id;

  const patch = async (body: Record<string, any>) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  };

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === session?.user?.name) return;
    setNameLoading(true);
    setNameMsg(null);
    try {
      const res = await patch({ name });
      if (res.ok) {
        setNameMsg({ type: "success", text: "Name updated. Sign out and back in to see it reflected everywhere." });
      } else {
        const err = await res.json();
        setNameMsg({ type: "error", text: err.error || "Failed to update name" });
      }
    } catch {
      setNameMsg({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setNameLoading(false);
    }
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !emailPassword) return;
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      const res = await patch({ email, currentPassword: emailPassword });
      if (res.ok) {
        setEmailPassword("");
        setEmailMsg({ type: "success", text: "Email updated. Please sign out and back in for the change to take effect." });
      } else {
        const err = await res.json();
        setEmailMsg({ type: "error", text: err.error || "Failed to update email" });
      }
    } catch {
      setEmailMsg({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "Password must be at least 8 characters" });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      const res = await patch({ currentPassword, newPassword });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordMsg({ type: "success", text: "Password changed successfully." });
      } else {
        const err = await res.json();
        setPasswordMsg({ type: "error", text: err.error || "Failed to change password" });
      }
    } catch {
      setPasswordMsg({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Fetch initial preferences
  useEffect(() => {
    if (userId && !hasLoadedTelegram) {
      fetch(`/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setTelegramChatId(data.telegramChatId || "");
          setTelegramEnabled(data.telegramEnabled || false);
          setEmailEnabled(data.emailEnabled !== undefined ? data.emailEnabled : true);
          setHasLoadedTelegram(true);
        });

      // Fetch project preferences
      setPrefsLoading(true);
      fetch(`/api/notifications/preferences`)
        .then(res => res.json())
        .then(data => setProjectPrefs(data))
        .finally(() => setPrefsLoading(false));
    }
  }, [userId, hasLoadedTelegram]);

  const handleGlobalToggle = async (type: "email" | "telegram", value: boolean) => {
    try {
      const body = type === "email" ? { emailEnabled: value } : { telegramEnabled: value };
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (type === "email") setEmailEnabled(value);
      else setTelegramEnabled(value);
    } catch (err) {
      console.error("Failed to toggle global setting:", err);
    }
  };

  const handleProjectToggle = async (projectId: string, enabled: boolean) => {
    try {
      setProjectPrefs((prev: ProjectPreference[]) => prev.map((p: ProjectPreference) => p.id === projectId ? { ...p, enabled } : p));
      await fetch(`/api/notifications/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, enabled }),
      });
    } catch (err) {
      console.error("Failed to toggle project setting:", err);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">My Account</h1>
        <p className="text-white/40 mt-1">{session?.user?.email}</p>
      </div>

      {/* Update Name */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/70 font-semibold">
          <User className="w-4 h-4" />
          Display Name
        </div>
        <form onSubmit={handleNameSave} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Your name"
            required
          />
          {nameMsg && <Feedback msg={nameMsg} />}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={nameLoading || !name.trim() || name.trim() === session?.user?.name}
              className="btn-primary"
            >
              {nameLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Name"}
            </button>
          </div>
        </form>
      </div>

      {/* Update Email */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/70 font-semibold">
          <Mail className="w-4 h-4" />
          Email Address
        </div>
        <form onSubmit={handleEmailSave} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            required
          />
          <input
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            className="input-field"
            placeholder="Current password to confirm"
            required
          />
          {emailMsg && <Feedback msg={emailMsg} />}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailLoading || !email.trim() || !emailPassword}
              className="btn-primary"
            >
              {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 text-white/70 font-semibold">
          <Lock className="w-4 h-4" />
          Change Password
        </div>
        <form onSubmit={handlePasswordSave} className="space-y-3">
          <PasswordInput
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
            placeholder="Current password"
          />
          <PasswordInput
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            placeholder="New password (min. 8 characters)"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            placeholder="Confirm new password"
            required
          />
          {passwordMsg && <Feedback msg={passwordMsg} />}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              className="btn-primary"
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Notification Channels */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-2 text-white/70 font-semibold">
          <Settings className="w-4 h-4" />
          Notification Channels
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email Toggle */}
          <div className="card p-4 bg-white/[0.03] border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80 font-medium">
                  <Mail className="w-4 h-4 text-brand-400" />
                  Email Alerts
                </div>
                <Toggle 
                  enabled={emailEnabled} 
                  onChange={(val) => handleGlobalToggle("email", val)} 
                />
             </div>
             <p className="text-[10px] text-white/30 leading-relaxed">
               Receive issue updates, project invites, and team comments via your inbox.
             </p>
          </div>

          {/* Telegram Toggle */}
          <div className="card p-4 bg-white/[0.03] border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white/80 font-medium">
                  <Send className="w-4 h-4 text-[#0088cc]" />
                  Telegram Bot
                </div>
                <Toggle 
                  enabled={telegramEnabled} 
                  onChange={(val) => handleGlobalToggle("telegram", val)} 
                />
             </div>
             <p className="text-[10px] text-white/30 leading-relaxed">
               Instant mobile alerts when OOPS are logged or updated. Requires Chat ID.
             </p>
          </div>
        </div>

        {/* Telegram Chat ID Configuration (Nested) */}
        <div className="bg-brand-500/5 rounded-xl p-4 border border-brand-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Telegram Link</label>
            {telegramMsg && <span className={`text-[10px] font-medium ${telegramMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>{telegramMsg.text}</span>}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="input-field bg-black/20"
              placeholder="Your Chat ID (e.g. 123456789)"
            />
            <button
              onClick={() => {
                setTelegramLoading(true);
                fetch(`/api/users/${userId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ telegramChatId: telegramChatId.trim() || null }),
                }).then(() => {
                   setTelegramMsg({ type: 'success', text: 'Linked!' });
                   setTimeout(() => setTelegramMsg(null), 2000);
                }).finally(() => setTelegramLoading(false));
              }}
              disabled={telegramLoading}
              className="btn-primary py-2 px-4 h-auto text-xs"
            >
              {telegramLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Link"}
            </button>
          </div>
          <p className="text-[10px] text-white/20">
            Get your ID from <a href="https://t.me/userinfobot" target="_blank" className="text-white/40 hover:underline">@userinfobot</a>. Starting the bot first is required.
          </p>
        </div>
      </div>

      {/* Project Subscriptions */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 font-semibold">
            <Bell className="w-4 h-4" />
            Project Subscriptions
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            {projectPrefs.length} Active
          </div>
        </div>

        <p className="text-xs text-white/40 leading-relaxed bg-white/[0.02] p-3 rounded-lg border border-white/5">
           Manage alerts for projects you are a member of. If you don't see a project here, you may need to be added to it by an administrator.
        </p>

        {prefsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
        ) : projectPrefs.length === 0 ? (
          <div className="py-12 px-6 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldOff className="w-6 h-6 text-white/10" />
            </div>
            <div className="text-sm font-medium text-white/60 mb-1">No Projects Found</div>
            <p className="text-[11px] text-white/30 leading-relaxed">
              You haven't joined any projects yet. Projects you belong to will appear here for notification control.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {projectPrefs.map((pref: ProjectPreference) => (
              <div 
                key={pref.id} 
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  pref.enabled 
                  ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.05]' 
                  : 'bg-black/20 border-white/5 opacity-60 grayscale'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${pref.enabled ? 'bg-brand-500/10 text-brand-400' : 'bg-white/5 text-white/20'}`}>
                    {pref.enabled ? <Bell className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">{pref.name}</div>
                    <div className="text-[10px] text-white/30 flex items-center gap-1.5 mt-0.5">
                       <span className="flex items-center gap-1">
                         <span className={`w-1 h-1 rounded-full ${pref.enabled ? 'bg-brand-500' : 'bg-white/10'}`} /> 
                         {pref.enabled ? 'Notifications Active' : 'Muted'}
                       </span>
                    </div>
                  </div>
                </div>
                <Toggle 
                  enabled={pref.enabled} 
                  onChange={(val) => handleProjectToggle(pref.id, val)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="card p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">Signed in as</p>
          <p className="text-sm text-white/40">{session?.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn-secondary"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function Feedback({ msg }: { msg: { type: "success" | "error"; text: string } }) {
  return (
    <div
      className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm border ${
        msg.type === "success"
          ? "bg-green-500/10 border-green-500/20 text-green-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}
    >
      {msg.type === "success" ? (
        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      {msg.text}
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input 
        type="checkbox" 
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer" 
      />
      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] rtl:peer-checked:after:-translate-x-[20px] after:content-[''] after:absolute after:top-1 after:start-[5px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-brand-500"></div>
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field pr-10"
        placeholder={placeholder}
        required
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
