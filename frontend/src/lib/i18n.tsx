"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "zh" | "en";

const STORAGE_KEY = "conclave-locale";

const STRINGS = {
  zh: {
    brand: {
      title: "Conclave",
      tagline: "私密信贷 · 在加密会议中达成共识。",
    },
    toggle: {
      labelEn: "EN",
      labelZh: "中",
      aria: "切换语言",
    },
    persona: {
      borrower: { label: "借款人", tagline: "欢迎回来。你的信用属于你自己。" },
      lp: { label: "LP", tagline: "为池子注资 · 看聚合数据就够。" },
      underwriter: {
        label: "承销委员",
        tagline: "投票已封印 — 包括你自己 — 都无法证明怎么投的。",
      },
      regulator: { label: "监管者", tagline: "只审计借款人主动授权的那部分。" },
    },
    home: {
      aclView: "ACL 视角",
      tiles: {
        registry: { label: "Registry", subtitle: "BorrowerRegistry" },
        score: { label: "Score", subtitle: "CreditScoreEngine" },
        pool: { label: "Pool", subtitle: "PrivateCreditPool" },
        conclave: { label: "Conclave", subtitle: "ListingConclave" },
      },
      badge: {
        institutions: (n: number) => `${n} 家机构`,
        atomicState: "原子加密状态",
        tvl: (n: number) => `${n.toFixed(1)} ETH TVL`,
        sealing: (n: number) => `${n} 个待定`,
      },
      kpi: { tests: "测试", lintErrors: "Lint 错误", contracts: "Sepolia 合约" },
    },
    phone: { live: "Sepolia · 实时", am: "AM" },
    app: { back: "← 返回" },
    registry: {
      title: "借款人名册",
      subtitle: "机构 KYC · 默认加密",
      statBorrowers: "借款人",
      statActive: "活跃",
      statBond: "总抵押",
      colNum: "#",
      colBorrower: "借款人",
      colKyc: "KYC 等级",
      colActivity: "活动",
      colStatus: "状态",
      statusActive: "活跃",
      statusPaused: "已暂停",
      statusRevoked: "已撤销",
      footerPart1: "受 ERC-3643 启发的钩子：",
      footerCode: "meetsKycTier(id, minTier)",
      footerPart2: " 返回一个 ",
      footerEbool: "ebool",
      footerPart3: " — 下游合约可基于它组合，且无需看到原始等级。",
    },
    kycTier: {
      unknown: "—",
      retail: "散户",
      accredited: "合格投资者",
      qualifiedPurchaser: "合格购买者",
      institutional: "机构",
    },
    score: {
      title: "信用分引擎",
      subtitle: "信用分是可变加密状态 · 还款/违约时原子更新",
      cinematicNote: "运行 cinematic 演示：解析 tier → 授权监管者 → 观看密文流动。",
      runButton: "▶ 一键演示",
      runningButton: "运行中…",
      subjectPicker: "选择借款人：",
      borrowerNoPrefix: "借款人 #",
      creditScore: "信用分",
      formulaRepay: "还款",
      formulaDefault: "违约",
      formulaCollateral: "抵押",
      formulaVolume: "成交量",
      formulaNote: "score = w₁·repay − w₂·default + w₃·collateral + w₄·volume，全在 euint32 上",
      resolveTier: "在密文上解析 tier",
      resolveNotePart1: "级联 ",
      resolveNoteCode: "FHE.select",
      resolveNotePart2: " → 只有 tier 离开加密域",
      tierBandTitle: "抵押率 tier（级联 FHE.select）",
      revealTitle: "选择性监管者披露",
      revealSubtitle: "借款人主动授权某一个监管者地址解密。其他人仍只看到密文。",
      authButton: "授权监管者 →",
      authorizedButton: "✓ 已授权监管者",
      soliditySolidity: "solidity:",
    },
    decryption: {
      paneCipher: "公链 · LP · MEV",
      paneBorrower: "你 · 借款人",
      paneRegulator: "监管者",
      sealed: "🍃 已封印",
      fullAccess: "完全权限",
      authorized: "已授权",
      noAccess: "无权限",
    },
    pool: {
      title: "私有信贷池",
      subtitle: "LP 注资 · tier 限准入 · 还款/违约时更新信用分",
      kpiTvl: "TVL",
      kpiActive: "活跃贷款",
      kpiRepayments: "还款次数",
      kpiDefault: "违约率",
      tierDistribution: "抵押率 tier 分布",
      borrowersSuffix: "个借款人",
      colNum: "#",
      colBorrower: "借款人",
      colBorrowed: "借出额",
      colTier: "Tier",
      colDays: "天",
      noActiveLoans: "暂无活跃贷款 · 池子已全部赎回",
    },
    tierBand: {
      tier1: "顶级",
      tier2: "良好",
      tier3: "标准",
      tier4: "高风险",
    },
    conclave: {
      title: "上市委员会",
      subtitle: "反贿赂加密承销 · 同态计票",
      seatedTitle: "你在 Conclave 中有席位",
      seatedSubtitle: "对开放提案投票 · 你的票会被永久封印",
      observerNote: "切到 🌳 承销委员 才能投票。其他身份可观察封印计票但不能投票。",
      assetPrefix: "资产 #",
      castVote: "投我的票 →",
      castApprove: "✓ 赞成（封印）",
      castReject: "✗ 反对（封印）",
      cancel: "取消",
      voted: "✓ 你的票已封印",
      whyTitle: "为什么这是反贿赂的",
      why1Part1: "",
      why1Code: "sealVote(assetId, encVote, proof)",
      why1Part2: " 通过同态加法消耗了投票者的随机数 — 投票后无法证明自己怎么投的",
      why2Part1: "",
      why2Code: "finalize(assetId)",
      why2Part2: " 只揭示聚合 · 永不揭示每个投票者的明细",
      why3: "比 commit-reveal 投票更强（commit-reveal 在 reveal 阶段会泄露）· 无需可信协调者（不像 MACI）",
      statusVoting: "封印投票中",
      statusFinalized: "已结算",
      statusAdmitted: "已通过 ✓",
      statusRejected: "已拒绝 ✗",
    },
    voteUrn: {
      sealed: "已封印",
      voteWord: "票",
      castSuffix: "已投",
      tallyNote: "计票以密文形式累加。投票者事后无法向贿赂者证明怎么投的。",
      tallyRevealed: "计票已揭示",
      voterCount: (n: number) => `${n} 个投票人`,
      approve: "赞成",
      reject: "反对",
    },
    contrast: {
      heading: "对比",
      subhead: "同一借款人 · 同一区块高度",
      publicHeader: "🌐 公链 · 任何人都能看到",
      conclaveHeader: "🍃 Conclave · 链上存储的内容",
      colAddress: "地址",
      colKyc: "KYC 等级",
      colScore: "信用分",
      colBalance: "余额",
      colLoan: "活跃贷款",
      colRepayments: "还款记录",
      valueKycPublic: "合格购买者",
      valueRepaymentsPublic: "8 ↑   违约 0 ↓",
      valueSealedBalance: "🍃 已封印在池子聚合中",
      valueRepaymentsCipher: "原子密文变更",
      publicWarn: "⚠ 一切可索引、可前跑、可抓取",
      conclaveOk: "✓ 公开偿付证明 · 监管者只在选择性授权下可见",
      bottomPre: "今天，BlackRock 价值 $2.75B 的 BUIDL 基金把所有持有人、余额、资金流向都泄露了。摩根大通 Kinexys 保持了私密 — 但在封闭网络上。Conclave 运行在 ",
      bottomStrong: "公开 L1",
      bottomPost: " 上，加密，每个借款人都有独立的监管者查看密钥。",
    },
    footer: {
      stack: "fhEVM 0.11.1 · MIT",
    },
  },
  en: {
    brand: {
      title: "Conclave",
      tagline: "Confidential private credit, decided in cryptographic conclave.",
    },
    toggle: {
      labelEn: "EN",
      labelZh: "中",
      aria: "Switch language",
    },
    persona: {
      borrower: { label: "Borrower", tagline: "Welcome back. Your credit is yours." },
      lp: { label: "LP", tagline: "Fund the pool. See the aggregates." },
      underwriter: {
        label: "Underwriter",
        tagline: "Vote sealed. No one — not even you — can prove how.",
      },
      regulator: {
        label: "Regulator",
        tagline: "Audit only what borrowers explicitly grant.",
      },
    },
    home: {
      aclView: "ACL view",
      tiles: {
        registry: { label: "Registry", subtitle: "BorrowerRegistry" },
        score: { label: "Score", subtitle: "CreditScoreEngine" },
        pool: { label: "Pool", subtitle: "PrivateCreditPool" },
        conclave: { label: "Conclave", subtitle: "ListingConclave" },
      },
      badge: {
        institutions: (n: number) => `${n} institutions`,
        atomicState: "atomic state",
        tvl: (n: number) => `${n.toFixed(1)} ETH TVL`,
        sealing: (n: number) => `${n} sealing`,
      },
      kpi: { tests: "Tests", lintErrors: "Lint errors", contracts: "Contracts on Sepolia" },
    },
    phone: { live: "Sepolia · live", am: "AM" },
    app: { back: "← Home" },
    registry: {
      title: "Borrower Registry",
      subtitle: "Institutional KYC — encrypted by default",
      statBorrowers: "Borrowers",
      statActive: "Active",
      statBond: "Total bond",
      colNum: "#",
      colBorrower: "Borrower",
      colKyc: "KYC tier",
      colActivity: "Activity",
      colStatus: "Status",
      statusActive: "active",
      statusPaused: "paused",
      statusRevoked: "revoked",
      footerPart1: "ERC-3643-inspired hook: ",
      footerCode: "meetsKycTier(id, minTier)",
      footerPart2: " returns an ",
      footerEbool: "ebool",
      footerPart3:
        " a downstream contract composes against without seeing the raw tier.",
    },
    kycTier: {
      unknown: "—",
      retail: "Retail",
      accredited: "Accredited",
      qualifiedPurchaser: "Qualified Purchaser",
      institutional: "Institutional",
    },
    score: {
      title: "Credit Score Engine",
      subtitle: "Score is mutable encrypted state · atomic update on repay/default",
      cinematicNote:
        "Run the cinematic sequence: resolve tier → authorize regulator → watch the mint trail.",
      runButton: "▶ See it run",
      runningButton: "Running…",
      subjectPicker: "Subject:",
      borrowerNoPrefix: "Borrower #",
      creditScore: "Credit Score",
      formulaRepay: "Repay",
      formulaDefault: "Default",
      formulaCollateral: "Collateral",
      formulaVolume: "Volume",
      formulaNote:
        "score = w₁·repay − w₂·default + w₃·collateral + w₄·volume, all on euint32",
      resolveTier: "Resolve tier on ciphertext",
      resolveNotePart1: "cascading ",
      resolveNoteCode: "FHE.select",
      resolveNotePart2: " → only the band leaves the encrypted domain",
      tierBandTitle: "Collateral tier (cascading FHE.select)",
      revealTitle: "Selective regulator disclosure",
      revealSubtitle:
        "The borrower opts in to grant exactly one regulator address decrypt access. Everyone else still sees ciphertext.",
      authButton: "Authorize regulator →",
      authorizedButton: "✓ Regulator authorized",
      soliditySolidity: "solidity:",
    },
    decryption: {
      paneCipher: "Public · LP · MEV",
      paneBorrower: "You · Borrower",
      paneRegulator: "Regulator",
      sealed: "🍃 sealed",
      fullAccess: "full access",
      authorized: "authorized",
      noAccess: "no access",
    },
    pool: {
      title: "Private Credit Pool",
      subtitle: "LP-funded · tier-gated · score-as-state on repay/default",
      kpiTvl: "TVL",
      kpiActive: "Active loans",
      kpiRepayments: "Repayments",
      kpiDefault: "Default rate",
      tierDistribution: "Collateral tier distribution",
      borrowersSuffix: "borrowers",
      colNum: "#",
      colBorrower: "Borrower",
      colBorrowed: "Borrowed",
      colTier: "Tier",
      colDays: "Days",
      noActiveLoans: "No active loans · pool fully redeemed",
    },
    tierBand: {
      tier1: "Elite",
      tier2: "Good",
      tier3: "Standard",
      tier4: "High Risk",
    },
    conclave: {
      title: "Listing Conclave",
      subtitle: "Anti-bribery encrypted underwriting · homomorphic tally",
      seatedTitle: "You are seated at the conclave",
      seatedSubtitle: "Cast votes on open proposals · your vote is sealed forever",
      observerNote:
        "Switch to 🌳 Underwriter to cast votes. Other personas can observe sealed tallies but not vote.",
      assetPrefix: "Asset #",
      castVote: "Cast my vote →",
      castApprove: "✓ Approve (sealed)",
      castReject: "✗ Reject (sealed)",
      cancel: "Cancel",
      voted: "✓ Your vote is sealed",
      whyTitle: "Why this is bribery-resistant",
      why1Part1: "",
      why1Code: "sealVote(assetId, encVote, proof)",
      why1Part2:
        " consumes the voter's randomness via homomorphic addition — voters cannot prove their vote afterwards",
      why2Part1: "",
      why2Code: "finalize(assetId)",
      why2Part2: " reveals only aggregates · never per-voter breakdowns",
      why3:
        "Stronger than commit-reveal voting (which leaks at the reveal step) · no trusted coordinator (unlike MACI)",
      statusVoting: "sealing votes",
      statusFinalized: "finalized",
      statusAdmitted: "admitted ✓",
      statusRejected: "rejected ✗",
    },
    voteUrn: {
      sealed: "Sealed",
      voteWord: "votes",
      castSuffix: "cast",
      tallyNote:
        "Tally accumulates as ciphertext. Voters cannot prove how they voted to a briber afterwards.",
      tallyRevealed: "Tally revealed",
      voterCount: (n: number) => `${n} voters`,
      approve: "Approve",
      reject: "Reject",
    },
    contrast: {
      heading: "The contrast",
      subhead: "Same borrower · same block height",
      publicHeader: "🌐 Public chain · what anyone sees",
      conclaveHeader: "🍃 Conclave · what the chain stores",
      colAddress: "address",
      colKyc: "kyc tier",
      colScore: "credit score",
      colBalance: "balance",
      colLoan: "active loan",
      colRepayments: "repayments",
      valueKycPublic: "Qualified Purchaser",
      valueRepaymentsPublic: "8 ↑   defaults 0 ↓",
      valueSealedBalance: "🍃 sealed in pool aggregates",
      valueRepaymentsCipher: "atomic ciphertext mutation",
      publicWarn: "⚠ everything indexable, frontrunnable, scrapable",
      conclaveOk: "✓ public solvency proofs · regulator on opt-in only",
      bottomPre:
        "Today, BlackRock's $2.75B BUIDL fund leaks every holder, balance, and flow. JPMorgan Kinexys keeps it private — but on a closed network. Conclave runs on a ",
      bottomStrong: "public L1",
      bottomPost: ", encrypted, with a per-borrower regulator viewing key.",
    },
    footer: { stack: "fhEVM 0.11.1 · MIT" },
  },
} as const;

export type Dict = (typeof STRINGS)["zh"];

interface I18nContextValue {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Default to Chinese — primary audience speaks Chinese; toggle to EN.
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") setLocaleState(saved);
    } catch {
      // ignore unavailable localStorage
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  };

  const value: I18nContextValue = {
    locale,
    t: STRINGS[locale] as Dict,
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function useT(): Dict {
  return useI18n().t;
}
