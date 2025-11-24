const hre = require("hardhat");

async function main() {
  const CertificateRegistry = await hre.ethers.getContractFactory("CertificateRegistry");
  const registry = await CertificateRegistry.deploy();

  await registry.waitForDeployment();
  const address = await registry.getAddress();
  console.log("CertificateRegistry deployed to:", address);

  const fs = require("fs");
  const path = require("path");
  const addressPath = path.join(__dirname, "..", "contract-address.json");
  fs.writeFileSync(addressPath, JSON.stringify({ address }, null, 2));
  console.log("Contract address written to:", addressPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
