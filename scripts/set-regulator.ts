import { ethers } from "hardhat";

/** Sets `regulator` on the deployed CreditScoreEngine to the signer's own
 *  address — for the Live-mode snapshot to show a non-zero regulator and
 *  to unblock `grantRegulatorAccess` if/when a borrower opts in.
 */
async function main() {
  const CREDIT = "0xd0AAFbd8C223f689E18Fba4F867500cE9A4DE8f1";
  const [signer] = await ethers.getSigners();
  const credit = await ethers.getContractAt("CreditScoreEngine", CREDIT, signer);

  console.log("signer  =", signer.address);
  console.log("contract=", CREDIT);
  console.log("current =", await credit.regulator());
  console.log("→ setRegulator(", signer.address, ") …");

  const tx = await credit.setRegulator(signer.address);
  console.log("tx hash =", tx.hash);
  const receipt = await tx.wait();
  console.log("block   =", receipt?.blockNumber);
  console.log("now     =", await credit.regulator());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
