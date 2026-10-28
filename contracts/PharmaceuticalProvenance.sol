// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PharmaceuticalProvenance
 * @notice Smart contract design draft for a blockchain-based pharmaceutical
 *         drug provenance and anti-counterfeit system.
 *
 * @dev The contract models the movement of pharmaceutical batches across
 *      manufacturers, distributors, pharmacies, and regulators.
 *
 *      Core responsibilities:
 *      - Register authorized supply-chain stakeholders
 *      - Register pharmaceutical batches
 *      - Transfer batch custody between stakeholders
 *      - Update batch status
 *      - Allow regulators to verify batches
 *      - Emit events that provide an auditable provenance history
 *
 *      This contract is an initial design draft for CSE 540.
 */
contract PharmaceuticalProvenance {

    // =============================================================
    //                         ENUMS
    // =============================================================

    /**
     * @notice Roles available to authorized supply-chain participants.
     * @dev Consumers are not assigned a role because they only require
     *      read access to provenance information.
     */
    enum Role {
        None,
        Manufacturer,
        Distributor,
        Pharmacy,
        Regulator
    }

    /**
     * @notice Represents the current lifecycle status of a drug batch.
     */
    enum BatchStatus {
        Manufactured,
        InTransit,
        Received,
        Delivered
    }

    // =============================================================
    //                         STRUCTS
    // =============================================================

    /**
     * @notice Stores the current on-chain state of a pharmaceutical batch.
     *
     * @param batchId Unique identifier assigned to the batch.
     * @param drugName Human-readable pharmaceutical product name.
     * @param manufactureDate Manufacturing timestamp/date representation.
     * @param expirationDate Expiration timestamp/date representation.
     * @param manufacturer Wallet address that originally registered the batch.
     * @param currentCustodian Wallet currently responsible for the batch.
     * @param status Current lifecycle status of the batch.
     * @param certificateHash Optional reference to an off-chain certificate.
     * @param verified Indicates whether a regulator has verified the batch.
     * @param exists Used to determine whether the batch has been registered.
     */
    struct DrugBatch {
        string batchId;
        string drugName;
        uint256 manufactureDate;
        uint256 expirationDate;
        address manufacturer;
        address currentCustodian;
        BatchStatus status;
        string certificateHash;
        bool verified;
        bool exists;
    }

    // =============================================================
    //                      STATE VARIABLES
    // =============================================================

    /// @notice Address responsible for initially authorizing stakeholders.
    address public admin;

    /// @notice Maps stakeholder wallet addresses to their authorized roles.
    mapping(address => Role) public roles;

    /// @notice Maps unique batch identifiers to pharmaceutical batch records.
    mapping(string => DrugBatch) private batches;

    // =============================================================
    //                           EVENTS
    // =============================================================

    /**
     * @notice Emitted when the administrator assigns a role to a stakeholder.
     */
    event StakeholderRegistered(
        address indexed account,
        Role role
    );

    /**
     * @notice Emitted when a manufacturer registers a new pharmaceutical batch.
     */
    event BatchRegistered(
        string batchId,
        address indexed manufacturer
    );

    /**
     * @notice Emitted whenever custody of a batch changes.
     */
    event CustodyTransferred(
        string batchId,
        address indexed previousCustodian,
        address indexed newCustodian
    );

    /**
     * @notice Emitted when the lifecycle status of a batch changes.
     */
    event BatchStatusUpdated(
        string batchId,
        BatchStatus newStatus
    );

    /**
     * @notice Emitted when an authorized regulator verifies a batch.
     */
    event BatchVerified(
        string batchId,
        address indexed regulator
    );

    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /**
     * @notice Initializes the contract administrator.
     * @dev The wallet deploying the contract becomes the administrator.
     */
    constructor() {
        admin = msg.sender;
    }

    // =============================================================
    //                         MODIFIERS
    // =============================================================

    /**
     * @notice Restricts a function to the contract administrator.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    /**
     * @notice Restricts a function to a specific stakeholder role.
     */
    modifier onlyRole(Role requiredRole) {
        require(
            roles[msg.sender] == requiredRole,
            "Caller does not have the required role"
        );
        _;
    }

    /**
     * @notice Ensures that a pharmaceutical batch has already been registered.
     */
    modifier batchExists(string memory batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }

    /**
     * @notice Restricts an operation to the current custodian of a batch.
     */
    modifier onlyCurrentCustodian(string memory batchId) {
        require(
            batches[batchId].currentCustodian == msg.sender,
            "Caller is not the current custodian"
        );
        _;
    }

    // =============================================================
    //                  STAKEHOLDER MANAGEMENT
    // =============================================================

    /**
     * @notice Registers an authorized pharmaceutical supply-chain stakeholder.
     * @dev Only the administrator can assign stakeholder roles.
     *
     * @param account Wallet address of the stakeholder.
     * @param role Role assigned to the stakeholder.
     */
    function registerStakeholder(
        address account,
        Role role
    ) external onlyAdmin {
        require(account != address(0), "Invalid stakeholder address");
        require(role != Role.None, "A valid role is required");

        roles[account] = role;

        emit StakeholderRegistered(account, role);
    }

    // =============================================================
    //                     BATCH REGISTRATION
    // =============================================================

    /**
     * @notice Registers a new pharmaceutical batch.
     * @dev Only an authorized manufacturer can create a batch.
     *
     * @param batchId Unique pharmaceutical batch identifier.
     * @param drugName Name of the pharmaceutical product.
     * @param manufactureDate Manufacturing date/timestamp.
     * @param expirationDate Expiration date/timestamp.
     * @param certificateHash Optional reference to an off-chain certificate.
     */
    function registerBatch(
        string memory batchId,
        string memory drugName,
        uint256 manufactureDate,
        uint256 expirationDate,
        string memory certificateHash
    ) external onlyRole(Role.Manufacturer) {

        require(bytes(batchId).length > 0, "Batch ID is required");
        require(bytes(drugName).length > 0, "Drug name is required");
        require(!batches[batchId].exists, "Batch already exists");
        require(
            expirationDate > manufactureDate,
            "Expiration must be after manufacture date"
        );

        batches[batchId] = DrugBatch({
            batchId: batchId,
            drugName: drugName,
            manufactureDate: manufactureDate,
            expirationDate: expirationDate,
            manufacturer: msg.sender,
            currentCustodian: msg.sender,
            status: BatchStatus.Manufactured,
            certificateHash: certificateHash,
            verified: false,
            exists: true
        });

        emit BatchRegistered(batchId, msg.sender);
    }

    // =============================================================
    //                      CUSTODY TRANSFER
    // =============================================================

    /**
     * @notice Transfers responsibility for a pharmaceutical batch.
     *
     * @dev The caller must currently hold custody of the batch.
     *      The recipient must already be registered as an authorized
     *      supply-chain stakeholder.
     *
     * @param batchId Identifier of the batch being transferred.
     * @param newCustodian Wallet address receiving custody.
     */
    /**
     * @notice Transfers custody of a pharmaceutical batch to the next
     *         authorized participant in the supply chain.
     *
     * @dev Valid custody transitions are:
     *      Manufacturer -> Distributor
     *      Distributor  -> Pharmacy
     *
     *      The caller must be the current custodian of the batch.
     *
     * @param batchId Unique identifier of the pharmaceutical batch.
     * @param newCustodian Wallet address receiving custody of the batch.
     */
    function transferCustody(
        string memory batchId,
        address newCustodian
    )
        external
        batchExists(batchId)
        onlyCurrentCustodian(batchId)
    {
        require(
            newCustodian != address(0),
            "Invalid custodian address"
        );
    
        require(
            newCustodian != msg.sender,
            "Batch is already held by this custodian"
        );
    
        Role senderRole = roles[msg.sender];
        Role recipientRole = roles[newCustodian];
    
        // Manufacturer can transfer only to a Distributor.
        if (senderRole == Role.Manufacturer) {
            require(
                recipientRole == Role.Distributor,
                "Manufacturer can transfer only to Distributor"
            );
        }
    
        // Distributor can transfer only to a Pharmacy.
        else if (senderRole == Role.Distributor) {
            require(
                recipientRole == Role.Pharmacy,
                "Distributor can transfer only to Pharmacy"
            );
        }
    
        // Pharmacy is the final custodian in the current prototype.
        else {
            revert("Current role cannot transfer custody");
        }
    
        address previousCustodian =
            batches[batchId].currentCustodian;
    
        batches[batchId].currentCustodian =
            newCustodian;
    
        batches[batchId].status =
            BatchStatus.InTransit;
    
        emit CustodyTransferred(
            batchId,
            previousCustodian,
            newCustodian
        );
    
        emit BatchStatusUpdated(
            batchId,
            BatchStatus.InTransit
        );
    }

    // =============================================================
    //                       STATUS UPDATES
    // =============================================================

    /**
     * @notice Updates the lifecycle status of a pharmaceutical batch.
     * @dev Only the current custodian may update the status.
     *
     * @param batchId Identifier of the pharmaceutical batch.
     * @param newStatus New lifecycle status.
     */
    function updateBatchStatus(
        string memory batchId,
        BatchStatus newStatus
    )
        external
        batchExists(batchId)
        onlyCurrentCustodian(batchId)
    {
        batches[batchId].status = newStatus;

        emit BatchStatusUpdated(batchId, newStatus);
    }

    // =============================================================
    //                    REGULATORY VERIFICATION
    // =============================================================

    /**
     * @notice Marks an existing pharmaceutical batch as regulator verified.
     * @dev Only a stakeholder with the Regulator role may call this function.
     *
     * @param batchId Identifier of the pharmaceutical batch.
     */
    function verifyBatch(
        string memory batchId
    )
        external
        onlyRole(Role.Regulator)
        batchExists(batchId)
    {
        require(!batches[batchId].verified, "Batch already verified");

        batches[batchId].verified = true;

        emit BatchVerified(batchId, msg.sender);
    }

    // =============================================================
    //                       READ FUNCTIONS
    // =============================================================

    /**
     * @notice Returns the current information stored for a batch.
     * @dev This read-only function can later be called by the consumer dApp.
     *
     * @param batchId Identifier of the pharmaceutical batch.
     */
    function getBatch(
        string memory batchId
    )
        external
        view
        batchExists(batchId)
        returns (DrugBatch memory)
    {
        return batches[batchId];
    }

    /**
     * @notice Returns whether a pharmaceutical batch has been verified.
     *
     * @param batchId Identifier of the pharmaceutical batch.
     */
    function isBatchVerified(
        string memory batchId
    )
        external
        view
        batchExists(batchId)
        returns (bool)
    {
        return batches[batchId].verified;
    }
}
