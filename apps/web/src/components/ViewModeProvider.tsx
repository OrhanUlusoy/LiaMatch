"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ViewMode = "admin" | "company" | "student";

type ViewModeCtx = {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAdmin: boolean;
  displayName: string | null;
};

const ViewModeContext = createContext<ViewModeCtx>({
  viewMode: "admin",
  setViewMode: () => {},
  isAdmin: false,
  displayName: null,
});

export function useViewMode() {
  return useContext(ViewModeContext);
}

export function ViewModeProvider({
  role,
  displayName,
  children,
}: {
  role: string | null;
  displayName: string | null;
  children: ReactNode;
}) {
  const isAdmin = role === "admin";
  const [viewMode, setViewModeState] = useState<ViewMode>("student");

  useEffect(() => {
    if (!isAdmin) {
      // Non-admin: sync viewMode to actual role, ignore any localStorage value
      if (role === "company") setViewModeState("company");
      else if (role === "student") setViewModeState("student");
      return;
    }
    // Only admins can restore persisted view mode
    const stored = localStorage.getItem("admin_view_mode") as ViewMode | null;
    if (stored && ["admin", "company", "student"].includes(stored)) {
      setViewModeState(stored);
    } else {
      setViewModeState("admin");
    }
  }, [isAdmin, role]);

  function setViewMode(mode: ViewMode) {
    if (!isAdmin) return; // Non-admins cannot switch view mode
    setViewModeState(mode);
    localStorage.setItem("admin_view_mode", mode);
  }

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, isAdmin, displayName }}>
      {children}
    </ViewModeContext.Provider>
  );
}
