import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, execute } = hre.deployments;

  const registry = await deploy("BorrowerRegistry", {
    from: deployer,
    log: true,
  });
  console.log(`BorrowerRegistry:    ${registry.address}`);

  const conclave = await deploy("ListingConclave", {
    from: deployer,
    log: true,
  });
  console.log(`ListingConclave:     ${conclave.address}`);

  const credit = await deploy("CreditScoreEngine", {
    from: deployer,
    args: [registry.address],
    log: true,
  });
  console.log(`CreditScoreEngine:   ${credit.address}`);

  const pool = await deploy("PrivateCreditPool", {
    from: deployer,
    args: [registry.address, credit.address],
    log: true,
  });
  console.log(`PrivateCreditPool:   ${pool.address}`);

  // CRITICAL ACL bridge — without this, score handle is never granted to pool
  // and Sepolia coprocessor silently produces undefined ciphertext on resolveCollateralPct.
  await execute(
    "CreditScoreEngine",
    { from: deployer, log: true },
    "setPool",
    pool.address,
  );
  console.log(`✓ CreditScoreEngine.setPool(${pool.address}) — ACL bridge wired`);

  console.log("\n=== Conclave Deployment Complete ===");
  console.log(`  BorrowerRegistry:    ${registry.address}`);
  console.log(`  ListingConclave:     ${conclave.address}`);
  console.log(`  CreditScoreEngine:   ${credit.address}`);
  console.log(`  PrivateCreditPool:   ${pool.address}`);
};

export default func;
func.id = "deploy_conclave";
func.tags = ["Conclave"];
