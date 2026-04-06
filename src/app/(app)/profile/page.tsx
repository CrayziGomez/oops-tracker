"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User, Mail, Lock, Loader2, AlertTriangle, CheckCircle, Eye, EyeOff, Send } from "lucide-react";

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

  const userId = session?.user?.id;

  const patch = async (body: Record<string, string>) => {
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

  // Fetch initial telegram data
  useState(() => {
    if (userId && !hasLoadedTelegram) {
      fetch(`/api/users/${userId}`)
        .then(res => res.json())
        .then(data => {
          setTelegramChatId(data.telegramChatId || "");
          setTelegramEnabled(data.telegramEnabled || false);
          setHasLoadedTelegram(true);
        });
    }
  });

  const handleTelegramSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramLoading(true);
    setTelegramMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          telegramChatId: telegramChatId.trim() || null,
          telegramEnabled 
        }),
      });
      if (res.ok) {
        setTelegramMsg({ type: "success", text: "Telegram settings updated." });
      } else {
        const err = await res.json();
        setTelegramMsg({ type: "error", text: err.error || "Failed to update Telegram settings" });
      }
    } catch {
      setTelegramMsg({ type: "error", text: "An unexpected error occurred" });
    } finally {
      setTelegramLoading(false);
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

      {/* Telegram Foundation */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/70 font-semibold">
            <Send className="w-4 h-4 text-brand-400" />
            Telegram Notifications
          </div>
          <span className="text-[10px] bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Foundation
          </span>
        </div>
        
        <form onSubmit={handleTelegramSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-white/30">Telegram Chat ID</label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="input-field"
              placeholder="e.g. 123456789"
            />
            <p className="text-[10px] text-white/20 italic">
              Your Chat ID is required for the bot to send you direct messages.
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
            </div>
            <span className="text-sm text-white/60 group-hover:text-white transition-colors">
              Enable Telegram Alerts
            </span>
          </label>

          {telegramMsg && <Feedback msg={telegramMsg} />}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={telegramLoading}
              className="btn-primary"
            >
              {telegramLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Telegram Settings"}
            </button>
          </div>
        </form>
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
