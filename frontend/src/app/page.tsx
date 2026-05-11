"use client";

import { useReducer } from "react";
import { motion } from "framer-motion";
import { PhoneShell } from "@/components/PhoneShell";
import { PersonaSwitcher } from "@/components/PersonaSwitcher";
import { AppTile } from "@/components/AppTile";
import { PublicVsConclave } from "@/components/PublicVsConclave";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ModeToggle } from "@/components/ModeToggle";
import { WalletPill } from "@/components/WalletPill";
import { LiveSnapshot } from "@/components/LiveSnapshot";
import { RegistryApp } from "@/apps/RegistryApp";
import { ScoreApp } from "@/apps/ScoreApp";
import { PoolApp } from "@/apps/PoolApp";
import { ConclaveApp } from "@/apps/ConclaveApp";
import { personaById, type PersonaId } from "@/lib/personas";
import {
  BORROWERS,
  POOL_STATS,
  PROPOSALS,
  SEPOLIA_ADDRESSES,
  ETHERSCAN_BASE,
} from "@/lib/demo-data";
import { useT } from "@/lib/i18n";
import { useMode } from "@/lib/mode";

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
      return { ...s, persona: a.persona };
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
  const t = useT();
  const { mode } = useMode();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-start gap-6 px-4 py-10 sm:px-8 sm:py-14">
      {/* Top chrome — Mode + Wallet + Language, all fixed so they're always
          reachable regardless of scroll position. Grouped right-aligned. */}
      <div className="fixed right-4 top-4 z-50 flex flex-wrap items-center justify-end gap-2 sm:right-6 sm:top-6">
        {mode === "live" && <WalletPill />}
        <ModeToggle />
        <LanguageToggle />
      </div>

      {/* Brand header */}
      <header className="flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍃</span>
          <h1
            className="text-3xl font-bold tracking-tight text-ink"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            {t.brand.title}
          </h1>
        </div>
        <p
          className="max-w-md text-sm leading-relaxed text-ink-soft"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {t.brand.tagline}
        </p>
      </header>

      {/* Persona switcher */}
      <PersonaSwitcher
        active={state.persona}
        onChange={(p) => dispatch({ type: "set-persona", persona: p })}
      />

      {/* Phone. `key` on the wrapping motion.div drives the mount-on-change
          enter animation; we deliberately do NOT use AnimatePresence here —
          its mode="wait" behaviour was buggy under React 19 + framer-motion,
          which broke navigation. Conditional render + keyed re-mount gives us
          a clean enter animation per view-change with zero risk. */}
      <PhoneShell persona={persona}>
        <motion.div
          key={state.view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {state.view === "home" && (
            <HomeView
              persona={persona}
              onOpenApp={(view) => dispatch({ type: "navigate", view })}
            />
          )}
          {state.view === "registry" && (
            <RegistryApp
              persona={state.persona}
              onBack={() => dispatch({ type: "navigate", view: "home" })}
            />
          )}
          {state.view === "score" && (
            <ScoreAppWrapper
              persona={state.persona}
              authMap={state.regulatorAuthorized}
              onBack={() => dispatch({ type: "navigate", view: "home" })}
              onSetAuth={(id, auth) =>
                dispatch({ type: "set-regulator-auth", id, auth })
              }
            />
          )}
          {state.view === "pool" && (
            <PoolApp
              onBack={() => dispatch({ type: "navigate", view: "home" })}
            />
          )}
          {state.view === "conclave" && (
            <ConclaveApp
              persona={state.persona}
              onBack={() => dispatch({ type: "navigate", view: "home" })}
            />
          )}
        </motion.div>
      </PhoneShell>

      {/* The contrast — only on home view, hide when an app is open to keep
          the in-app experience focused. */}
      {state.view === "home" && mode === "demo" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full flex justify-center"
        >
          <PublicVsConclave />
        </motion.div>
      )}

      {/* Live mode snapshot — same slot as contrast, mutually exclusive */}
      {state.view === "home" && mode === "live" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full flex justify-center"
        >
          <LiveSnapshot />
        </motion.div>
      )}

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
  const t = useT();
  const personaLabel = t.persona[persona.id].label;
  const personaTagline = t.persona[persona.id].tagline;

  return (
    <div className="flex flex-col gap-7">
      {/* Greeting */}
      <div className="text-center">
        <span
          className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {personaLabel} · {t.home.aclView}
        </span>
        <h2
          className="mt-1 text-2xl font-bold leading-tight text-ink sm:text-[28px]"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
        >
          {personaTagline}
        </h2>
      </div>

      {/* App grid 2x2 — stagger-fade entrance */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5">
        <AppTile
          index={0}
          icon="🌿"
          label={t.home.tiles.registry.label}
          subtitle={t.home.tiles.registry.subtitle}
          color="mint"
          badge={t.home.badge.institutions(BORROWERS.length)}
          onClick={() => onOpenApp("registry")}
        />
        <AppTile
          index={1}
          icon="🌱"
          label={t.home.tiles.score.label}
          subtitle={t.home.tiles.score.subtitle}
          color="yellow"
          badge={t.home.badge.atomicState}
          onClick={() => onOpenApp("score")}
        />
        <AppTile
          index={2}
          icon="🪺"
          label={t.home.tiles.pool.label}
          subtitle={t.home.tiles.pool.subtitle}
          color="sky"
          badge={t.home.badge.tvl(POOL_STATS.tvlEth)}
          onClick={() => onOpenApp("pool")}
        />
        <AppTile
          index={3}
          icon="🗳️"
          label={t.home.tiles.conclave.label}
          subtitle={t.home.tiles.conclave.subtitle}
          color="sage"
          badge={t.home.badge.sealing(
            PROPOSALS.filter((p) => p.status === "voting").length,
          )}
          onClick={() => onOpenApp("conclave")}
        />
      </div>

      {/* KPI rail */}
      <div className="grid grid-cols-3 gap-2.5 rounded-card border-2 border-dashed border-border-soft bg-card/60 px-4 py-3">
        <Mini label="62" caption={t.home.kpi.tests} />
        <Mini label="0" caption={t.home.kpi.lintErrors} />
        <Mini label="4" caption={t.home.kpi.contracts} />
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
  const t = useT();
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
        <span>{t.footer.stack}</span>
      </div>
    </footer>
  );
}
