import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, network } from "hardhat";
import { BorrowerRegistry, CreditScoreEngine, PrivateCreditPool } from "../types";
import { expect } from "chai";

describe("PrivateCreditPool", function () {
  let gov: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let registry: BorrowerRegistry;
  let credit: CreditScoreEngine;
  let pool: PrivateCreditPool;
  let regAddr: string;
  let creditAddr: string;
  let poolAddr: string;

  before(async function () {
    const s = await ethers.getSigners();
    gov = s[0]; alice = s[1]; bob = s[2];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) { this.skip(); }

    const rF = await ethers.getContractFactory("BorrowerRegistry");
    registry = (await rF.deploy()) as BorrowerRegistry;
    regAddr = await registry.getAddress();

    const cF = await ethers.getContractFactory("CreditScoreEngine");
    credit = (await cF.deploy(regAddr)) as CreditScoreEngine;
    creditAddr = await credit.getAddress();

    const lF = await ethers.getContractFactory("PrivateCreditPool");
    pool = (await lF.deploy(regAddr, creditAddr)) as PrivateCreditPool;
    poolAddr = await pool.getAddress();

    // CRITICAL: bridge ACL — pool can read score handle, can record repay/default/collateral
    await (await credit.setPool(poolAddr)).wait();

    // Register borrower #1 (alice)
    const enc = await fhevm.createEncryptedInput(regAddr, gov.address)
      .add8(2).add64(500).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();

    // Compute initial score (zero) so getScore returns a valid handle
    await (await credit.computeScore(1)).wait();
    // Resolve initial tier (will be 150% since score = 0)
    await (await pool.resolveCollateralPct(1)).wait();
  });

  it("LP funds the pool", async function () {
    const amount = ethers.parseEther("10");
    await (await pool.fund({ value: amount })).wait();
    expect(await pool.pool()).to.eq(amount);
  });

  it("LP funds via receive fallback", async function () {
    const amount = ethers.parseEther("5");
    await (await gov.sendTransaction({ to: poolAddr, value: amount })).wait();
    expect(await pool.pool()).to.eq(amount);
  });

  it("should reject borrow without resolveCollateralPct first (NoTierResolved)", async function () {
    // Register borrower #2 (bob) but don't resolve tier
    const enc2 = await fhevm.createEncryptedInput(regAddr, gov.address)
      .add8(1).add64(100).encrypt();
    await (await registry.register(bob.address, enc2.handles[0], enc2.inputProof, enc2.handles[1], enc2.inputProof)).wait();

    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    await expect(
      pool.borrow(2, ethers.parseEther("1"), 100, { value: ethers.parseEther("1") })
    ).to.be.revertedWithCustomError(pool, "NoTierResolved");
  });

  it("borrows with 150% tier (default for low score)", async function () {
    const poolAmount = ethers.parseEther("10");
    await (await pool.fund({ value: poolAmount })).wait();

    const borrowAmt = ethers.parseEther("1");
    const required = (borrowAmt * 150n) / 100n;
    const tx = await pool.borrow(1, borrowAmt, 150, { value: required });
    await tx.wait();

    expect(await pool.pool()).to.eq(poolAmount - borrowAmt);
    const loan = await pool.loans(1);
    expect(loan.borrowerId).to.eq(1);
    expect(loan.borrowed).to.eq(borrowAmt);
    expect(loan.collateralPct).to.eq(150);
    expect(loan.active).to.eq(true);
  });

  it("rejects invalid collateral tier (InvalidTier)", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const amt = ethers.parseEther("1");

    await expect(
      pool.borrow(1, amt, 60, { value: amt })
    ).to.be.revertedWithCustomError(pool, "InvalidTier");
  });

  it("rejects borrow with insufficient collateral (BadCollateral)", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const borrowAmt = ethers.parseEther("2");
    // 150% of 2 ETH = 3 ETH required, only sending 1 ETH
    await expect(
      pool.borrow(1, borrowAmt, 150, { value: ethers.parseEther("1") })
    ).to.be.revertedWithCustomError(pool, "BadCollateral");
  });

  it("repay → records repayment to credit engine atomically (score-as-state)", async function () {
    const poolAmount = ethers.parseEther("10");
    await (await pool.fund({ value: poolAmount })).wait();

    const borrowAmt = ethers.parseEther("1");
    const required = (borrowAmt * 150n) / 100n;
    await (await pool.borrow(1, borrowAmt, 150, { value: required })).wait();

    // Repay — pool calls credit.recordRepayment in the same tx
    await expect(pool.connect(alice).repay(1, { value: borrowAmt }))
      .to.emit(credit, "RepaymentRecorded").withArgs(1)
      .and.to.emit(pool, "Repaid").withArgs(1);

    const loan = await pool.loans(1);
    expect(loan.active).to.eq(false);
  });

  it("liquidate → records default to credit engine", async function () {
    const poolAmount = ethers.parseEther("10");
    await (await pool.fund({ value: poolAmount })).wait();

    const borrowAmt = ethers.parseEther("1");
    const required = (borrowAmt * 150n) / 100n;
    await (await pool.borrow(1, borrowAmt, 150, { value: required })).wait();

    // Fast forward 31 days
    await network.provider.send("evm_increaseTime", [31 * 86400]);
    await network.provider.send("evm_mine");

    await expect(pool.liquidate(1))
      .to.emit(credit, "DefaultRecorded").withArgs(1)
      .and.to.emit(pool, "Liquidated").withArgs(1);
  });

  it("borrow records collateral signal automatically", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const borrowAmt = ethers.parseEther("1");
    const required = (borrowAmt * 150n) / 100n;

    await expect(pool.borrow(1, borrowAmt, 150, { value: required }))
      .to.emit(credit, "CollateralRecorded").withArgs(1);
  });

  it("Borrowed event uses ERC-7984 placeholder for encrypted-derived fields (anti-pattern #16)", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const borrowAmt = ethers.parseEther("1");
    const required = (borrowAmt * 150n) / 100n;
    const MAX = (1n << 256n) - 1n; // type(uint256).max

    // Event emits MAX placeholder for both `collateral` and `collateralPct` —
    // actual plaintext values still live in loans[loanId] storage struct.
    await expect(pool.borrow(1, borrowAmt, 150, { value: required }))
      .to.emit(pool, "Borrowed")
      .withArgs(1, 1, borrowAmt, MAX, MAX);

    const loan = await pool.loans(1);
    expect(loan.collateral).to.eq(required);
    expect(loan.collateralPct).to.eq(150);
  });

  it("rejects borrow when borrower is not active", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    await (await registry.revoke(1)).wait();
    await expect(
      pool.borrow(1, ethers.parseEther("1"), 150, { value: ethers.parseEther("1.5") })
    ).to.be.revertedWithCustomError(pool, "NotActive");
  });

  it("rejects double borrow (HasLoan)", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const amt = ethers.parseEther("1");
    const required = (amt * 150n) / 100n;
    await (await pool.borrow(1, amt, 150, { value: required })).wait();

    await expect(
      pool.borrow(1, amt, 150, { value: required })
    ).to.be.revertedWithCustomError(pool, "HasLoan");
  });

  it("rejects borrow exceeding pool (PoolEmpty)", async function () {
    await (await pool.fund({ value: ethers.parseEther("1") })).wait();
    await expect(
      pool.borrow(1, ethers.parseEther("2"), 150, { value: ethers.parseEther("3") })
    ).to.be.revertedWithCustomError(pool, "PoolEmpty");
  });

  it("rejects repay from non-borrower", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const amt = ethers.parseEther("1");
    const required = (amt * 150n) / 100n;
    await (await pool.borrow(1, amt, 150, { value: required })).wait();

    await expect(
      pool.connect(bob).repay(1, { value: amt })
    ).to.be.revertedWithCustomError(pool, "NotBorrower");
  });

  it("rejects early liquidation", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const amt = ethers.parseEther("1");
    const required = (amt * 150n) / 100n;
    await (await pool.borrow(1, amt, 150, { value: required })).wait();

    await expect(pool.liquidate(1)).to.be.reverted;
  });

  it("rejects non-governor liquidation", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const amt = ethers.parseEther("1");
    const required = (amt * 150n) / 100n;
    await (await pool.borrow(1, amt, 150, { value: required })).wait();

    await network.provider.send("evm_increaseTime", [31 * 86400]);
    await network.provider.send("evm_mine");

    await expect(
      pool.connect(alice).liquidate(1)
    ).to.be.revertedWithCustomError(pool, "NotGovernor");
  });

  it("emits Borrowed event with placeholder for encrypted fields", async function () {
    await (await pool.fund({ value: ethers.parseEther("10") })).wait();
    const amt = ethers.parseEther("1");
    const required = (amt * 150n) / 100n;
    const MAX = (1n << 256n) - 1n;

    await expect(pool.borrow(1, amt, 150, { value: required }))
      .to.emit(pool, "Borrowed")
      .withArgs(1, 1, amt, MAX, MAX);
  });

  it("emits PoolFunded event", async function () {
    const amt = ethers.parseEther("5");
    await expect(pool.fund({ value: amt }))
      .to.emit(pool, "PoolFunded")
      .withArgs(gov.address, amt);
  });
});
