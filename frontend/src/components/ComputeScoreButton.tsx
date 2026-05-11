"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/lib/wallet";
import { useT } from "@/lib/i18n";
import { ADDRS, ETHERSCAN_ADDR, ETHERSCAN_TX, submitComputeScore } from "@/lib/chain";

type TxStatus = "idle" | "signing" | "pending" | "confirmed" | "error";

/**
 * The one real Sepolia write we expose to Live-mode visitors. Calls
 * `CreditScoreEngine.computeScore(1)` which is permissionless (no governor
 * or borrower-owner check) yet meaningful — it runs FHE.add / FHE.mul /
 * FHE.sub / FHE.select on encrypted state, re-grants ACL to the pool and
 * borrower wallet via FHE.allow, and emits ScoreComputed.
 *
 * For an unregistered borrower id the encrypted inputs default to zero, so
 * the resulting score is zero — but the *cryptographic execution* is real
 * and verifiable on Etherscan / Sepolia.
 */
export function ComputeScoreButton({ id = 1 }: { id?: number }) {
  const t = useT();
  const w = useWallet();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canClick = w.status === "connected" && status === "idle";

  const submit = async () => {
    if (!canClick) return;
    setStatus("signing");
    setErrorMsg(null);
    setTxHash(null);
    try {
      // The tx-submission `signing` phase covers wallet popup + user
      // confirmation; once we have a hash we flip to `pending` for the
      // block-confirmation wait.
      const result = await submitComputeScore(id);
      setTxHash(result.txHash);
      setStatus("confirmed");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      // Strip noisy wallet error scaffolding so users see the actual cause.
      const cleaned = msg.replace(/^Error: |\(action=.*?\)$/g, "").slice(0, 180);
      setErrorMsg(cleaned);
      setStatus("error");
    }
  };

  return (
    <div className="rounded-card border-2 border-mint/50 bg-mint-bg/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[220px]">
          <h4
            className="text-sm font-bold leading-tight text-ink"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.005em" }}
          >
            ⚡ {t.live.computeScoreTitle}
          </h4>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            {t.live.computeScoreSub}
          </p>
          <a
            href={ETHERSCAN_ADDR(ADDRS.credit)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block font-mono text-[10px] text-ink-muted transition-colors hover:text-mint-active"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            CreditScoreEngine · {ADDRS.credit.slice(0, 6)}…{ADDRS.credit.slice(-4)} ↗
          </a>
        </div>

        <div className="flex flex-col items-end gap-2">
          <ActionButton
            status={status}
            disabled={!canClick}
            onClick={submit}
            labels={{
              idle: t.live.computeScoreBtn,
              signing: t.live.computeScoreSubmitting,
              pending: t.live.computeScorePending,
              confirmed: t.live.computeScoreSuccess,
              error: t.live.computeScoreBtn,
            }}
          />
          {!w.hasWallet ? (
            <span
              className="text-[10px] text-ink-soft"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t.wallet.installPrompt}
            </span>
          ) : w.status === "disconnected" ? (
            <span
              className="text-[10px] text-ink-soft"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ↑ {t.wallet.connect}
            </span>
          ) : w.status === "wrong-network" ? (
            <span
              className="text-[10px] text-app-coral"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              ⚠ {t.wallet.switchToSepolia}
            </span>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {txHash && (
          <motion.div
            key="tx"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div className="rounded-pill border-2 border-success/40 bg-success/15 px-3 py-1.5">
              <a
                href={ETHERSCAN_TX(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] font-bold text-success transition-colors hover:text-ink-body"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                ✓ {txHash.slice(0, 10)}…{txHash.slice(-8)} · {t.live.viewTx}
              </a>
            </div>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            key="err"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            <div
              className="rounded-pill border-2 border-app-coral/40 bg-app-coral/10 px-3 py-1.5 font-mono text-[11px] text-app-coral"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {errorMsg}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionButton({
  status,
  disabled,
  onClick,
  labels,
}: {
  status: TxStatus;
  disabled: boolean;
  onClick: () => void;
  labels: Record<TxStatus, string>;
}) {
  const isLoading = status === "signing" || status === "pending";
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={!disabled && !isLoading ? { y: -1 } : undefined}
      whileTap={!disabled && !isLoading ? { y: 1 } : undefined}
      className={`btn-pill ${
        status === "confirmed" ? "" : ""
      } ${disabled || isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
      style={{
        background:
          status === "confirmed" ? "var(--color-success)" : undefined,
        minWidth: 160,
      }}
    >
      {isLoading && (
        <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-white" />
      )}
      {labels[status]}
    </motion.button>
  );
}
