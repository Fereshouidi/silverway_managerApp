"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

// تعريف شكل الحالة الجديدة
type LoadingState = {
  isOpen: boolean;
  message?: string;
};

type LoadingScreenType = {
  loadingScreen: LoadingState;
  // أضفنا القدرة على تمرير نص اختياري عند التفعيل
  setLoadingScreen: (value: boolean, message?: string) => void;
};

const LoadingScreenContext = createContext<LoadingScreenType | undefined>(undefined);

export const LoadingScreenProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LoadingState>({
    isOpen: false,
    message: "",
  });

  // دالة محسنة للتحكم في الشاشة
  const setLoadingScreen = (isOpen: boolean, message?: string) => {
    setState({ isOpen, message: message || "" });
  };

  return (
    <LoadingScreenContext.Provider value={{ 
        loadingScreen: state, 
        setLoadingScreen 
    }}>
      {children}
    </LoadingScreenContext.Provider>
  );
};

export const useLoadingScreen = (): LoadingScreenType => {
  const context = useContext(LoadingScreenContext);
  if (!context) {
    throw new Error("useLoadingScreen must be used within a LoadingScreenProvider");
  }
  return context;
};