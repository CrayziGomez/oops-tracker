"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { 
  AlertTriangle, 
  User, 
  Lock, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Mail,
  FolderKanban
} from "lucide-react";

function InviteForm() {
  const [invitationInfo, setInvitationInfo] = useState<any>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setIsLoading(false);
      return;
    }

    const fetchInvite = async () => {
      try {
        const res = await fetch(`/api/invitations/${token}`);
        if (res.ok) {
          setInvitationInfo(await res.json());
        } else {
          const err = await res.json();
          setError(err.error || "Invalid invitation link.");
        }
      } catch (err) {
        setError("Failed to load invitation info.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      if (res.ok) {
        setIsSuccess(true);
        // Automatically sign in
        setTimeout(async () => {
          await signIn("credentials", {
            email: invitationInfo.email,
            password,
            callbackUrl: "/dashboard",
          });
        }, 1500);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to accept invitation");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-surface-950">
        <div className="w-full max-w-md text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome Aboard!</h1>
          <p className="text-white/60">Your account has been created. Redirecting you to the dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-surface-950">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950/30 via-surface-950 to-purple-950/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-purple-500 shadow-xl mb-4">
            <FolderKanban className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Join OOPS</h1>
          {invitationInfo ? (
            <p className="text-white/40 text-sm">
              <span className="text-white font-medium">{invitationInfo.inviterName}</span> invited you to join <span className="text-brand-400 font-semibold">{invitationInfo.projectName}</span>
            </p>
          ) : (
            <p className="text-white/40 text-sm">Create your account to accept the invitation</p>
          )}
        </div>

        <div className="card p-8">
          {error ? (
            <div className="text-center space-y-4 py-4">
              <AlertTriangle className="w-12 h-12 text-red-500/50 mx-auto mb-2" />
              <p className="text-red-400">{error}</p>
              <button 
                onClick={() => router.push("/login")}
                className="btn-secondary w-full"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase ml-1">Account Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="email"
                    value={invitationInfo?.email}
                    disabled
                    className="input-field pl-10 opacity-60 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field pl-10"
                    placeholder="John Doe"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-white/50 uppercase ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-10"
                    placeholder="Repeat your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !password}
                className="btn-primary w-full py-3 mt-4"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Accept Invitation
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface-950"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>}>
      <InviteForm />
    </Suspense>
  );
}
