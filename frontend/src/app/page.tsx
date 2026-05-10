"use client";

import { useReducer } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneShell } from "@/components/PhoneShell";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { AppTile } from "@/components/AppTile";
import { RegistryApp } from "@/apps/RegistryApp";
import { ScoreApp } from "@/apps/ScoreApp";
import { PoolApp } from "@/apps/PoolApp";
import { ConclaveApp } from "@/apps/ConclaveApp";
import { PERSONAS, personaById, type PersonaId } from "@/lib/personas";
import {
  BORROWERS,
  POOL_STATS,
  PROPOSALS,
  SEPOLIA_ADDRESSES,
  ETHERSCAN_BASE,
} from "@/lib/demo-data";

type AppId = "registry" | "score" | "pool" | "conclave";
type View = "home" | AppId;

interface AppState {
  view: View;
  persona: PersonaId;
  /** which borrower IDs have authorized regulator decryption */
  regulatorAuthorized: Record<number, boolean>;
}

type Action =
  | { type: "navigate"; view: View }
  | { type: "set-persona"; persona: PersonaId }
  | { type: "set-regulator-auth"; id: number; auth: boolean };

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case "navigate":
      return { ...s, view: a.view };
    case "set-persona":
      return { ...s, view: "home", persona: a.persona };
    case "set-regulator-auth":
      return {
        ...s,
        regulatorAuthorized: { ...s.regulatorAuthorized, [a.id]: a.auth },
      };
  }
}

const initial: AppState = {
  view: "home",
  persona: "borrower",
  regulatorAuthorized: BORROWERS.reduce(
    (acc, b) => ({ ...acc, [b.id]: b.regulatorAuthorized }),
    {} as Record<number, boolean>,
  ),
};

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initial);
  const persona = personaById(state.persona);

  // Inject regulatorAuthorized into the borrower view that ScoreApp reads
  // (lightweight prop drilling — no need for context for a single dependency)
  const borrowersWithAuth = BORROWERS.map((b) => ({
    ...b,
    regulatorAuthorized: state.regulatorAuthorized[b.id] ?? b.regulatorAuthorized,
  }));

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start gap-6 px-4 py-10 sm:px-8 sm:py-14">
      {/* Brand header */}
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍃</span>
          <h1
            className="text-3xl font-bold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Conclave
          </h1>
        </div>
        <p
          className="max-w-md text-sm leading-relaxed text-ink-soft"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Confidential private credit, decided in cryptographic conclave.
        </p>
      </header>

      {/* Persona switcher */}
      <PersonaSwitcher
        active={state.persona}
        onChange={(p) => dispatch({ type: "set-persona", persona: p })}
      />

      {/* Phone */}
      <PhoneShell persona={persona}>
        <AnimatePresence mode="wait">
          {state.view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <HomeView
                persona={persona}
                onOpenApp={(view) => dispatch({ type: "navigate", view })}
              />
            </motion.div>
          )}

          {state.view === "registry" && (
            <motion.div
              key="registry"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <RegistryApp
                persona={state.persona}
                onBack={() => dispatch({ type: "navigate", view: "home" })}
              />
            </motion.div>
          )}

          {state.view === "score" && (
            <motion.div
              key="score"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <ScoreAppWrapper
                persona={state.persona}
                authMap={state.regulatorAuthorized}
                onBack={() => dispatch({ type: "navigate", view: "home" })}
                onSetAuth={(id, auth) =>
                  dispatch({ type: "set-regulator-auth", id, auth })
                }
              />
            </motion.div>
          )}

          {state.view === "pool" && (
            <motion.div
              key="pool"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <PoolApp
                onBack={() => dispatch({ type: "navigate", view: "home" })}
              />
            </motion.div>
          )}

          {state.view === "conclave" && (
            <motion.div
              key="conclave"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <ConclaveApp
                persona={state.persona}
                onBack={() => dispatch({ type: "navigate", view: "home" })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </PhoneShell>

      {/* Footer */}
      <Footer />
    </main>
  );
}

function HomeView({
  persona,
  onOpenApp,
}: {
  persona: ReturnType<typeof personaById>;
  onOpenApp: (view: AppId) => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      {/* Greeting */}
      <div className="text-center">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {persona.label} · ACL view
        </span>
        <h2
          className="mt-1 text-2xl font-bold leading-tight text-ink sm:text-[28px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {persona.tagline}
        </h2>
      </div>

      {/* App grid 2x2 */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        <AppTile
          icon="🌿"
          label="Registry"
          subtitle="BorrowerRegistry"
          color="mint"
          badge={`${BORROWERS.length} institutions`}
          onClick={() => onOpenApp("registry")}
        />
        <AppTile
          icon="🌱"
          label="Score"
          subtitle="CreditScoreEngine"
          color="yellow"
          badge="atomic state"
          onClick={() => onOpenApp("score")}
        />
        <AppTile
          icon="🪺"
          label="Pool"
          subtitle="PrivateCreditPool"
          color="sky"
          badge={`${POOL_STATS.tvlEth.toFixed(1)} ETH TVL`}
          onClick={() => onOpenApp("pool")}
        />
        <AppTile
          icon="🗳️"
          label="Conclave"
          subtitle="ListingConclave"
          color="sage"
          badge={`${PROPOSALS.filter((p) => p.status === "voting").length} sealing`}
          onClick={() => onOpenApp("conclave")}
        />
      </div>

      {/* KPI rail */}
      <div className="grid grid-cols-3 gap-2.5 rounded-card border-2 border-dashed border-border-soft bg-card/60 px-4 py-3">
        <Mini label="51" caption="Tests" />
        <Mini label="0" caption="Lint errors" />
        <Mini label="4" caption="Contracts on Sepolia" />
      </div>
    </div>
  );
}

function Mini({ label, caption }: { label: string; caption: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className="font-mono tabular-nums text-xl font-bold text-ink"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {label}
      </span>
      <span
        className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {caption}
      </span>
    </div>
  );
}

function ScoreAppWrapper({
  persona,
  authMap,
  onBack,
  onSetAuth,
}: {
  persona: PersonaId;
  authMap: Record<number, boolean>;
  onBack: () => void;
  onSetAuth: (id: number, auth: boolean) => void;
}) {
  // Patch BORROWERS in-place so ScoreApp reads the current auth state
  // (cleaner: pass borrowers in. Quick demo: monkey-patch the field.)
  BORROWERS.forEach((b) => {
    b.regulatorAuthorized = authMap[b.id] ?? b.regulatorAuthorized;
  });
  return (
    <ScoreApp
      persona={persona}
      onBack={onBack}
      setRegulatorAuthorizedFor={onSetAuth}
    />
  );
}

function Footer() {
  return (
    <footer className="mt-4 flex w-full max-w-[860px] flex-col items-center gap-3">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-wide text-ink-muted">
        {Object.entries(SEPOLIA_ADDRESSES).map(([key, addr]) => (
          <a
            key={key}
            href={`${ETHERSCAN_BASE}/address/${addr}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-mint-active"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {key}: {addr.slice(0, 6)}…{addr.slice(-4)}
          </a>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-soft">
        <a
          href="https://github.com/0xE1337/conclave"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-mint-active"
        >
          GitHub
        </a>
        <span>·</span>
        <span>fhEVM 0.11.1 · MIT</span>
      </div>
    </footer>
  );
}
