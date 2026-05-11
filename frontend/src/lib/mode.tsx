"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppMode = "demo" | "live";

const STORAGE_KEY = "conclave-mode";

interface ModeContextValue {
  mode: AppMode;
  setMode: (m: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | null>(null);

/**
 * AppMode separates two distinct experiences:
 *
 * - `demo` (default): the curated narrative shown in the recording.
 *   All values come from `lib/demo-data.ts`, no wallet needed, every click
 *   produces a deterministic, fast, video-friendly response.
 *
 * - `live`: connects to the real Sepolia deployment. Reads contract state
 *   over RPC, lets the visitor connect MetaMask, and exposes the one
 *   permissionless write (`CreditScoreEngine.computeScore(id)`) as a real
 *   on-chain action. Interactive write flows that require governor
 *   privileges or relayer-sdk client-side encryption are disclosed honestly
 *   rather than faked.
 *
 * Honest split: Demo is the *story*; Live is the *proof*. Both ship.
 */
export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("demo");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "demo" || saved === "live") setModeState(saved);
    } catch {
      // ignore unavailable localStorage
    }
  }, []);

  const setMode = (m: AppMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  };

  return (
    <ModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): ModeContextValue {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
