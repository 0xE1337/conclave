import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Conclave — Confidential Private Credit Pool for Tokenized RWA
 *
 * Deployment order:
 *   1. BorrowerRegistry       (no dependencies)
 *   2. ListingConclave        (no dependencies)
 *   3. CreditScoreEngine      (registry)
 *   4. PrivateCreditPool      (registry, credit)
 *
 * Post-deployment wiring (CRITICAL):
 *   - credit.setPool(pool.address)  ← bridges the encrypted score handle ACL
 *                                     to the pool so cross-contract FHE.ge /
 *                                     FHE.select calls actually materialize on
 *                                     real Sepolia (anti-pattern #17 fix).
 *   - (optional) credit.setRegulator(addr) for selective disclosure flow.
 *
 * On success, writes a deployments/<network>.json manifest containing all four
 * addresses + the ACL bridge tx hash for downstream consumers (frontend,
 * verification, indexers).
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute, read } = hre.deployments;
  const network = hre.network.name;

  console.log(`\n┌─ Conclave deploy → ${network} ──────────────────────────`);
  console.log(`│  deployer: ${deployer}`);

  const registry = await deploy("BorrowerRegistry", { from: deployer, log: true });
  console.log(`│  BorrowerRegistry    ${registry.address}`);

  const conclave = await deploy("ListingConclave", { from: deployer, log: true });
  console.log(`│  ListingConclave     ${conclave.address}`);

  const credit = await deploy("CreditScoreEngine", {
    from: deployer,
    args: [registry.address],
    log: true,
  });
  console.log(`│  CreditScoreEngine   ${credit.address}`);

  const pool = await deploy("PrivateCreditPool", {
    from: deployer,
    args: [registry.address, credit.address],
    log: true,
  });
  console.log(`│  PrivateCreditPool   ${pool.address}`);

  // ── CRITICAL ACL bridge ──────────────────────────────────────────────
  // Without this, the score handle is never granted to the pool and the
  // Sepolia coprocessor silently produces undefined ciphertext on
  // resolveCollateralPct (anti-pattern #17 — mock vs Sepolia parity bug).
  const setPoolTx = await execute(
    "CreditScoreEngine",
    { from: deployer, log: true },
    "setPool",
    pool.address,
  );

  // Verify the bridge actually persisted on-chain
  const wiredPool = await read("CreditScoreEngine", "pool");
  if (wiredPool.toLowerCase() !== pool.address.toLowerCase()) {
    throw new Error(
      `ACL bridge verification FAILED: credit.pool() = ${wiredPool}, expected ${pool.address}`,
    );
  }
  console.log(`│  ✓ ACL bridge: credit.setPool(${pool.address})`);
  console.log(`│  ✓ verified on-chain: credit.pool() = ${wiredPool}`);

  // ── Manifest ─────────────────────────────────────────────────────────
  const manifest = {
    network,
    chainId: hre.network.config.chainId,
    deployedAt: new Date().toISOString(),
    deployer,
    contracts: {
      BorrowerRegistry: registry.address,
      ListingConclave: conclave.address,
      CreditScoreEngine: credit.address,
      PrivateCreditPool: pool.address,
    },
    aclBridgeTx: setPoolTx.transactionHash,
  };

  const outDir = join(__dirname, "..", "deployments", network);
  try {
    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "Conclave.manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log(`│  ✓ wrote ${outDir}/Conclave.manifest.json`);
  } catch (e) {
    console.warn(`│  ⚠ failed to write manifest: ${(e as Error).message}`);
  }

  console.log(`└─ Conclave deploy complete\n`);
};

export default func;
func.id = "deploy_conclave";
func.tags = ["Conclave"];
