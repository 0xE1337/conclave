import { ethers, fhevm } from "hardhat";

/** Registers the signer (deployer/governor) as borrower #N on the deployed
 *  BorrowerRegistry. Uses real FHE-encrypted inputs created via the Zama
 *  relayer (works on Sepolia via the hardhat-fhevm plugin).
 *
 *  KYC tier 2 = Accredited. Bond = 500 wei (illustrative, value irrelevant).
 *
 *  After this:
 *    - `count()` increments by 1
 *    - `walletOf(N)` returns the signer's address
 *    - The signer can call `grantRegulatorAccess(N)` to opt in to the
 *      regulator that was set by `set-regulator.ts`.
 */
async function main() {
  // The fhevm plugin auto-initializes inside `hardhat test`, but a plain
  // `hardhat run` needs us to wake it up by hand so that
  // createEncryptedInput → relayer is wired before we call it.
  await fhevm.initializeCLIApi();

  const REGISTRY = "0x23D2566b41964AD73c649f607d35f745e6EB065A";
  const [signer] = await ethers.getSigners();
  const registry = await ethers.getContractAt("BorrowerRegistry", REGISTRY, signer);

  console.log("signer  =", signer.address);
  console.log("registry=", REGISTRY);
  console.log("count   =", (await registry.count()).toString());

  // Skip if signer already registered
  const existing = await registry.borrowerOfWallet(signer.address);
  if (existing > 0n) {
    console.log("→ signer already registered as id", existing.toString());
    return;
  }

  console.log("→ creating encrypted input (KYC tier=2, bond=500) via relayer …");
  const enc = await fhevm
    .createEncryptedInput(REGISTRY, signer.address)
    .add8(2) // kyc tier
    .add64(500) // accredited bond
    .encrypt();

  console.log("  handles =", enc.handles.map((h: Uint8Array | string) =>
    typeof h === "string" ? h : "0x" + Buffer.from(h).toString("hex"),
  ));
  console.log("→ register(...) …");

  const tx = await registry.register(
    signer.address,
    enc.handles[0],
    enc.inputProof,
    enc.handles[1],
    enc.inputProof,
  );
  console.log("tx hash =", tx.hash);
  const receipt = await tx.wait();
  console.log("block   =", receipt?.blockNumber);

  const id = await registry.borrowerOfWallet(signer.address);
  const total = await registry.count();
  console.log("done. borrower id =", id.toString(), "/ total =", total.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
