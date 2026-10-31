// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PharmaceuticalProvenance
 * @notice Blockchain-based pharmaceutical drug provenance and
 *         anti-counterfeit prototype for CSE 540.
 *
 * @dev The contract models pharmaceutical batches moving through:
 *
 *      Manufacturer -> Distributor -> Pharmacy
 *
 *      A Regulator independently verifies registered batches.
 *      Consumers do not require a blockchain role because provenance
 *      information is available through public read-only functions.
 *
 *      Major state changes emit events so that an off-chain application
 *      can reconstruct an auditable provenance history.
 */
contract PharmaceuticalProvenance {

    // =============================================================
    //                            ENUMS
    // =============================================================

    /**
     * @notice Roles assigned to authorized supply-chain participants.
     */
    enum Role {
        None,
        Manufacturer,
        Distributor,
        Pharmacy,
        Regulator
    }

    /**
     * @notice Lifecycle states of a pharmaceutical batch.
     */
  enum BatchStatus {
    Manufactured,
    InTransit,
    AtPharmacy,
    Dispensed,
    Recalled
}

    // =============================================================
    //                           STRUCTS
    // =============================================================

    /**
     * @notice Stores the current on-chain state of a pharmaceutical batch.
     *
     * @param batchId Unique identifier of the batch.
     * @param drugName Human-readable pharmaceutical product name.
     * @param manufactureDate Manufacturing timestamp.
     * @param expirationDate Expiration timestamp.
     * @param manufacturer Wallet that originally registered the batch.
     * @param currentCustodian Wallet currently responsible for the batch.
     * @param status Current lifecycle status.
     * @param certificateHash Optional reference to an off-chain certificate.
     * @param verified Whether an authorized regulator verified the batch.
     * @param exists Whether the batch has been registered.
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
        bool flagged;
        string flagReason;
        bool exists;
    }

    // =============================================================
    //                       STATE VARIABLES
    // =============================================================

    /**
     * @notice Administrator responsible for authorizing stakeholders.
     */
    address public admin;

    /**
     * @notice Maps wallet addresses to authorized stakeholder roles.
     */
    mapping(address => Role) public roles;

    /**
     * @notice Maps unique batch IDs to pharmaceutical batch records.
     */
    mapping(string => DrugBatch) private batches;

    // =============================================================
    //                            EVENTS
    // =============================================================

    /**
     * @notice Emitted when the administrator authorizes a stakeholder.
     */
    event StakeholderRegistered(
        address indexed account,
        Role role
    );

    /**
     * @notice Emitted when a manufacturer registers a pharmaceutical batch.
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
     * @notice Emitted whenever the lifecycle status of a batch changes.
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

/**
 * @notice Emitted when a regulator recalls a pharmaceutical batch.
 */
event BatchRecalled(
    string batchId,
    address indexed regulator,
    string reason
);

/**
 * @notice Emitted when a regulator flags a suspicious batch.
 */
event BatchFlagged(
    string batchId,
    address indexed regulator,
    string reason
);



    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /**
     * @notice Initializes the contract administrator.
     * @dev The deploying wallet becomes the administrator.
     */
    constructor() {
        admin = msg.sender;
    }

    // =============================================================
    //                          MODIFIERS
    // =============================================================

    /**
     * @notice Restricts an operation to the administrator.
     */
    modifier onlyAdmin() {
        require(
            msg.sender == admin,
            "Only admin can perform this action"
        );
        _;
    }

    /**
     * @notice Restricts an operation to a specified stakeholder role.
     *
     * @param requiredRole Role required to execute the function.
     */
    modifier onlyRole(Role requiredRole) {
        require(
            roles[msg.sender] == requiredRole,
            "Caller does not have the required role"
        );
        _;
    }

    /**
     * @notice Ensures that a pharmaceutical batch exists.
     *
     * @param batchId Identifier of the pharmaceutical batch.
     */
    modifier batchExists(string memory batchId) {
        require(
            batches[batchId].exists,
            "Batch does not exist"
        );
        _;
    }

    /**
     * @notice Restricts an operation to the current batch custodian.
     *
     * @param batchId Identifier of the pharmaceutical batch.
     */
    modifier onlyCurrentCustodian(
        string memory batchId
    ) {
        require(
            batches[batchId].currentCustodian == msg.sender,
            "Caller is not the current custodian"
        );
        _;
    }

    // =============================================================
    //                    STAKEHOLDER MANAGEMENT
    // =============================================================

    
        /**
         * @notice Allows a regulator to approve supply-chain stakeholders.
         *
         * @dev Only an authorized Regulator may register Manufacturers,
         *      Distributors, and Pharmacies.
         *      The administrator appoints regulators separately.
         *      Consumers do not need registration because they use
         *      public read-only functions.
         *
         * @param account Wallet address of the stakeholder.
         * @param role Role assigned to the stakeholder.
         */

    function registerStakeholder(
        address account,
        Role role
    )
        external
        onlyRole(Role.Regulator)
    {
        require(
            account != address(0),
            "Invalid stakeholder address"
        );

        require(
            role == Role.Manufacturer ||
            role == Role.Distributor ||
            role == Role.Pharmacy,
            "Regulator can approve only supply-chain stakeholders"
        );

require(
    roles[account] == Role.None,
    "Account already has a role"
);

        roles[account] = role;

        emit StakeholderRegistered(
            account,
            role
        );
    }

/**
 * @notice Allows the administrator to appoint a regulator.
 * @param account Wallet address of the regulator.
 */
function registerRegulator(address account)
    external
    onlyAdmin
{
    require(
        account != address(0),
        "Invalid regulator address"
    );

    require(
        roles[account] == Role.None,
        "Account already has a role"
    );

    roles[account] = Role.Regulator;

    emit StakeholderRegistered(
        account,
        Role.Regulator
    );
}


    // =============================================================
    //                      BATCH REGISTRATION
    // =============================================================

    /**
     * @notice Registers a new pharmaceutical batch.
     *
     * @dev Only an authorized Manufacturer may register a batch.
     *      The registering Manufacturer becomes the initial custodian,
     *      and the initial status is Manufactured.
     *
     * @param batchId Unique pharmaceutical batch identifier.
     * @param drugName Name of the pharmaceutical product.
     * @param manufactureDate Manufacturing timestamp.
     * @param expirationDate Expiration timestamp.
     * @param certificateHash Optional off-chain certificate reference.
     */
    function registerBatch(
        string memory batchId,
        string memory drugName,
        uint256 manufactureDate,
        uint256 expirationDate,
        string memory certificateHash
    )
        external
        onlyRole(Role.Manufacturer)
    {
        require(
            bytes(batchId).length > 0,
            "Batch ID is required"
        );

        require(
            bytes(drugName).length > 0,
            "Drug name is required"
        );

        require(
            !batches[batchId].exists,
            "Batch already exists"
        );

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
            flagged: false,
            flagReason: "",
            exists: true
        });

        emit BatchRegistered(
            batchId,
            msg.sender
        );
    }

    // =============================================================
    //                       CUSTODY TRANSFER
    // =============================================================

    /**
     * @notice Transfers custody of a pharmaceutical batch to the next
     *         authorized participant in the supply chain.
     *
     * @dev Valid custody transitions are:
     *
     *      Manufacturer -> Distributor
     *      Distributor  -> Pharmacy
     *
     *      The caller must be the current custodian.
     *      Pharmacy is the final custodian in this prototype.
     *
     *      A successful custody transfer automatically changes the
     *      batch status to InTransit.
     *
     * @param batchId Unique identifier of the pharmaceutical batch.
     * @param newCustodian Wallet address receiving custody.
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
        batches[batchId].status != BatchStatus.Recalled &&
        batches[batchId].status != BatchStatus.Dispensed,
        "Cannot transfer recalled or dispensed batch"
    );

        require(
            newCustodian != address(0),
            "Invalid custodian address"
        );

        require(
            newCustodian != msg.sender,
            "Batch is already held by this custodian"
        );
// Custody transfer is allowed only for an active batch.
// Manufactured batches may leave the manufacturer.
// InTransit batches may move from distributor to pharmacy.
require(
    batches[batchId].status == BatchStatus.Manufactured ||
    batches[batchId].status == BatchStatus.InTransit,
    "Batch status does not permit custody transfer"
);

        Role senderRole = roles[msg.sender];
        Role recipientRole = roles[newCustodian];

        // Manufacturer can transfer only to a Distributor.
        if (senderRole == Role.Manufacturer) {
require(
    batches[batchId].status == BatchStatus.Manufactured,
    "Manufacturer can transfer only manufactured batches"
);

            require(
                recipientRole == Role.Distributor,
                "Manufacturer can transfer only to Distributor"
            );
        }

        // Distributor can transfer only to a Pharmacy.
        else if (senderRole == Role.Distributor) {
require(
    batches[batchId].status == BatchStatus.InTransit,
    "Distributor can transfer only in-transit batches"
);

            require(
                recipientRole == Role.Pharmacy,
                "Distributor can transfer only to Pharmacy"
            );
        }

        // Pharmacy is the final custodian in the current workflow.
        else {
            revert(
                "Current role cannot transfer custody"
            );
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
    //                        STATUS UPDATES
    // =============================================================

    /**
 * @notice Updates the lifecycle status of a pharmaceutical batch.
 *
 * @dev Only the current Pharmacy custodian can manually
 *      update a batch's lifecycle status.
 *
 *      Valid transitions:
 *      InTransit  -> AtPharmacy
 *      AtPharmacy -> Dispensed
 *
 *      Custody transfers automatically set the status to InTransit.
 *      Regulators can recall batches through a separate function.
 *
 * @param batchId Unique identifier of the pharmaceutical batch.
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
    Role callerRole = roles[msg.sender];

    BatchStatus currentStatus =
        batches[batchId].status;

    // Only a Pharmacy can manually update the batch status.
    require(
        callerRole == Role.Pharmacy,
        "Only Pharmacy can update batch status"
    );

    // Allowed transitions:
    // InTransit -> AtPharmacy
    // AtPharmacy -> Dispensed
    bool validTransition =
        (
            currentStatus == BatchStatus.InTransit &&
            newStatus == BatchStatus.AtPharmacy
        )
        ||
        (
            currentStatus == BatchStatus.AtPharmacy &&
            newStatus == BatchStatus.Dispensed
        );

    require(
        validTransition,
        "Invalid batch status transition"
    );

    batches[batchId].status = newStatus;

    emit BatchStatusUpdated(batchId, newStatus);
}


    // =============================================================
    //                   REGULATORY VERIFICATION
    // =============================================================

    /**
     * @notice Marks a pharmaceutical batch as regulator verified.
     *
     * @dev Only a registered Regulator may verify a batch.
     *      A batch can only be verified once.
     *
     * @param batchId Unique identifier of the pharmaceutical batch.
     */
    function verifyBatch(
        string memory batchId
    )
        external
        onlyRole(Role.Regulator)
        batchExists(batchId)
    {
require(
    batches[batchId].status != BatchStatus.Recalled,
    "Cannot verify a recalled batch"
);
        require(
            !batches[batchId].verified,
            "Batch already verified"
        );

        batches[batchId].verified = true;

        emit BatchVerified(
            batchId,
            msg.sender
        );
    }

