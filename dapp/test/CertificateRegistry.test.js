const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let CertificateRegistry;
  let registry;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    registry = await CertificateRegistry.deploy();
  });

  it("Should set the right owner", async function () {
    expect(await registry.owner()).to.equal(owner.address);
  });

  it("Should issue a certificate", async function () {
    const id = ethers.encodeBytes32String("cert1");
    const holderHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const title = "Test Cert";
    const issuer = "Test Issuer";
    const expiresAt = 0;

    await registry.issue(id, holderHash, title, issuer, expiresAt);

    const cert = await registry.certificates(id);
    expect(cert.title).to.equal(title);
    expect(cert.issuer).to.equal(issuer);
  });

  it("Should verify a valid certificate", async function () {
    const id = ethers.encodeBytes32String("cert1");
    const holderHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const title = "Test Cert";
    const issuer = "Test Issuer";
    const expiresAt = 0;

    await registry.issue(id, holderHash, title, issuer, expiresAt);

    const result = await registry.verify(id, holderHash);
    expect(result.valid).to.be.true;
    expect(result.title).to.equal(title);
  });

  it("Should fail verification for invalid holder hash", async function () {
    const id = ethers.encodeBytes32String("cert1");
    const holderHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    const wrongHash = ethers.keccak256(ethers.toUtf8Bytes("wrong"));
    
    await registry.issue(id, holderHash, "Title", "Issuer", 0);

    const result = await registry.verify(id, wrongHash);
    expect(result.valid).to.be.false;
  });

  it("Should revoke a certificate", async function () {
    const id = ethers.encodeBytes32String("cert1");
    const holderHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
    
    await registry.issue(id, holderHash, "Title", "Issuer", 0);
    await registry.revoke(id);

    const result = await registry.verify(id, holderHash);
    expect(result.valid).to.be.false;
    expect(result.isRevoked).to.be.true;
  });
});
