import { Contract } from 'ethers'

import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from './contractConfig'

const STATUS_LABELS = {
  0: 'Manufactured',
  1: 'In Transit',
  2: 'At Pharmacy',
  3: 'Dispensed',
  4: 'Recalled',
}

/*
 * Our PharmaceuticalProvenance contract was deployed
 * to Polygon Amoy at this block.
 *
 * Starting here prevents us from scanning the entire
 * Amoy blockchain.
 */
const CONTRACT_DEPLOYMENT_BLOCK = 52898347

/*
 * Polygon Amoy RPC limits the maximum block range
 * that can be requested through eth_getLogs.
 *
 * 9000 keeps every request safely below the
 * 10,000-block limit.
 */
const BLOCK_CHUNK_SIZE = 9000

const shortenAddress = (address) => {
  if (!address) {
    return ''
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/*
 * Query an event type using safe block ranges.
 */
async function queryEventsInChunks(
  contract,
  filter,
  fromBlock,
  toBlock
) {
  const events = []

  for (
    let startBlock = fromBlock;
    startBlock <= toBlock;
    startBlock += BLOCK_CHUNK_SIZE
  ) {
    const endBlock = Math.min(
      startBlock + BLOCK_CHUNK_SIZE - 1,
      toBlock
    )

    const chunkEvents =
      await contract.queryFilter(
        filter,
        startBlock,
        endBlock
      )

    events.push(...chunkEvents)
  }

  return events
}

/*
 * Reconstruct the provenance history for a
 * pharmaceutical batch from actual blockchain events.
 */
export async function getBatchProvenance(
  provider,
  batchId
) {
  const contract = new Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    provider
  )

  const latestBlock =
    await provider.getBlockNumber()

  /*
   * Retrieve every relevant event emitted by the
   * PharmaceuticalProvenance contract.
   *
   * batchId is not indexed in the Solidity events,
   * so we retrieve the logs first and then filter
   * the decoded events by batchId.
   */
  const [
    registrationEvents,
    custodyEvents,
    statusEvents,
    verificationEvents,
    flagEvents,
    recallEvents,
  ] = await Promise.all([
    queryEventsInChunks(
      contract,
      contract.filters.BatchRegistered(),
      CONTRACT_DEPLOYMENT_BLOCK,
      latestBlock
    ),

    queryEventsInChunks(
      contract,
      contract.filters.CustodyTransferred(),
      CONTRACT_DEPLOYMENT_BLOCK,
      latestBlock
    ),

    queryEventsInChunks(
      contract,
      contract.filters.BatchStatusUpdated(),
      CONTRACT_DEPLOYMENT_BLOCK,
      latestBlock
    ),

    queryEventsInChunks(
      contract,
      contract.filters.BatchVerified(),
      CONTRACT_DEPLOYMENT_BLOCK,
      latestBlock
    ),

    queryEventsInChunks(
      contract,
      contract.filters.BatchFlagged(),
      CONTRACT_DEPLOYMENT_BLOCK,
      latestBlock
    ),

    queryEventsInChunks(
      contract,
      contract.filters.BatchRecalled(),
      CONTRACT_DEPLOYMENT_BLOCK,
      latestBlock
    ),
  ])

  const events = []

  // =========================================================
  // BATCH REGISTERED
  // =========================================================

  registrationEvents.forEach((event) => {
    if (
      event.args?.batchId !== batchId
    ) {
      return
    }

    events.push({
      type: 'registered',

      title: 'Batch Registered',

      description:
        `Manufacturer ${shortenAddress(
          event.args.manufacturer
        )} registered the pharmaceutical batch.`,

      blockNumber:
        event.blockNumber,

      transactionHash:
        event.transactionHash,

      logIndex:
        event.index,
    })
  })

  // =========================================================
  // CUSTODY TRANSFER
  // =========================================================

  custodyEvents.forEach((event) => {
    if (
      event.args?.batchId !== batchId
    ) {
      return
    }

    events.push({
      type: 'custody',

      title: 'Custody Transferred',

      description:
        `${shortenAddress(
          event.args.previousCustodian
        )} → ${shortenAddress(
          event.args.newCustodian
        )}`,

      blockNumber:
        event.blockNumber,

      transactionHash:
        event.transactionHash,

      logIndex:
        event.index,
    })
  })

  // =========================================================
  // STATUS UPDATE
  // =========================================================

  statusEvents.forEach((event) => {
    if (
      event.args?.batchId !== batchId
    ) {
      return
    }

    const status =
      Number(event.args.newStatus)

    events.push({
      type: 'status',

      title: 'Status Updated',

      description:
        `Lifecycle status changed to ${
          STATUS_LABELS[status] ??
          `Status ${status}`
        }.`,

      status,

      blockNumber:
        event.blockNumber,

      transactionHash:
        event.transactionHash,

      logIndex:
        event.index,
    })
  })

  // =========================================================
  // REGULATOR VERIFICATION
  // =========================================================

  verificationEvents.forEach(
    (event) => {
      if (
        event.args?.batchId !== batchId
      ) {
        return
      }

      events.push({
        type: 'verified',

        title: 'Regulator Verified',

        description:
          `Verified by regulator ${shortenAddress(
            event.args.regulator
          )}.`,

        blockNumber:
          event.blockNumber,

        transactionHash:
          event.transactionHash,

        logIndex:
          event.index,
      })
    }
  )

  // =========================================================
  // BATCH FLAGGED
  // =========================================================

  flagEvents.forEach((event) => {
    if (
      event.args?.batchId !== batchId
    ) {
      return
    }

    events.push({
      type: 'flagged',

      title: 'Batch Flagged',

      description:
        `${event.args.reason} — regulator ${shortenAddress(
          event.args.regulator
        )}`,

      blockNumber:
        event.blockNumber,

      transactionHash:
        event.transactionHash,

      logIndex:
        event.index,
    })
  })

  // =========================================================
  // BATCH RECALLED
  // =========================================================

  recallEvents.forEach((event) => {
    if (
      event.args?.batchId !== batchId
    ) {
      return
    }

    events.push({
      type: 'recalled',

      title: 'Batch Recalled',

      description:
        `${event.args.reason} — regulator ${shortenAddress(
          event.args.regulator
        )}`,

      blockNumber:
        event.blockNumber,

      transactionHash:
        event.transactionHash,

      logIndex:
        event.index,
    })
  })

  // =========================================================
  // RESTORE ORIGINAL BLOCKCHAIN ORDER
  // =========================================================

  events.sort((a, b) => {
    if (
      a.blockNumber !==
      b.blockNumber
    ) {
      return (
        a.blockNumber -
        b.blockNumber
      )
    }

    return (
      a.logIndex -
      b.logIndex
    )
  })

  // =========================================================
  // GET EVENT TIMESTAMPS
  // =========================================================

  /*
   * Multiple events can occur in the same block.
   *
   * Cache blocks so we don't repeatedly request
   * the same block from the Amoy RPC.
   */
  const blockCache = new Map()

  for (const event of events) {
    let block =
      blockCache.get(
        event.blockNumber
      )

    if (!block) {
      block =
        await provider.getBlock(
          event.blockNumber
        )

      blockCache.set(
        event.blockNumber,
        block
      )
    }

    event.timestamp =
      block?.timestamp ?? null
  }

  return events
}