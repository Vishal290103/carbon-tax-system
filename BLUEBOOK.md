
# Bluebook: The Carbon Tax Blockchain System

**Version:** 1.0  
**Date:** September 25, 2025  
**Status:** Official Project Documentation

---

## 1. Introduction & Vision

### 1.1. The Problem
Traditional carbon tax and credit systems often suffer from a lack of transparency, complex bureaucracy, and the potential for corruption. Funds collected may not be verifiably allocated to environmental projects, leading to public distrust and inefficient capital allocation for climate-positive initiatives.

### 1.2. Our Vision
The Carbon Tax Blockchain System is a decentralized platform designed to bring unparalleled transparency, efficiency, and accountability to carbon taxing. By leveraging a public blockchain, we create an immutable and auditable ledger of all transactions, from tax collection to the funding of green projects.

Our vision is to create a trustless ecosystem where individuals, corporations, and governments can participate in a fair and transparent carbon economy, with the ultimate goal of accelerating the transition to a sustainable future.

---

## 2. System Architecture

The platform is built on a three-tier architecture, separating the user interface, backend logic, and decentralized trust layer.

```
+--------------------------------------------------------------------------------+
|                                 CLIENT-SIDE                                    |
| +---------------------------+   +--------------------+   +-------------------+ |
| |           USER            |-->|   FRONTEND (React) |-->|   BROWSER WALLET  | |
| | (Interacts with UI)       |   | (Ethers.js)        |   |    (MetaMask)     | |
| +---------------------------+   +--------------------+   +-------------------+ |
|                                   |          ^                   |             |
| (API Calls) ....................... |          | (Read Data)         | (Sign Tx)   |
|                                   v          |                   v             |
+-----------------------------------|----------|-------------------|-------------+
                                    |          |                   |
+-----------------------------------|----------|-------------------|-------------+
|                                   v          |                   |             |
|                               SERVER-SIDE    |                   |             |
| +--------------------------------------------------------------+ |             |
| |                  BACKEND API (Spring Boot)                   | |             |
| | (Web3j, Admin Logic, Secure Wallet)                          | |             |
| +--------------------------------------------------------------+ |             |
|                                   | (Admin Tx)                   |             |
|                                   v                              |             |
+-----------------------------------|------------------------------|-------------+
                                    |                              |
+-----------------------------------v------------------------------v-------------+
|                                                                                |
|                              DECENTRALIZED LAYER                               |
| +----------------------------------------------------------------------------+ |
| |                            BLOCKCHAIN NODE (RPC)                           | |
| +----------------------------------------------------------------------------+ |
|                                       ^                                        |
|                                       | (Read/Write)                           |
|                                       v                                        |
| +----------------------------------------------------------------------------+ |
| |                     SMART CONTRACT (CarbonTaxSystem.sol)                     | |
| +----------------------------------------------------------------------------+ |
|                                                                                |
+--------------------------------------------------------------------------------+
```

---

## 3. Component Deep Dive

### 3.1. `contracts` (The Decentralized Trust Layer)
This is the core of the system, where all logic and data are secured on the blockchain.

-   **Technology:** Solidity, Hardhat, OpenZeppelin.
-   **Key File:** `CarbonTaxSystem.sol`
-   **Features:**
    -   **ERC20 Token (`CTT`):** A utility token ("CarbonTaxToken") used for staking and rewards.
    -   **Proof of Stake (PoS):** A staking mechanism allows users to lock `1000 CTT` to become a "Validator" and earn a 5% annual reward, securing the network.
    -   **Product & Tax Engine:** Manages the registration of products and the automated collection of a carbon tax upon purchase.
    -   **Green Project Funding:** A treasury system where the designated `governmentWallet` can create and fund environmental projects using the collected tax revenue.
    -   **Transparency Functions:** Provides public, read-only functions like `getSystemStats()` and `getUserTransactions()` to ensure anyone can audit the system's state.
    -   **Admin Controls:** An `owner` has the authority to pause the contract or update critical parameters like the tax rate.

### 3.2. `major back` (The Server-Side API)
This Java-based backend serves as an administrative layer and an intermediary for complex operations.

-   **Technology:** Java 17, Spring Boot, Web3j, Maven.
-   **Key Files:** `BlockchainController.java`, `Web3Service.java`.
-   **Responsibilities:**
    -   **Exposing a REST API:** Provides a clean API for the frontend to interact with.
    -   **Blockchain Abstraction:** The `Web3Service` handles the complexity of encoding and decoding data for smart contract interactions.
    -   **Secure Admin Operations:** The backend manages its own secure wallet (via private key) to perform privileged on-chain actions, such as creating a new green project, without exposing sensitive keys to the client-side.
    -   **Off-Chain Data (Future):** Can be used to manage user profiles, cached data, and other information not suitable for the blockchain.

