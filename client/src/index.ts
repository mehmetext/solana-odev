import * as dotenv from "dotenv";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Account #0 for 'test test ... junk'

// Paths to ABI and Address
const ARTIFACT_PATH = path.join(__dirname, "../dapp/artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json");
const ADDRESS_PATH = path.join(__dirname, "../dapp/contract-address.json");

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log("Usage: node dist/index.js <command> [args]");
    console.log("Commands:");
    console.log("  issue <id> <ogrNo> <name> <title> <issuer>");
    console.log("  verify <id> <ogrNo> <name>");
    console.log("  revoke <id>");
    return;
  }

  // Connect to Provider and Signer
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Load Contract
  if (!fs.existsSync(ADDRESS_PATH) || !fs.existsSync(ARTIFACT_PATH)) {
    console.error("Error: Contract artifacts or address not found. Make sure to deploy the contract first.");
    process.exit(1);
  }

  const { address } = JSON.parse(fs.readFileSync(ADDRESS_PATH, "utf8"));
  const { abi } = JSON.parse(fs.readFileSync(ARTIFACT_PATH, "utf8"));
  const contract = new ethers.Contract(address, abi, wallet);

  try {
    switch (command) {
      case "issue":
        await issueCertificate(contract, args.slice(1));
        break;
      case "verify":
        await verifyCertificate(contract, args.slice(1));
        break;
      case "revoke":
        await revokeCertificate(contract, args.slice(1));
        break;
      default:
        console.log("Unknown command:", command);
    }
  } catch (error) {
    console.error("Error executing command:", error);
  }
}

function generateHolderHash(ogrNo: string, name: string, salt: string): string {
  // Data minimization: Hash(ogrNo + "|" + name.toUpperCase().trim() + "|" + salt)
  const payload = `${ogrNo}|${name.toUpperCase().trim()}|${salt}`;
  return ethers.keccak256(ethers.toUtf8Bytes(payload));
}

async function issueCertificate(contract: ethers.Contract, args: string[]) {
  const [idStr, ogrNo, name, title, issuer] = args;
  if (!idStr || !ogrNo || !name || !title || !issuer) {
    console.log("Usage: issue <id> <ogrNo> <name> <title> <issuer>");
    return;
  }

  const id = ethers.encodeBytes32String(idStr);
  // Generate a random salt for this user/certificate
  const salt = ethers.hexlify(ethers.randomBytes(16));
  const holderHash = generateHolderHash(ogrNo, name, salt);
  const expiresAt = 0; // No expiration for now

  console.log(`Issuing certificate...`);
  console.log(`ID: ${idStr} (${id})`);
  console.log(`Holder: ${name} (${ogrNo})`);
  console.log(`Salt: ${salt} (SAVE THIS TO VERIFY!)`);
  console.log(`Holder Hash: ${holderHash}`);

  const tx = await contract.issue(id, holderHash, title, issuer, expiresAt);
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  console.log("Certificate issued successfully!");
  
  // In a real app, you would save the salt securely off-chain associated with the user/cert
  console.log(`\nIMPORTANT: Save this salt to verify later: ${salt}`);
}

async function verifyCertificate(contract: ethers.Contract, args: string[]) {
  const [idStr, ogrNo, name, salt] = args;
  if (!idStr || !ogrNo || !name || !salt) {
    console.log("Usage: verify <id> <ogrNo> <name> <salt>");
    return;
  }

  const id = ethers.encodeBytes32String(idStr);
  const holderHash = generateHolderHash(ogrNo, name, salt);

  console.log(`Verifying certificate...`);
  console.log(`ID: ${idStr}`);
  console.log(`Computed Hash: ${holderHash}`);

  const result = await contract.verify(id, holderHash);
  // Result: [valid, isRevoked, issuedAt, expiresAt, title, issuer]
  
  const isValid = result[0];
  const isRevoked = result[1];
  const title = result[4];
  const issuer = result[5];

  if (isValid) {
    console.log("\n✅ Certificate is VALID");
    console.log(`Title: ${title}`);
    console.log(`Issuer: ${issuer}`);
  } else {
    console.log("\n❌ Certificate is INVALID");
    if (isRevoked) {
      console.log("Reason: Certificate has been REVOKED");
    } else {
      console.log("Reason: Hash mismatch, not found, or expired");
    }
  }
}

async function revokeCertificate(contract: ethers.Contract, args: string[]) {
  const [idStr] = args;
  if (!idStr) {
    console.log("Usage: revoke <id>");
    return;
  }

  const id = ethers.encodeBytes32String(idStr);
  console.log(`Revoking certificate ${idStr}...`);

  const tx = await contract.revoke(id);
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  console.log("Certificate revoked successfully!");
}

main().catch(console.error);
