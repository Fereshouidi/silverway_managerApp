"use client";

import { AdminType } from "@/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

type AdminContextType = {
  admin: AdminType | null;
  setAdmin: (admin: AdminType | null) => void;
  updateAdmin: (data: Partial<AdminType>) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminType | null>(null);

  const updateAdmin = (data: Partial<AdminType>) => {
    setAdmin(prev => (prev ? { ...prev, ...data } : { ...data } as AdminType));
  };

  return (
    <AdminContext.Provider value={{ admin, setAdmin, updateAdmin }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};