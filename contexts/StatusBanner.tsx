"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

// Context type
export type BannerType = 'success' | 'error' | 'warning' | 'info';

type StatusBannerContextType = {
  statusBannerExist: boolean;
  setStatusBanner: (
    visibility: boolean,
    text?: string | null,
    type?: BannerType,
    items?: React.ReactNode | null,
    duration?: number
  ) => void;
  text: string | null;
  type: BannerType;
  items: React.ReactNode | null;
};

const StatusBannerContext = createContext<StatusBannerContextType | undefined>(undefined);

export const StatusBannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [statusBannerExist, setStatusBannerExist] = useState<boolean>(false);
  const [text, setText] = useState<string | null>(null);
  const [type, setType] = useState<BannerType>('info');
  const [items, setItems] = useState<React.ReactNode | null>(null);
  const timerRef = React.useRef<any>(null);

  const setStatusBanner = (
    visibility: boolean,
    newText?: string | null,
    newType: BannerType = 'info',
    newItems: React.ReactNode | null = null,
    duration: number = 3500
  ) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    setStatusBannerExist(visibility);
    if (visibility) {
      if (newText !== undefined) setText(newText);
      setType(newType);
      setItems(newItems);

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setStatusBannerExist(false);
        }, duration);
      }
    }
  };

  return (
    <StatusBannerContext.Provider
      value={{
        statusBannerExist,
        setStatusBanner,
        text,
        type,
        items,
      }}
    >
      {children}
    </StatusBannerContext.Provider>
  );
};

export const useStatusBanner = (): StatusBannerContextType => {
  const context = useContext(StatusBannerContext);
  if (!context) {
    throw new Error("useStatusBanner must be used within a StatusBannerProvider");
  }
  return context;
};
