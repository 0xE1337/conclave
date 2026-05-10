import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { BorrowerRegistry, BorrowerRegistry__factory } from "../types";
import { expect } from "chai";

describe("BorrowerRegistry", function () {
  let gov: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let registry: BorrowerRegistry;
  let addr: string;

  before(async function () {
    const s = await ethers.getSigners();
    gov = s[0]; alice = s[1]; bob = s[2];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) { this.skip(); }
    const f = (await ethers.getContractFactory("BorrowerRegistry")) as BorrowerRegistry__factory;
    registry = (await f.deploy()) as BorrowerRegistry;
    addr = await registry.getAddress();
  });

  it("should register a borrower with encrypted KYC tier and accredited bond", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(2)
      .add64(500)
      .encrypt();

    const tx = await registry.register(
      alice.address,
      enc.handles[0], enc.inputProof,
      enc.handles[1], enc.inputProof,
    );
    await tx.wait();

    expect(await registry.borrowerOfWallet(alice.address)).to.eq(1n);
    expect(await registry.isActive(1)).to.eq(true);
    expect(await registry.count()).to.eq(1n);
  });

  it("should reject duplicate registration", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(1).add64(100).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();

    const enc2 = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(1).add64(100).encrypt();

    await expect(
      registry.register(alice.address, enc2.handles[0], enc2.inputProof, enc2.handles[1], enc2.inputProof)
    ).to.be.revertedWithCustomError(registry, "AlreadyRegistered");
  });

  it("should pause and reflect inactive status", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(1).add64(100).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();

    await (await registry.pause(1)).wait();
    expect(await registry.isActive(1)).to.eq(false);
  });

  it("should revoke borrower", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(1).add64(100).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();

    await (await registry.revoke(1)).wait();
    expect(await registry.isActive(1)).to.eq(false);
  });

  it("should reject non-governor register", async function () {
    const enc = await fhevm.createEncryptedInput(addr, alice.address)
      .add8(1).add64(100).encrypt();

    await expect(
      registry.connect(alice).register(bob.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)
    ).to.be.revertedWithCustomError(registry, "NotGovernor");
  });

  it("meetsKycTier (ERC-3643-inspired hook) should return encrypted bool without revert", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(2).add64(500).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();

    const encThreshold = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(1).encrypt();
    const tx = await registry.meetsKycTier(1, encThreshold.handles[0], encThreshold.inputProof);
    await tx.wait();
  });

  it("should emit BorrowerRegistered event", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(2).add64(500).encrypt();

    await expect(
      registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)
    ).to.emit(registry, "BorrowerRegistered").withArgs(1, alice.address);
  });

  it("walletOf returns the registered wallet", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(2).add64(500).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();
    expect(await registry.walletOf(1)).to.eq(alice.address);
  });

  it("count() tracks accurately across multiple registrations", async function () {
    expect(await registry.count()).to.eq(0n);
    const wallets = [alice, bob];
    for (const w of wallets) {
      const enc = await fhevm.createEncryptedInput(addr, gov.address)
        .add8(2).add64(500).encrypt();
      await (await registry.register(w.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();
    }
    expect(await registry.count()).to.eq(2n);
  });

  it("revoke marks borrower inactive but keeps walletOf mapping intact", async function () {
    const enc = await fhevm.createEncryptedInput(addr, gov.address)
      .add8(2).add64(500).encrypt();
    await (await registry.register(alice.address, enc.handles[0], enc.inputProof, enc.handles[1], enc.inputProof)).wait();
    await (await registry.revoke(1)).wait();
    expect(await registry.isActive(1)).to.eq(false);
    expect(await registry.walletOf(1)).to.eq(alice.address); // wallet mapping retained
  });
});
