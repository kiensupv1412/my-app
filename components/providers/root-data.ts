'use client';
import * as React from 'react';

export type RootData = { articles: any[]; categories: any[]; media:any[]};
const Ctx = React.createContext<RootData | null>(null);

type RootDataProviderProps = { value: RootData; children: React.ReactNode; };

export function RootDataProvider({ value, children }: RootDataProviderProps) {
  return React.createElement(Ctx.Provider, { value }, children);
}

export function useRootData() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useRootData must be used inside <RootDataProvider>');
  return ctx;
}