### 3.3. `major front` (The Client-Side User Interface)
The modern, responsive web application that users interact with.

-   **Technology:** React, TypeScript, Vite, Ethers.js, Tailwind CSS.
-   **Key Files:** `App.tsx`, `web3Service.ts`, `/components`.
-   **Features:**
    -   **Wallet Integration:** Seamlessly connects with browser wallets like MetaMask for authentication and transaction signing.
    -   **Dynamic UI:** Provides a real-time view of the user's token balances and system statistics.
    -   **Core Components:** Includes a `CarbonCalculator`, a `TransparencyPortal` for viewing on-chain data, a product marketplace, and a validator staking interface.
    -   **Blockchain Service:** The `web3Service.ts` acts as the frontend's bridge to the blockchain, handling all direct contract calls and event listening.

---

## 4. Core Workflows

### 4.1. Product Purchase & Tax Collection
1.  A user connects their wallet to the frontend.
2.  They select a product and click "Purchase".
3.  The frontend prepares a transaction to call the `purchaseProduct()` function, including the total price (base + tax) in ETH.
4.  The user signs the transaction in their wallet.
5.  The smart contract executes, splitting the funds: the base price goes to the manufacturer, and the carbon tax goes to the `governmentWallet`.
6.  The transaction is permanently recorded on the blockchain.

### 4.2. Green Project Funding
1.  An administrator with access to the backend API sends a request to create a new green project.
2.  The Spring Boot backend, using its own secure wallet, calls the `createGreenProject()` function on the smart contract.
3.  The project is now listed on-chain.
4.  The administrator can then trigger the `fundGreenProject()` function, which transfers funds from the `governmentWallet` (where taxes are collected) to the project.
5.  All funding activities are publicly verifiable on the transparency portal.

---

## 5. Local Setup & Installation Guide

To run the project locally, follow these steps in order.

**Prerequisites:**
-   Node.js (v18+)
-   Java 17+ & Maven
-   A browser with a wallet extension like MetaMask.

### Step 1: Set Up the Blockchain
```bash
# 1. Navigate to the contracts directory
cd contracts

# 2. Install dependencies
npm install

# 3. In a separate terminal, start a local Hardhat blockchain node
npx hardhat node
# This will create 20 test accounts. Keep this terminal running.

# 4. In the first terminal, deploy the smart contract to the local node
npx hardhat run scripts/deploy.js --network localhost
# Take note of the deployed contract address in the output.
```

### Step 2: Configure and Run the Backend
1.  The deployment in Step 1 will create/update `major front/src/contracts/contract-config.json`. Copy the `contractAddress` from this file.
2.  Open `major back/src/main/resources/application.properties`.
3.  Set the `blockchain.contract.address` property to the address you copied. You may also need to provide the private key of the account you wish the backend to use (one of the test keys from the `hardhat node` output).
    ```properties
    blockchain.rpc.url=http://localhost:8545
    blockchain.contract.address=0x5FbDB2315678afecb367f032d93F642f64180aa3 # <-- PASTE ADDRESS HERE
    blockchain.private.key=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 # <-- PASTE PRIVATE KEY HERE (e.g., Hardhat account #0)
    blockchain.chain.id=1337
    ```
4.  Run the backend server:
    ```bash
    cd "major back"
    mvn spring-boot:run
    ```

### Step 3: Configure and Run the Frontend
1.  The `major front/src/contracts/contract-config.json` file should have been automatically created or updated by the deployment script. Verify it contains the correct contract address.
2.  Run the frontend application:
    ```bash
    cd "major front"
    npm install
    npm run dev
    ```
3.  Open your browser to the URL provided by Vite (usually `http://localhost:5173`).
4.  Connect your MetaMask wallet to the "Localhost 8545" network and import one of the test accounts from the `hardhat node` output to interact with the dApp.

---

## 6. Future Scope

This project serves as a robust foundation. Future enhancements could include:
-   **DeFi Integration:** Evolve into a full DAO for governance and introduce yield farming for CTT token holders.
-   **NFT Implementation:** Issue NFTs for funding green projects and as verifiable carbon offset certificates.
-   **Real-World Integration:** Use blockchain oracles to connect the contract to real-world data for automated project verification and dynamic tax rates.
-   **Layer 2 Scaling:** Deploy on a Layer 2 network (e.g., Arbitrum, Polygon) to reduce transaction fees and improve speed.
-   **Enhanced UX:** Implement fiat on-ramps and gasless transactions to make the platform more accessible to non-crypto native users.

