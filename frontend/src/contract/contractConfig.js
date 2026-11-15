// Polygon Amoy deployment address.
// We will replace this after deploying the final contract.
export const CONTRACT_ADDRESS = '0x741cd835A8b08c32C602Dada4fdf04c339F0EE1b'

export const CONTRACT_ABI = [
  // =========================================================
  // READ FUNCTIONS
  // =========================================================

  'function admin() view returns (address)',

  'function roles(address) view returns (uint8)',

  'function getBatch(string batchId) view returns (tuple(string batchId, string drugName, uint256 manufactureDate, uint256 expirationDate, address manufacturer, address currentCustodian, uint8 status, string certificateHash, bool verified, bool flagged, string flagReason, bool exists))',

  'function isBatchVerified(string batchId) view returns (bool)',

  // =========================================================
  // ADMIN
  // =========================================================

  'function registerRegulator(address account)',

  // =========================================================
  // REGULATOR
  // =========================================================

  'function registerStakeholder(address account, uint8 role)',

  'function verifyBatch(string batchId)',

  'function flagBatch(string batchId, string reason)',

  'function recallBatch(string batchId, string reason)',

  // =========================================================
  // MANUFACTURER
  // =========================================================

  'function registerBatch(string batchId, string drugName, uint256 manufactureDate, uint256 expirationDate, string certificateHash)',

  // =========================================================
  // CUSTODY
  // =========================================================

  'function transferCustody(string batchId, address newCustodian)',

  // =========================================================
  // PHARMACY
  // =========================================================

  'function updateBatchStatus(string batchId, uint8 newStatus)',

  // =========================================================
  // EVENTS
  // =========================================================

  'event StakeholderRegistered(address indexed account, uint8 role)',

  'event BatchRegistered(string batchId, address indexed manufacturer)',

  'event CustodyTransferred(string batchId, address indexed previousCustodian, address indexed newCustodian)',

  'event BatchStatusUpdated(string batchId, uint8 newStatus)',

  'event BatchVerified(string batchId, address indexed regulator)',

  'event BatchRecalled(string batchId, address indexed regulator, string reason)',

  'event BatchFlagged(string batchId, address indexed regulator, string reason)'
]