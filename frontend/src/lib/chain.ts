/**
 * On-chain integration layer for Conclave Live mode.
 *
 * Talks to the 4 deployed Sepolia contracts via ethers v6. Uses minimal ABI
 * subsets — only the read functions plus the one permissionless write
 * (`computeScore`) we expose to visitors. Anything that requires governor
 * privileges or FHE-encrypted inputs (register, recordRepayment, sealVote)
 * stays out of this file — those flows are surfaced in the UI as honest
 * Etherscan links instead of fake interactive buttons.
 */

import { ethers, type BrowserProvider, type JsonRpcSigner } from "ethers";
import { SEPOLIA_ADDRESSES, ETHERSCAN_BASE } from "./demo-data";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = "0xaa36a7";

/** Public RPC — no API key, fine for low-volume read calls. */
export const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export const ADDRS = SEPOLIA_ADDRESSES;
export const ETHERSCAN = ETHERSCAN_BASE;

export const ETHERSCAN_ADDR = (a: string) => `${ETHERSCAN_BASE}/address/${a}`;
export const ETHERSCAN_TX = (h: string) => `${ETHERSCAN_BASE}/tx/${h}`;

/** Minimal ABI subsets — only what Live mode actually calls. */
export const REGISTRY_ABI = [
  "function count() view returns (uint256)",
  "function nextBorrowerId() view returns (uint256)",
  "function walletOf(uint256) view returns (address)",
  "function isActive(uint256) view returns (bool)",
] as const;

export const CREDIT_ABI = [
  "function governor() view returns (address)",
  "function pool() view returns (address)",
  "function regulator() view returns (address)",
  "function w1() view returns (uint32)",
  "function w2() view returns (uint32)",
  "function w3() view returns (uint32)",
  "function w4() view returns (uint32)",
  "function isInitialized(uint256) view returns (bool)",
  "function getScore(uint256) view returns (bytes32)",
  // Permissionless write — anyone pays gas, anyone can trigger.
  // Useful as a "click to submit a real Sepolia tx" demo.
  "function computeScore(uint256)",
  "function grantRegulatorAccess(uint256)",
  "event ScoreComputed(uint256 indexed borrowerId)",
  "event RegulatorAccessGranted(uint256 indexed borrowerId, address indexed regulator)",
] as const;

export const POOL_ABI = [
  "function governor() view returns (address)",
] as const;

export const CONCLAVE_ABI = [
  "function governor() view returns (address)",
] as const;

/** Lazy-init read-only provider (single instance, browser-safe). */
let _readProvider: ethers.JsonRpcProvider | null = null;
export function readProvider(): ethers.JsonRpcProvider {
  if (!_readProvider) {
    _readProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC, SEPOLIA_CHAIN_ID, {
      staticNetwork: true,
    });
  }
  return _readProvider;
}

export interface OnchainSnapshot {
  registry: {
    count: number;
    nextId: number;
  };
  credit: {
    governor: string;
    pool: string;
    regulator: string;
    weights: { w1: number; w2: number; w3: number; w4: number };
  };
  blockNumber: number;
  fetchedAt: number;
}

/**
 * Fetch a snapshot of contract state for Live mode chrome.
 * Parallel calls, ~1 RPC round-trip per contract.
 */
export async function fetchOnchainSnapshot(): Promise<OnchainSnapshot> {
  const provider = readProvider();
  const registry = new ethers.Contract(ADDRS.registry, REGISTRY_ABI, provider);
  const credit = new ethers.Contract(ADDRS.credit, CREDIT_ABI, provider);

  const [
    count,
    nextId,
    governor,
    pool,
    regulator,
    w1,
    w2,
    w3,
    w4,
    blockNumber,
  ] = await Promise.all([
    registry.count() as Promise<bigint>,
    registry.nextBorrowerId() as Promise<bigint>,
    credit.governor() as Promise<string>,
    credit.pool() as Promise<string>,
    credit.regulator() as Promise<string>,
    credit.w1() as Promise<bigint>,
    credit.w2() as Promise<bigint>,
    credit.w3() as Promise<bigint>,
    credit.w4() as Promise<bigint>,
    provider.getBlockNumber(),
  ]);

  return {
    registry: { count: Number(count), nextId: Number(nextId) },
    credit: {
      governor,
      pool,
      regulator,
      weights: { w1: Number(w1), w2: Number(w2), w3: Number(w3), w4: Number(w4) },
    },
    blockNumber,
    fetchedAt: Date.now(),
  };
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  status: "disconnected" | "connecting" | "connected" | "wrong-network";
}

export const INITIAL_WALLET: WalletState = {
  address: null,
  chainId: null,
  status: "disconnected",
};

/** Returns true if window.ethereum (any injected wallet) is available. */
export function hasInjectedWallet(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean((window as unknown as { ethereum?: unknown }).ethereum);
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

export function getInjected(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { ethereum?: EthereumProvider }).ethereum) ?? null;
}

/** Request accounts from MetaMask. Throws if no wallet or user rejects. */
export async function connectWallet(): Promise<{ address: string; chainId: number }> {
  const injected = getInjected();
  if (!injected) throw new Error("No injected wallet found. Install MetaMask.");
  const accounts = (await injected.request({
    method: "eth_requestAccounts",
  })) as string[];
  const chainHex = (await injected.request({ method: "eth_chainId" })) as string;
  return { address: accounts[0], chainId: parseInt(chainHex, 16) };
}

/** Switch the injected wallet to Sepolia. Adds the chain if missing. */
export async function switchToSepolia(): Promise<void> {
  const injected = getInjected();
  if (!injected) throw new Error("No injected wallet");
  try {
    await injected.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err: unknown) {
    // 4902 = chain not added to wallet. Add it then retry.
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await injected.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID_HEX,
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "SEP", decimals: 18 },
            rpcUrls: [SEPOLIA_RPC],
            blockExplorerUrls: [ETHERSCAN_BASE],
          },
        ],
      });
      await injected.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
      });
    } else {
      throw err;
    }
  }
}

/** Build an ethers BrowserProvider + Signer for the connected wallet. */
export async function getSigner(): Promise<{
  provider: BrowserProvider;
  signer: JsonRpcSigner;
}> {
  const injected = getInjected();
  if (!injected) throw new Error("No injected wallet");
  const provider = new ethers.BrowserProvider(
    injected as unknown as ethers.Eip1193Provider,
  );
  const signer = await provider.getSigner();
  return { provider, signer };
}

/**
 * Submit a `computeScore(id)` tx on Sepolia. This is the one permissionless
 * write we expose to Live-mode visitors — anyone can pay gas to invoke it,
 * and it triggers real FHE arithmetic on-chain (FHE.add/mul/sub/select),
 * real cross-contract ACL grants (FHE.allow to pool + borrower wallet),
 * and emits a real ScoreComputed event. Visible proof that the encrypted
 * stack works end-to-end on a public L1.
 */
export async function submitComputeScore(
  id: number,
): Promise<{ txHash: string; blockNumber: number }> {
  const { signer } = await getSigner();
  const credit = new ethers.Contract(ADDRS.credit, CREDIT_ABI, signer);
  const tx = await credit.computeScore(id);
  const receipt = await tx.wait();
  return { txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

/** Truncate an address for display: 0x1234…abcd */
export function shortAddr(a: string | null | undefined, head = 6, tail = 4): string {
  if (!a) return "—";
  if (a.length < head + tail + 2) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}