/**
 * @notice Allows a regulator to recall a pharmaceutical batch.
 * @dev Only an authorized regulator can recall a registered batch.
 *      Recalled batches cannot be transferred or dispensed.
 *
 * @param batchId Unique identifier of the batch.
 * @param reason Explanation for the recall.
 */
function recallBatch(
    string memory batchId,
    string memory reason
)
    external
    onlyRole(Role.Regulator)
    batchExists(batchId)
{
    require(
        batches[batchId].status != BatchStatus.Recalled,
        "Batch already recalled"
    );

    require(
        bytes(reason).length > 0,
        "Recall reason is required"
    );

    batches[batchId].status = BatchStatus.Recalled;

    emit BatchStatusUpdated(
        batchId,
        BatchStatus.Recalled
    );

    emit BatchRecalled(
        batchId,
        msg.sender,
        reason
    );
}

/**
 * @notice Allows a regulator to flag a suspicious batch.
 * @dev Only an authorized regulator may flag an existing,
 *      non-recalled batch. Flagging records a reason without
 *      changing the batch lifecycle status.
 *
 * @param batchId Unique identifier of the batch.
 * @param reason Explanation for flagging the batch.
 */
function flagBatch(
    string memory batchId,
    string memory reason
)
    external
    onlyRole(Role.Regulator)
    batchExists(batchId)
{
    require(
        batches[batchId].status != BatchStatus.Recalled,
        "Cannot flag a recalled batch"
    );

    require(
        !batches[batchId].flagged,
        "Batch already flagged"
    );

    require(
        bytes(reason).length > 0,
        "Flag reason is required"
    );

    batches[batchId].flagged = true;
    batches[batchId].flagReason = reason;

    emit BatchFlagged(
        batchId,
        msg.sender,
        reason
    );
}


    // =============================================================
    //                         READ FUNCTIONS
    // =============================================================

    /**
     * @notice Returns the current information stored for a batch.
     *
     * @dev This function is public/read-only and can later be used
     *      by the consumer-facing dApp.
     *
     * @param batchId Unique identifier of the pharmaceutical batch.
     *
     * @return DrugBatch Current batch information.
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
     * @notice Returns whether a pharmaceutical batch has been
     *         verified by an authorized regulator.
     *
     * @param batchId Unique identifier of the pharmaceutical batch.
     *
     * @return bool True if the batch has been verified.
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
