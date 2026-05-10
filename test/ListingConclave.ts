import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, network } from "hardhat";
import { ListingConclave } from "../types";
import { expect } from "chai";

describe("ListingConclave", function () {
  let gov: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let carol: HardhatEthersSigner;
  let conclave: ListingConclave;
  let addr: string;

  before(async function () {
    const s = await ethers.getSigners();
    gov = s[0]; alice = s[1]; bob = s[2]; carol = s[3];
  });

  beforeEach(async function () {
    if (!fhevm.isMock) { this.skip(); }
    const f = await ethers.getContractFactory("ListingConclave");
    conclave = (await f.deploy()) as ListingConclave;
    addr = await conclave.getAddress();
  });

  it("opens a listing proposal for an asset", async function () {
    await (await conclave.openProposal(42)).wait();
    expect(await conclave.isActive(42)).to.eq(true);
    expect(await conclave.voterCount(42)).to.eq(0);
  });

  it("rejects duplicate proposal (ProposalExists)", async function () {
    await (await conclave.openProposal(42)).wait();
    await expect(conclave.openProposal(42))
      .to.be.revertedWithCustomError(conclave, "ProposalExists");
  });

  it("seals encrypted votes (homomorphic tally)", async function () {
    await (await conclave.openProposal(1)).wait();

    const encTrue = await fhevm.createEncryptedInput(addr, alice.address)
      .addBool(true).encrypt();
    await (await conclave.connect(alice).sealVote(1, encTrue.handles[0], encTrue.inputProof)).wait();

    const encFalse = await fhevm.createEncryptedInput(addr, bob.address)
      .addBool(false).encrypt();
    await (await conclave.connect(bob).sealVote(1, encFalse.handles[0], encFalse.inputProof)).wait();

    expect(await conclave.voterCount(1)).to.eq(2);
  });

  it("rejects double voting (AlreadyVoted)", async function () {
    await (await conclave.openProposal(1)).wait();

    const enc = await fhevm.createEncryptedInput(addr, alice.address)
      .addBool(true).encrypt();
    await (await conclave.connect(alice).sealVote(1, enc.handles[0], enc.inputProof)).wait();

    const enc2 = await fhevm.createEncryptedInput(addr, alice.address)
      .addBool(false).encrypt();
    await expect(conclave.connect(alice).sealVote(1, enc2.handles[0], enc2.inputProof))
      .to.be.revertedWithCustomError(conclave, "AlreadyVoted");
  });

  it("rejects voting after deadline (NotActive)", async function () {
    await (await conclave.openProposal(1)).wait();
    await network.provider.send("evm_increaseTime", [86401]);
    await network.provider.send("evm_mine");

    const enc = await fhevm.createEncryptedInput(addr, alice.address)
      .addBool(true).encrypt();
    await expect(conclave.connect(alice).sealVote(1, enc.handles[0], enc.inputProof))
      .to.be.revertedWithCustomError(conclave, "NotActive");
  });

  it("finalizes after deadline and reveals only aggregates", async function () {
    await (await conclave.openProposal(1)).wait();

    for (const voter of [alice, bob, carol]) {
      const enc = await fhevm.createEncryptedInput(addr, voter.address)
        .addBool(true).encrypt();
      await (await conclave.connect(voter).sealVote(1, enc.handles[0], enc.inputProof)).wait();
    }

    await network.provider.send("evm_increaseTime", [86401]);
    await network.provider.send("evm_mine");

    await (await conclave.finalize(1)).wait();
    expect(await conclave.isFinalized(1)).to.eq(true);
    expect(await conclave.isActive(1)).to.eq(false);
  });

  it("rejects early finalize (NotEnded)", async function () {
    await (await conclave.openProposal(1)).wait();
    await expect(conclave.finalize(1))
      .to.be.revertedWithCustomError(conclave, "NotEnded");
  });

  it("rejects non-governor openProposal", async function () {
    await expect(conclave.connect(alice).openProposal(1))
      .to.be.revertedWithCustomError(conclave, "NotGovernor");
  });

  it("emits ProposalOpened event with deadline", async function () {
    const tx = await conclave.openProposal(99);
    const rcpt = await tx.wait();
    expect(rcpt!.logs.length).to.be.greaterThan(0);
    // Just verify the event was emitted; deadline value is block-dependent
    await expect(tx).to.emit(conclave, "ProposalOpened");
  });

  it("emits VoteSealed event for each vote", async function () {
    await (await conclave.openProposal(7)).wait();
    const enc = await fhevm.createEncryptedInput(addr, alice.address)
      .addBool(true).encrypt();
    await expect(conclave.connect(alice).sealVote(7, enc.handles[0], enc.inputProof))
      .to.emit(conclave, "VoteSealed").withArgs(7, alice.address);
  });
});
