"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  connectWallet as doConnect,
  getInjected,
  hasInjectedWallet,
  INITIAL_WALLET,
  SEPOLIA_CHAIN_ID,
  switchToSepolia as doSwitch,
  type WalletState,
} from "./chain";

interface WalletContextValue extends WalletState {
  hasWallet: boolean;
  connect: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  /** Last error message surfaced from any wallet call. */
  error: string | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

/**
 * Tracks the injected wallet (MetaMask et al). No auto-connect on mount —
 * the user must click. Listens to `accountsChanged` and `chainChanged` so
 * the UI reflects MetaMask UI state without page reload.
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>(INITIAL_WALLET);
  const [error, setError] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    setHasWallet(hasInjectedWallet());
  }, []);

  // Subscribe to wallet events so UI auto-updates when user switches account
  // or network in MetaMask itself.
  useEffect(() => {
    const injected = getInjected();
    if (!injected || !injected.on) return;

    const handleAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        setState(INITIAL_WALLET);
      } else {
        setState((s) => ({
          ...s,
          address: accounts[0],
          status:
            s.chainId === SEPOLIA_CHAIN_ID
              ? "connected"
              : s.chainId
              ? "wrong-network"
              : "connecting",
        }));
      }
    };
    const handleChain = (...args: unknown[]) => {
      const chainHex = args[0] as string;
      const id = parseInt(chainHex, 16);
      setState((s) => ({
        ...s,
        chainId: id,
        status: !s.address
          ? "disconnected"
          : id === SEPOLIA_CHAIN_ID
          ? "connected"
          : "wrong-network",
      }));
    };

    injected.on("accountsChanged", handleAccounts);
    injected.on("chainChanged", handleChain);
    return () => {
      injected.removeListener?.("accountsChanged", handleAccounts);
      injected.removeListener?.("chainChanged", handleChain);
    };
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setState((s) => ({ ...s, status: "connecting" }));
    try {
      const { address, chainId } = await doConnect();
      setState({
        address,
        chainId,
        status: chainId === SEPOLIA_CHAIN_ID ? "connected" : "wrong-network",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to connect";
      setError(msg);
      setState(INITIAL_WALLET);
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    setError(null);
    try {
      await doSwitch();
      // chainChanged listener above will update state
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to switch network";
      setError(msg);
    }
  }, []);

  const value: WalletContextValue = {
    ...state,
    hasWallet,
    connect,
    switchToSepolia,
    error,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
