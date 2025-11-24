# Blockchain Certificate Verification System

This project demonstrates a Docker-based blockchain system for issuing, verifying, and revoking digital certificates using a local EVM chain (Ganache), Hardhat, and a Node.js client.

## Prerequisites

- Docker Desktop
- Docker Compose

## Project Structure

- `dapp/`: Hardhat project containing the Smart Contract (`CertificateRegistry.sol`) and deployment scripts.
- `client/`: Node.js client application for interacting with the blockchain.
- `docker-compose.yml`: Orchestrates the `ganache`, `hardhat`, and `client` services.

## Getting Started

1.  **Start the System:**
    ```bash
    docker-compose up -d
    ```

2.  **Deploy the Smart Contract:**
    The `hardhat` container is configured to compile contracts on startup. You need to deploy the contract manually or via a script.
    ```bash
    docker-compose exec hardhat npx hardhat run scripts/deploy.js --network localhost
    ```

3.  **Run Client Commands:**
    
    The client is available inside the `client` container. You can run commands using `docker-compose exec client ...`.

    **Issue a Certificate:**
    ```bash
    docker-compose exec client npx ts-node src/index.ts issue <id> <ogrNo> <name> <title> <issuer>
    # Example:
    docker-compose exec client npx ts-node src/index.ts issue cert1 12345 "John Doe" "Completion Cert" "University"
    ```
    *Note the `Salt` output! You need it for verification.*

    **Verify a Certificate:**
    ```bash
    docker-compose exec client npx ts-node src/index.ts verify <id> <ogrNo> <name> <salt>
    # Example:
    docker-compose exec client npx ts-node src/index.ts verify cert1 12345 "John Doe" 0xf4a2ec219a37f1ca7373883b8066ab1b
    ```

    **Revoke a Certificate:**
    ```bash
    docker-compose exec client npx ts-node src/index.ts revoke <id>
    # Example:
    docker-compose exec client npx ts-node src/index.ts revoke cert1
    ```

## Architecture

- **Ganache**: Local Ethereum blockchain running on port 8545. Mnemonic is fixed in `docker-compose.yml`.
- **Hardhat**: Development environment. Deploys `CertificateRegistry.sol`.
- **Client**: Node.js (TypeScript) application. Uses `ethers.js` to interact with the contract.

## Privacy & GDPR

- **Data Minimization**: No personal data (Name, Student ID) is stored on-chain.
- **Hashing**: Data is hashed off-chain using `keccak256(ogrNo + "|" + name + "|" + salt)`.
- **Salt**: A random salt is generated for each certificate to prevent dictionary attacks. The salt must be stored securely off-chain (e.g., given to the user).
