"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";

interface Project {
  id: string;
  name: string;
  description?: string;
  _count?: { issues: number };
  members?: { role: string }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  refreshProjects: () => void;
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType>({
  projects: [],
  activeProject: null,
  setActiveProject: () => {},
  refreshProjects: () => {},
  isLoading: true,
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  
  // 1. SWR for Dynamic Project List
  const { 
    data: projects = [], 
    error, 
    isLoading: swrLoading,
    mutate 
  } = useSWR<Project[]>(
    status === "authenticated" ? "/api/projects" : null, 
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
    }
  );

  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // 2. Active Project Management & Cleanup
  useEffect(() => {
    if (status === "authenticated" && !swrLoading && Array.isArray(projects)) {
      // Restore from localStorage or use first
      const savedId = typeof window !== "undefined"
        ? localStorage.getItem("activeProjectId")
        : null;

      const currentActive = projects.find((p) => p.id === (activeProject?.id || savedId));
      
      if (currentActive) {
        if (activeProject?.id !== currentActive.id) {
           setActiveProjectState(currentActive);
        }
      } else if (projects.length > 0) {
        // Fallback or cleanup if previously active project was deleted
        setActiveProjectState(projects[0]);
        if (typeof window !== "undefined") {
          localStorage.setItem("activeProjectId", projects[0].id);
        }
      } else {
        setActiveProjectState(null);
      }
      
      setIsInitialLoading(false);
    } else if (status === "unauthenticated") {
      setIsInitialLoading(false);
    }
  }, [projects, status, swrLoading]);

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
        refreshProjects: () => mutate(),
        isLoading: isInitialLoading || swrLoading,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
