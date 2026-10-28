# CSE540-Pharmaceutical-Provenance
Blockchain-based pharmaceutical drug provenance and anti-counterfeit system using Solidity and Polygon Amoy Testnet — CSE 540 Fall B 2026.
# Blockchain-Based Pharmaceutical Drug Provenance and Anti-Counterfeit System

CSE 540 — Engineering Blockchain Applications  
Fall B 2026 — Project Group 1

## Project Overview

This project develops a blockchain-based prototype for tracking pharmaceutical batches as they move through a supply chain. The system uses a Solidity smart contract to maintain a tamper-evident record of batch registration, custody transfers, status changes, and regulatory verification.

The prototype models interactions among manufacturers, distributors, pharmacies, regulators, and consumers. Authorized stakeholders can perform role-specific blockchain transactions, while consumers can retrieve batch information and verify its recorded provenance.

The smart contract is designed for deployment on the Polygon Amoy Testnet. The current repository represents the Smart Contract Design Draft milestone and establishes the contract structure and interfaces that will support later development.

## System Workflow

The prototype models the following pharmaceutical supply-chain workflow:

Manufacturer → Distributor → Pharmacy → Consumer Verification

A regulator independently verifies registered pharmaceutical batches.

A typical batch lifecycle is:

1. The administrator registers authorized stakeholder wallet addresses.
2. A manufacturer registers a pharmaceutical batch.
3. The manufacturer transfers custody to a distributor.
4. The distributor records receipt of the batch.
5. The distributor transfers custody to a pharmacy.
6. The pharmacy records receipt and delivery.
7. A regulator verifies the registered batch.
8. Consumers can retrieve the batch record and verify its recorded status.

Major state changes are emitted as blockchain events to provide an auditable provenance history.

## Stakeholder Roles

### Administrator
- Authorizes stakeholder wallet addresses.
- Assigns Manufacturer, Distributor, Pharmacy, or Regulator roles.

### Manufacturer
- Registers pharmaceutical batches.
- Becomes the initial custodian of registered batches.
- Transfers custody to an authorized supply-chain participant.

### Distributor
- Receives pharmaceutical batches.
- Updates batch status.
- Transfers custody to the next authorized participant.

### Pharmacy
- Receives pharmaceutical batches.
- Updates the final batch status.
- Represents the final supply-chain custodian in the current prototype.

### Regulator
- Verifies registered pharmaceutical batches.

### Consumer
- Does not require a blockchain role.
- Uses read-only functions to retrieve batch information and verification status.

## Smart Contract Design

The main smart contract is:

`contracts/PharmaceuticalProvenance.sol`

The contract currently defines:

### Data Structures
- `Role` — identifies authorized stakeholder types.
- `BatchStatus` — represents the pharmaceutical batch lifecycle.
- `DrugBatch` — stores the current on-chain state of a registered batch.

### Access Control
The contract uses modifiers to restrict sensitive operations:

- `onlyAdmin`
- `onlyRole`
- `batchExists`
- `onlyCurrentCustodian`

### Core Functions

`registerStakeholder(address account, Role role)`  
Registers an authorized supply-chain stakeholder. This operation is restricted to the contract administrator.

`registerBatch(string batchId, string drugName, uint256 manufactureDate, uint256 expirationDate, string certificateHash)`  
Registers a new pharmaceutical batch. Only an authorized manufacturer can perform this operation.

`transferCustody(string batchId, address newCustodian)`  
Transfers responsibility for a registered batch from its current custodian to another authorized stakeholder.

`updateBatchStatus(string batchId, BatchStatus newStatus)`  
Updates the lifecycle status of a batch. Only the current custodian can perform this operation.

`verifyBatch(string batchId)`  
Allows an authorized regulator to mark a registered batch as verified.

`getBatch(string batchId)`  
Returns the current information associated with a registered pharmaceutical batch.

`isBatchVerified(string batchId)`  
Returns whether a registered batch has been verified by a regulator.

## Blockchain Events

The contract emits the following events:

- `StakeholderRegistered`
- `BatchRegistered`
- `CustodyTransferred`
- `BatchStatusUpdated`
- `BatchVerified`

