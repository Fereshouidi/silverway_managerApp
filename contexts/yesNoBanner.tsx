"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

type BannerOptions = {
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
};

type BannerContextType = {
  showBanner: (options: BannerOptions) => void;
  hideBanner: () => void;
  bannerConfig: BannerOptions | null;
  isVisible: boolean;
};

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export const BannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [bannerConfig, setBannerConfig] = useState<BannerOptions | null>(null);

  const showBanner = (options: BannerOptions) => {
    setBannerConfig(options);
    setIsVisible(true);
  };

  const hideBanner = () => {
    setIsVisible(false);
    // ننتظر قليلاً قبل مسح البيانات لضمان عدم اختفاء النص أثناء حركة الإغلاق
    setTimeout(() => setBannerConfig(null), 300); 
  };

  return (
    <BannerContext.Provider value={{ showBanner, hideBanner, bannerConfig, isVisible }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = (): BannerContextType => {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error("useBanner must be used within a BannerProvider");
  }
  return context;
};