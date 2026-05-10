import { ethers } from "ethers";
import BorrowerRegistryArtifact from "./BorrowerRegistry.abi.json";
import CreditScoreEngineArtifact from "./CreditScoreEngine.abi.json";
import PrivateCreditPoolArtifact from "./PrivateCreditPool.abi.json";
import ListingConclaveArtifact from "./ListingConclave.abi.json";

// Sepolia testnet — deployed 2026-05-10 (lint-clean v2)
// CRITICAL: CreditScoreEngine.setPool(PrivateCreditPool) wired post-deploy
// (tx 0x452a30c8c3ebb287241b12a4730e23ab3216c106daff1228171e10b8bd7df2a1)
// so cross-contract FHE.ge / FHE.select calls actually materialize on coprocessor.
// Anti-patterns #15 (trivial encryption) and #16 (event leak) verified clean
// via fhevm-lint scan.
export const ADDRESSES = {
  registry: "0x23D2566b41964AD73c649f607d35f745e6EB065A",
  credit: "0xd0AAFbd8C223f689E18Fba4F867500cE9A4DE8f1",
  pool: "0xe93C152887Cf45F01655641ff590F6c9CCf7e47C",
  conclave: "0x555B150429A8C7Ec8C5d19c894d956645C0878e1",
};

export const ABIS = {
  registry: BorrowerRegistryArtifact.abi,
  credit: CreditScoreEngineArtifact.abi,
  pool: PrivateCreditPoolArtifact.abi,
  conclave: ListingConclaveArtifact.abi,
};

export function getProvider() {
  const rpc = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
  return new ethers.JsonRpcProvider(rpc);
}

export function getContracts(provider: ethers.Provider) {
  return {
    registry: new ethers.Contract(ADDRESSES.registry, ABIS.registry, provider),
    credit: new ethers.Contract(ADDRESSES.credit, ABIS.credit, provider),
    pool: new ethers.Contract(ADDRESSES.pool, ABIS.pool, provider),
    conclave: new ethers.Contract(ADDRESSES.conclave, ABIS.conclave, provider),
  };
}

export const ETHERSCAN = {
  registry: `https://sepolia.etherscan.io/address/${ADDRESSES.registry}`,
  credit: `https://sepolia.etherscan.io/address/${ADDRESSES.credit}`,
  pool: `https://sepolia.etherscan.io/address/${ADDRESSES.pool}`,
  conclave: `https://sepolia.etherscan.io/address/${ADDRESSES.conclave}`,
  setPoolTx: "https://sepolia.etherscan.io/tx/0x452a30c8c3ebb287241b12a4730e23ab3216c106daff1228171e10b8bd7df2a1",
};
