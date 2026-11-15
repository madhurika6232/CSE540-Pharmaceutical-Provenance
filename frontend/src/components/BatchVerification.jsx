import { useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'

import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from '../contract/contractConfig'

import {
  getBatchProvenance,
} from '../contract/provenanceService'

const STATUS_LABELS = {
  0: 'Manufactured',
  1: 'In Transit',
  2: 'At Pharmacy',
  3: 'Dispensed',
  4: 'Recalled',
}

function BatchVerification() {
  const [batchId, setBatchId] = useState('')
  const [batch, setBatch] = useState(null)
  const [provenance, setProvenance] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async (event) => {
    event.preventDefault()

    setError('')
    setBatch(null)
    setProvenance([])

    const normalizedBatchId = batchId.trim()

    if (!normalizedBatchId) {
      setError('Please enter a batch ID.')
      return
    }

    try {
      setLoading(true)

      if (!window.ethereum) {
        setError(
          'MetaMask is required to access Polygon Amoy.'
        )
        return
      }

      const provider = new BrowserProvider(
        window.ethereum
      )

      const network = await provider.getNetwork()

      if (network.chainId !== 80002n) {
        setError(
          'Please switch MetaMask to Polygon Amoy Testnet.'
        )
        return
      }

      const contract = new Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        provider
      )

      // -----------------------------------------------------
      // CURRENT BATCH STATE
      // -----------------------------------------------------

      const result = await contract.getBatch(
        normalizedBatchId
      )

      // -----------------------------------------------------
      // REAL BLOCKCHAIN EVENT HISTORY
      // -----------------------------------------------------

      const history = await getBatchProvenance(
        provider,
        normalizedBatchId
      )

      // -----------------------------------------------------
      // DATE FORMATTING
      // -----------------------------------------------------

      const formatDate = (timestamp) => {
        const value = Number(timestamp)

        if (!value) {
          return 'Not available'
        }

        /*
         * Use UTC components because the Solidity timestamps
         * were generated from UTC dates.
         *
         * This avoids displaying the previous day in U.S.
         * time zones.
         */
        const date = new Date(value * 1000)

        const month = String(
          date.getUTCMonth() + 1
        ).padStart(2, '0')

        const day = String(
          date.getUTCDate()
        ).padStart(2, '0')

        const year = date.getUTCFullYear()

        return `${month}/${day}/${year}`
      }

      // -----------------------------------------------------
      // STORE CURRENT BATCH
      // -----------------------------------------------------

      setBatch({
        batchId: result.batchId,
        drugName: result.drugName,

        manufactureDate: formatDate(
          result.manufactureDate
        ),

        expirationDate: formatDate(
          result.expirationDate
        ),

        manufacturer: result.manufacturer,

        currentCustodian:
          result.currentCustodian,

        status: Number(result.status),

        certificateHash:
          result.certificateHash,

        verified: result.verified,

        flagged: result.flagged,

        flagReason: result.flagReason,
      })

      // -----------------------------------------------------
      // STORE REAL EVENT HISTORY
      // -----------------------------------------------------

      setProvenance(history)
    } catch (err) {
      console.error(
        'Batch verification error:',
        err
      )

      setError(
        'Batch not found or unable to retrieve blockchain data.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className="verification-section"
      id="consumer-panel"
    >

      {/* ===================================================
          SEARCH
      ==================================================== */}

      <div className="verify-card">

        <div>
          <span className="panel-label">
            Consumer
          </span>

          <h3>
            Verify a Pharmaceutical Batch
          </h3>

          <p>
            Enter a batch ID to view its blockchain
            provenance, lifecycle status, and
            regulatory information.
          </p>
        </div>

        <form
          className="search-row"
          onSubmit={handleVerify}
        >
          <input
            type="text"
            value={batchId}
            onChange={(event) =>
              setBatchId(event.target.value)
            }
            placeholder="Example: MED-AMOY-001"
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Checking Blockchain...'
              : 'Verify Batch'}
          </button>
        </form>

      </div>

      {/* ===================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="verification-error">
          {error}
        </div>
      )}

      {/* ===================================================
          BATCH RESULT
      ==================================================== */}

      {batch && (
        <div className="batch-result">

          {/* ===============================================
              RESULT HEADER
          ================================================ */}

          <div className="batch-result-header">

            <div>
              <span className="result-label">
                Pharmaceutical Batch
              </span>

              <h3>
                {batch.batchId}
              </h3>

              <p>
                {batch.drugName}
              </p>
            </div>

            <div className="status-badges">

              {/* Lifecycle Status */}

              <span
                className={`status-badge ${
                  batch.status === 4
                    ? 'status-recalled'
                    : 'status-normal'
                }`}
              >
                {STATUS_LABELS[batch.status] ??
                  'Unknown'}
              </span>

              {/* Verification */}

              <span
                className={`status-badge ${
                  batch.verified
                    ? 'status-verified'
                    : 'status-unverified'
                }`}
              >
                {batch.verified
                  ? 'Regulator Verified'
                  : 'Not Verified'}
              </span>

              {/* Flag */}

              {batch.flagged && (
                <span className="status-badge status-flagged">
                  Flagged
                </span>
              )}

            </div>

          </div>

          {/* ===============================================
              REGULATORY WARNING
          ================================================ */}

          {batch.flagged && (
            <div className="regulatory-warning">

              <strong>
                Regulatory Warning
              </strong>

              <span>
                {batch.flagReason ||
                  'This batch has been flagged by a regulator.'}
              </span>

            </div>
          )}

          {/* ===============================================
              BATCH DETAILS
          ================================================ */}

          <div className="batch-details">

            <div className="detail-item">
              <span>
                Manufacturer
              </span>

              <strong>
                {batch.manufacturer}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Current Custodian
              </span>

              <strong>
                {batch.currentCustodian}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Manufacture Date
              </span>

              <strong>
                {batch.manufactureDate}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Expiration Date
              </span>

              <strong>
                {batch.expirationDate}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Lifecycle Status
              </span>

              <strong>
                {STATUS_LABELS[batch.status] ??
                  'Unknown'}
              </strong>
            </div>

            <div className="detail-item">
              <span>
                Certificate Reference
              </span>

              <strong>
                {batch.certificateHash ||
                  'Not provided'}
              </strong>
            </div>

          </div>

          {/* ===============================================
              SIMPLE LIFECYCLE VIEW
          ================================================ */}

          <div className="provenance-preview">

            <h4>
              Provenance Lifecycle
            </h4>

            <div className="timeline">

              {/* Manufactured */}

              <div className="timeline-step complete">

                <span>
                  1
                </span>

                <div>
                  <strong>
                    Manufactured
                  </strong>

                  <p>
                    Batch registered by manufacturer
                  </p>
                </div>

              </div>

              {/* In Transit */}

              <div
                className={`timeline-step ${
                  batch.status >= 1 &&
                  batch.status !== 4
                    ? 'complete'
                    : ''
                }`}
              >

                <span>
                  2
                </span>

                <div>
                  <strong>
                    In Transit
                  </strong>

                  <p>
                    Custody transferred through
                    the supply chain
                  </p>
                </div>

              </div>

              {/* At Pharmacy */}

              <div
                className={`timeline-step ${
                  batch.status >= 2 &&
                  batch.status !== 4
                    ? 'complete'
                    : ''
                }`}
              >

                <span>
                  3
                </span>

                <div>
                  <strong>
                    At Pharmacy
                  </strong>

                  <p>
                    Batch received by pharmacy
                  </p>
                </div>

              </div>

              {/* Dispensed */}

              <div
                className={`timeline-step ${
                  batch.status === 3
                    ? 'complete'
                    : ''
                }`}
              >

                <span>
                  4
                </span>

                <div>
                  <strong>
                    Dispensed
                  </strong>

                  <p>
                    Final pharmaceutical lifecycle
                    stage
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* ===============================================
              REAL BLOCKCHAIN EVENT HISTORY
          ================================================ */}

          <div className="blockchain-history">

            <div className="history-heading">

              <div>
                <span className="result-label">
                  Polygon Amoy
                </span>

                <h4>
                  Blockchain Event History
                </h4>
              </div>

              <span className="event-count">
                {provenance.length}{' '}

                {provenance.length === 1
                  ? 'event'
                  : 'events'}
              </span>

            </div>

            {/* No Events */}

            {provenance.length === 0 ? (

              <p className="history-empty">
                No blockchain events were found
                for this batch.
              </p>

            ) : (

              <div className="history-list">

                {provenance.map(
                  (event, index) => (

                    <div
                      className="history-event"
                      key={
                        `${event.transactionHash}-${event.logIndex}`
                      }
                    >

                      {/* Event Number */}

                      <div className="history-marker">
                        {index + 1}
                      </div>

                      {/* Event Information */}

                      <div className="history-content">

                        <div className="history-event-header">

                          <strong>
                            {event.title}
                          </strong>

                          {event.timestamp && (
                            <span>
                              {new Date(
                                event.timestamp *
                                  1000
                              ).toLocaleString()}
                            </span>
                          )}

                        </div>

                        <p>
                          {event.description}
                        </p>

                        <div className="history-metadata">

                          <span>
                            Block{' '}
                            {event.blockNumber}
                          </span>

                          <a
                            href={
                              `https://amoy.polygonscan.com/tx/${event.transactionHash}`
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Transaction
                          </a>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* ===============================================
              RECALL NOTICE
          ================================================ */}

          {batch.status === 4 && (
            <div className="regulatory-warning">

              <strong>
                Batch Recalled
              </strong>

              <span>
                This pharmaceutical batch has
                been recalled by an authorized
                regulator.
              </span>

            </div>
          )}

        </div>
      )}

    </section>
  )
}

export default BatchVerification