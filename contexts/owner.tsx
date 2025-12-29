"use client";

import { OwnerInfoType } from "@/types";
import React, { createContext, ReactNode, useContext, useState } from "react";

type OwnerContextType = {
  ownerInfo: OwnerInfoType | null;
  setOwnerInfo: (ownerInfo: OwnerInfoType | null) => void;
};

const OwnerInfoContext = createContext<OwnerContextType | undefined>(undefined);

export const OwnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfoType | null>(null);

  return (
    <OwnerInfoContext.Provider value={{ ownerInfo, setOwnerInfo }}>
      {children}
    </OwnerInfoContext.Provider>
  );
};

// Custom hook for easy access
export const useOwner = (): OwnerContextType => {
  const context = useContext(OwnerInfoContext);
  if (!context) {
    throw new Error("useOwner must be used within a OwnerInfoContext.Provider");
  }
  return context;
};
