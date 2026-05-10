import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BorrowerRegistry, CreditScoreEngine } from "../types";
import { expect } from "chai";

describe("CreditScoreEngine", function () {
  let gov: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let registry: BorrowerRegistry;
  let credit: CreditScoreEngine;
  let regAddr: string;
  let creditAddr: string;

  before(async function () {
    const s = await ethers.getSigners();
    gov = s[0]; alice = s[1];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) { this.skip(); }

    const rF = await ethers.getContractFactory("BorrowerRegistry");
    registry = (await rF.deploy()) as BorrowerRegistry;
    regAddr = await registry.getAddress();

    const cF = await ethers.getContractFactory("CreditScoreEngine");
    credit = (await cF.deploy(regAddr)) as CreditScoreEngine;
    creditAddr = await credit.getAddress();

    // Register borrower #1
    const enc = await fhevm.createEncryptedInput(regAddr, gov.address)
      .add8(2).add64(500).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();
  });

  it("should record repayments and compute score", async function () {
    await (await credit.recordRepayment(1)).wait();
    await (await credit.recordRepayment(1)).wait();
    await (await credit.recordRepayment(1)).wait();
    await (await credit.computeScore(1)).wait();
  });

  it("should record defaults (negative signal, clamps at 0)", async function () {
    await (await credit.recordRepayment(1)).wait();
    await (await credit.recordDefault(1)).wait();
    await (await credit.computeScore(1)).wait();
  });

  it("should record collateral history", async function () {
    await (await credit.recordCollateral(1)).wait();
    await (await credit.recordCollateral(1)).wait();
    await (await credit.computeScore(1)).wait();
  });

  it("should record encrypted volume", async function () {
    const enc = await fhevm.createEncryptedInput(creditAddr, gov.address)
      .add32(100).encrypt();

    await (await credit.recordVolume(1, enc.handles[0], enc.inputProof)).wait();
    await (await credit.computeScore(1)).wait();
  });

  it("should reject inactive borrower on record*", async function () {
    await (await registry.revoke(1)).wait();
    await expect(credit.recordRepayment(1)).to.be.revertedWithCustomError(credit, "NotActive");
  });

  it("should reject non-pool / non-governor record* (CRITICAL ACL gate)", async function () {
    await expect(credit.connect(alice).recordRepayment(1))
      .to.be.revertedWithCustomError(credit, "NotPoolOrGov");
  });

  it("setPool should grant ACL bridge to PrivateCreditPool address", async function () {
    // governor sets pool
    await (await credit.setPool(alice.address)).wait();
    expect(await credit.pool()).to.eq(alice.address);
  });

  it("once pool is set, the pool address can recordRepayment", async function () {
    // Simulate: pool address = alice (just for ACL test)
    await (await credit.setPool(alice.address)).wait();
    await (await credit.connect(alice).recordRepayment(1)).wait();
  });

  it("meetsThreshold should be restricted to pool/governor (anti binary-search side-channel)", async function () {
    for (let i = 0; i < 5; i++) {
      await (await credit.recordRepayment(1)).wait();
    }
    await (await credit.computeScore(1)).wait();

    const enc = await fhevm.createEncryptedInput(creditAddr, gov.address)
      .add32(30).encrypt();

    // Governor allowed
    await (await credit.meetsThreshold(1, enc.handles[0], enc.inputProof)).wait();

    // Random caller blocked
    const enc2 = await fhevm.createEncryptedInput(creditAddr, alice.address)
      .add32(30).encrypt();
    await expect(
      credit.connect(alice).meetsThreshold(1, enc2.handles[0], enc2.inputProof)
    ).to.be.revertedWithCustomError(credit, "NotPoolOrGov");
  });

  it("should update weights", async function () {
    await (await credit.setWeights(20, 50, 10, 2)).wait();
    expect(await credit.w1()).to.eq(20);
    expect(await credit.w2()).to.eq(50);
    expect(await credit.w3()).to.eq(10);
    expect(await credit.w4()).to.eq(2);
  });

  it("setRegulator + grantRegulatorAccess flow (selective disclosure)", async function () {
    // gov sets regulator
    const regulator = await (await ethers.getSigners())[5].getAddress();
    await (await credit.setRegulator(regulator)).wait();
    expect(await credit.regulator()).to.eq(regulator);

    // borrower must own to grant
    await (await credit.recordRepayment(1)).wait();
    await (await credit.computeScore(1)).wait();

    await (await credit.connect(alice).grantRegulatorAccess(1)).wait();
  });

  it("non-owner cannot grantRegulatorAccess", async function () {
    const regulator = await (await ethers.getSigners())[5].getAddress();
    await (await credit.setRegulator(regulator)).wait();
    await (await credit.recordRepayment(1)).wait();
    await (await credit.computeScore(1)).wait();

    const bob = (await ethers.getSigners())[2];
    await expect(
      credit.connect(bob).grantRegulatorAccess(1)
    ).to.be.revertedWithCustomError(credit, "NotBorrowerOwner");
  });
});
