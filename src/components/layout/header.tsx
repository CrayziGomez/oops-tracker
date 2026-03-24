"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useProject } from "@/components/providers/project-provider";
import { useRouter, usePathname } from "next/navigation";
import {
  AlertTriangle,
  LayoutDashboard,
  FolderKanban,
  ChevronDown,
  LogOut,
  Users,
  Plus,
  Menu,
  X,
  Check,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function Header() {
  const { data: session } = useSession();
  const { projects, activeProject, setActiveProject } = useProject();
  const { theme, toggle: toggleTheme } = useTheme();
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = session?.user?.role === "OWNER";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(activeProject
      ? [
          {
            href: `/projects/${activeProject.id}`,
            label: "Issues",
            icon: AlertTriangle,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          { href: "/admin/projects", label: "Projects", icon: FolderKanban },
          { href: "/admin/users", label: "Users", icon: Users },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {showMobileMenu ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => router.push("/dashboard")}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text hidden sm:block">
                OOPS
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-brand-500/15 text-brand-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right section: Project Selector + User */}
          <div className="flex items-center gap-3">
            {/* Project Selector */}
            <div className="relative">
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 
                           hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm"
              >
                <FolderKanban className="w-4 h-4 text-brand-400" />
                <span className="max-w-[120px] truncate hidden sm:block">
                  {activeProject?.name || "Select Project"}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 ${
                    showProjectDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProjectDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProjectDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl glass-panel border border-white/10 shadow-2xl z-50 py-1 animate-fade-in">
                    <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                      Projects
                    </div>
                    {/* All Projects Option */}
                    <button
                      onClick={() => {
                        setActiveProject(null);
                        setShowProjectDropdown(false);
                        router.push("/dashboard");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm 
                                  hover:bg-white/5 transition-colors ${
                                    !activeProject
                                      ? "text-brand-400"
                                      : "text-white/70"
                                  }`}
                    >
                      <div className="flex items-center gap-2 text-brand-400/80">
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="truncate">All Projects</span>
                      </div>
                      {!activeProject && (
                        <Check className="w-4 h-4 text-brand-400" />
                      )}
                    </button>
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setActiveProject(project);
                          setShowProjectDropdown(false);
                          router.push(`/projects/${project.id}`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm 
                                    hover:bg-white/5 transition-colors ${
                                      activeProject?.id === project.id
                                        ? "text-brand-400"
                                        : "text-white/70"
                                    }`}
                      >
                        <div className="flex items-center gap-2">
                          <FolderKanban className="w-4 h-4" />
                          <span className="truncate">{project.name}</span>
                        </div>
                        {activeProject?.id === project.id && (
                          <Check className="w-4 h-4 text-brand-400" />
                        )}
                      </button>
                    ))}
                    {isAdmin && (
                      <>
                        <div className="border-t border-white/5 my-1" />
                        <button
                          onClick={() => {
                            setShowProjectDropdown(false);
                            router.push("/admin/projects");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand-400 hover:bg-white/5 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          New Project
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/profile")}
                className="hidden md:block text-right hover:opacity-80 transition-opacity"
                title="My Account"
              >
                <div className="text-sm font-medium text-white/90">
                  {session?.user?.name}
                </div>
                <div className="text-xs text-white/40">
                  {session?.user?.role}
                </div>
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
                title="My Account"
              >
                {session?.user?.name?.charAt(0)?.toUpperCase() || "?"}
              </button>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {showMobileMenu && (
        <div className="lg:hidden border-t border-white/5 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-brand-500/15 text-brand-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
            {isAdmin && (
              <div className="border-t border-white/5 pt-2 mt-2">
                <button
                  onClick={() => {
                    router.push("/admin/projects");
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
