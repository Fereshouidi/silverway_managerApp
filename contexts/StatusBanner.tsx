"use client";

import React, { createContext, ReactNode, useContext, useState, CSSProperties } from "react";

// Context type
type StatusBannerContextType = {
  statusBannerExist: boolean;
  setStatusBanner: (
    visibility: boolean,
    text?: string | null,
    items?: React.JSX.Element | null,
    className?: string | null,
    style?: CSSProperties | null,
    contentClassName?: string | null,
    contentStyle?: CSSProperties | null
  ) => void;
  text: string | null;
  setText: (value: string | null) => void;
  items: React.JSX.Element | null;
  setItems: (value: React.JSX.Element | null) => void;
  className: string | null;
  setClassName: (value: string | null) => void;
  style: CSSProperties | null;
  setStyle: (value: CSSProperties | null) => void;
  contentClassName: string | null;
  setContentClassName: (value: string | null) => void;
  contentStyle: CSSProperties | null;
  setContentStyle: (value: CSSProperties | null) => void;
};

const StatusBannerContext = createContext<StatusBannerContextType | undefined>(undefined);

export const StatusBannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [statusBannerExist, setStatusBannerExist] = useState<boolean>(false);
  const [text, setText] = useState<string | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [style, setStyle] = useState<CSSProperties | null>(null);
  const [contentClassName, setContentClassName] = useState<string | null>(null);
  const [contentStyle, setContentStyle] = useState<CSSProperties | null>(null);
  const [items, setItems] = useState<React.JSX.Element | null>(null);

  const setStatusBanner = (
    visibility: boolean,
    newText?: string | null,
    newItems?: React.JSX.Element | null,
    newClassName?: string | null,
    newStyle?: CSSProperties | null,
    newContentClassName?: string | null,
    newContentStyle?: CSSProperties | null
  ) => {
    setStatusBannerExist(visibility);
    if (newText !== undefined) setText(newText);
    if (newItems !== undefined) setItems(newItems);
    if (newClassName !== undefined) setClassName(newClassName);
    if (newStyle !== undefined) setStyle(newStyle);
    if (newContentClassName !== undefined) setContentClassName(newContentClassName);
    if (newContentStyle !== undefined) setContentStyle(newContentStyle);
  };

  return (
    <StatusBannerContext.Provider
      value={{
        statusBannerExist,
        setStatusBanner,
        text,
        setText,
        items,
        setItems,
        className,
        setClassName,
        style,
        setStyle,
        contentClassName,
        setContentClassName,
        contentStyle,
        setContentStyle,
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
