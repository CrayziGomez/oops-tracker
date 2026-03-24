"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface Project {
  id: string;
  name: string;
  description?: string;
  _count?: { issues: number };
  members?: { role: string }[];
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  refreshProjects: () => Promise<void>;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  setActiveProject: () => {},
  refreshProjects: async () => {},
  isLoading: true,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);

        // Restore active project from localStorage or use first
        const savedId =
          typeof window !== "undefined"
            ? localStorage.getItem("activeProjectId")
            : null;
        const saved = data.find((p: Project) => p.id === savedId);
        if (saved) {
          setActiveProjectState(saved);
        } else if (data.length > 0 && !activeProject) {
          setActiveProjectState(data[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProjects();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [fetchProjects, status]);

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (typeof window !== "undefined") {
      if (project) {
        localStorage.setItem("activeProjectId", project.id);
      } else {
        localStorage.removeItem("activeProjectId");
      }
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        refreshProjects: fetchProjects,
        isLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
