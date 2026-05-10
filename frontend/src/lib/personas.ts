/**
 * Persona = an ACL viewpoint on the same encrypted state.
 * The UI persona switcher is a visual analog of fhEVM's
 * `FHE.allow(handle, address)` — switching changes who you are
 * in the system, which changes what you can decrypt.
 */
export type PersonaId = "borrower" | "lp" | "underwriter" | "regulator";

export interface Persona {
  id: PersonaId;
  label: string;
  emoji: string;
  /** CSS color token */
  tint: string;
  /** Persona-specific tagline shown on the phone home */
  tagline: string;
  /** What this persona can decrypt (UI heuristic — mirrors on-chain ACL) */
  canDecrypt: {
    ownScore: boolean;
    poolAggregates: boolean;
    conclaveTally: boolean;
    /** True only after a borrower has called grantRegulatorAccess */
    selectedScores: boolean;
  };
}

export const PERSONAS: Persona[] = [
  {
    id: "borrower",
    label: "Borrower",
    emoji: "🌿",
    tint: "var(--color-borrower)",
    tagline: "Welcome back. Your credit is yours.",
    canDecrypt: {
      ownScore: true,
      poolAggregates: true,
      conclaveTally: true,
      selectedScores: false,
    },
  },
  {
    id: "lp",
    label: "LP",
    emoji: "🪙",
    tint: "var(--color-lp)",
    tagline: "Fund the pool. See the aggregates.",
    canDecrypt: {
      ownScore: false,
      poolAggregates: true,
      conclaveTally: true,
      selectedScores: false,
    },
  },
  {
    id: "underwriter",
    label: "Underwriter",
    emoji: "🌳",
    tint: "var(--color-underwriter)",
    tagline: "Vote sealed. No one — not even you — can prove how.",
    canDecrypt: {
      ownScore: false,
      poolAggregates: true,
      conclaveTally: true,
      selectedScores: false,
    },
  },
  {
    id: "regulator",
    label: "Regulator",
    emoji: "🍯",
    tint: "var(--color-regulator)",
    tagline: "Audit only what borrowers explicitly grant.",
    canDecrypt: {
      ownScore: false,
      poolAggregates: true,
      conclaveTally: true,
      selectedScores: true,
    },
  },
];

export const personaById = (id: PersonaId): Persona =>
  PERSONAS.find((p) => p.id === id)!;