These events are intended to provide an auditable history of major supply-chain actions without requiring the complete transaction history to be duplicated in contract storage.

## Repository Structure

    CSE540-Pharmaceutical-Provenance/
    |
    |-- README.md
    |
    |-- contracts/
    |   |-- PharmaceuticalProvenance.sol
    |
    |-- docs/
        |-- architecture.png

The `docs` directory is intended for supporting project documentation and architecture diagrams.

## Dependencies and Tools

The current Smart Contract Design Draft uses:

- Solidity `^0.8.20`
- Remix IDE
- Ethereum Virtual Machine (EVM)
- Polygon Amoy Testnet for planned testnet deployment
- MetaMask for planned wallet interaction
- GitHub for source-code management and team collaboration

Future development may use Ethers.js for web application integration and IPFS for optional off-chain certificate storage.

## Setup

### 1. Clone the Repository

    git clone https://github.com/madhurika6232/CSE540-Pharmaceutical-Provenance.git

    cd CSE540-Pharmaceutical-Provenance

Alternatively, the Solidity contract can be opened directly in Remix IDE.

### 2. Open the Contract in Remix

Open:

https://remix.ethereum.org

Create or import:

    contracts/PharmaceuticalProvenance.sol

### 3. Compile

Use a Solidity compiler compatible with:

    pragma solidity ^0.8.20;

The current draft has been successfully compiled using Solidity 0.8.20 in Remix.

### 4. Local Deployment

For local testing in Remix:

1. Open **Deploy & Run Transactions**.
2. Select **Remix VM** as the environment.
3. Select `PharmaceuticalProvenance`.
4. Deploy the contract.
5. The deploying wallet becomes the contract administrator.

No constructor parameters are required.

## Basic Usage

The following example demonstrates the intended workflow.

### Register Stakeholders

From the administrator account, call:

    registerStakeholder(account, role)

Role values are:

    0 = None
    1 = Manufacturer
    2 = Distributor
    3 = Pharmacy
    4 = Regulator

### Register a Pharmaceutical Batch

Switch to a registered Manufacturer account and call:

    registerBatch(
        "MED-2026-001",
        "Amoxicillin 500mg",
        1767225600,
        1830297600,
        "QmDemoCertificateHash001"
    )

The manufacturer becomes the initial custodian and the batch begins with the `Manufactured` status.

### Transfer Custody

The current custodian can call:

    transferCustody("MED-2026-001", newCustodianAddress)

A successful transfer changes the current custodian and sets the batch status to `InTransit`.

### Update Batch Status

The current custodian can call:

    updateBatchStatus("MED-2026-001", newStatus)

Status values are:

    0 = Manufactured
    1 = InTransit
    2 = Received
    3 = Delivered

### Verify the Batch

From a registered Regulator account, call:

    verifyBatch("MED-2026-001")

### Retrieve Provenance Information

Anyone can use the read-only functions:

    getBatch("MED-2026-001")

and:

    isBatchVerified("MED-2026-001")

to retrieve the current batch information and regulatory verification status.

## Current Development Status

The Smart Contract Design Draft currently includes:

- Smart contract structure
- Stakeholder role definitions
- Pharmaceutical batch data model
- Role-based access control
- Batch registration
- Custody transfer
- Status updates
- Regulatory verification
- Event definitions
- Read-only provenance functions
- Successful Solidity compilation
- Local workflow testing using Remix VM

The current contract has been tested through the following simulated workflow:

Manufacturer → Distributor → Pharmacy → Regulator Verification

The testing confirmed batch registration, custody transfers, status updates, regulatory verification, and access-control behavior.

## Planned Development

Later project milestones will extend the current foundation with:

- Polygon Amoy Testnet deployment
- MetaMask integration
- Web-based dApp interface
- Consumer provenance visualization
- QR-based batch lookup, if time permits
- Optional IPFS-backed certificate storage
- Additional testing and gas-cost analysis

## Team Members

- Anvitha Nagireddy
- Charan Kappala
- Guru Charan Alla
- Jahnavi Krishna Kovvuri
- Madhurika Kandukoori
