import { useState } from 'react'

import {
  getTransactionError,
  getWriteContract,
} from '../contract/contractService'

function SupplyChainPanels() {
  const [
    regulatorAddress,
    setRegulatorAddress,
  ] = useState('')

  const [
    distributorData,
    setDistributorData,
  ] = useState({
    batchId: '',
    pharmacyAddress: '',
  })

  const [
    pharmacyBatchId,
    setPharmacyBatchId,
  ] = useState('')

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const runTransaction =
    async (
      transactionFunction,
      successMessage
    ) => {
      setMessage('')
      setError('')
      setLoading(true)

      try {
        const { contract } =
          await getWriteContract()

        const transaction =
          await transactionFunction(
            contract
          )

        setMessage(
          'Transaction submitted. Waiting for confirmation...'
        )

        await transaction.wait()

        setMessage(successMessage)

        return true
      } catch (err) {
        setError(
          getTransactionError(err)
        )

        return false
      } finally {
        setLoading(false)
      }
    }

  const handleRegisterRegulator =
    async (event) => {
      event.preventDefault()

      const success =
        await runTransaction(
          (contract) =>
            contract.registerRegulator(
              regulatorAddress.trim()
            ),
          'Regulator appointed successfully.'
        )

      if (success) {
        setRegulatorAddress('')
      }
    }

  const handleDistributorChange =
    (event) => {
      const { name, value } =
        event.target

      setDistributorData(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      )
    }

  const handleDistributorTransfer =
    async (event) => {
      event.preventDefault()

      const currentBatchId =
        distributorData.batchId.trim()

      const success =
        await runTransaction(
          (contract) =>
            contract.transferCustody(
              currentBatchId,
              distributorData
                .pharmacyAddress
                .trim()
            ),
          `Batch ${currentBatchId} transferred to the pharmacy successfully.`
        )

      if (success) {
        setDistributorData({
          batchId: '',
          pharmacyAddress: '',
        })
      }
    }

  const handleAtPharmacy =
    async (event) => {
      event.preventDefault()

      const currentBatchId =
        pharmacyBatchId.trim()

      await runTransaction(
        (contract) =>
          contract.updateBatchStatus(
            currentBatchId,
            2
          ),
        `Batch ${currentBatchId} marked At Pharmacy successfully.`
      )
    }

  const handleDispensed =
    async () => {
      if (!pharmacyBatchId.trim()) {
        setError(
          'Please enter a batch ID.'
        )

        return
      }

      const currentBatchId =
        pharmacyBatchId.trim()

      const success =
        await runTransaction(
          (contract) =>
            contract.updateBatchStatus(
              currentBatchId,
              3
            ),
          `Batch ${currentBatchId} marked Dispensed successfully.`
        )

      if (success) {
        setPharmacyBatchId('')
      }
    }

  return (
    <>

      {message && (
        <div className="transaction-success">
          {message}
        </div>
      )}

      {error && (
        <div className="transaction-error">
          {error}
        </div>
      )}

      {/* ADMIN */}

      <section
        className="action-panel"
        id="admin-panel"
      >
        <div className="panel-heading">
          <div>
            <span className="panel-label">
              Administrator
            </span>

            <h3>
              Administrator Operations
            </h3>
          </div>

          <p>
            Appoint a trusted regulator
            who can authorize supply-chain
            participants.
          </p>
        </div>

        <div className="single-operation-grid">

          <form
            className="operation-card"
            onSubmit={
              handleRegisterRegulator
            }
          >
            <h4>
              Appoint Regulator
            </h4>

            <label>
              Regulator Wallet Address

              <input
                type="text"
                value={regulatorAddress}
                onChange={(event) =>
                  setRegulatorAddress(
                    event.target.value
                  )
                }
                placeholder="0x..."
                required
              />
            </label>

            <div className="workflow-note">
              <strong>
                Authorization Model
              </strong>

              <span>
                Administrator → Regulator
                → Supply-chain stakeholders
              </span>
            </div>

            <button
              type="submit"
              className="primary-action"
              disabled={loading}
            >
              Appoint Regulator
            </button>
          </form>

        </div>
      </section>

      {/* DISTRIBUTOR */}

      <section
        className="action-panel"
        id="distributor-panel"
      >
        <div className="panel-heading">
          <div>
            <span className="panel-label">
              Distributor
            </span>

            <h3>
              Distributor Operations
            </h3>
          </div>

          <p>
            Transfer an in-transit
            pharmaceutical batch to an
            authorized pharmacy.
          </p>
        </div>

        <div className="single-operation-grid">

          <form
            className="operation-card"
            onSubmit={
              handleDistributorTransfer
            }
          >
            <h4>
              Transfer to Pharmacy
            </h4>

            <label>
              Batch ID

              <input
                type="text"
                name="batchId"
                value={
                  distributorData.batchId
                }
                onChange={
                  handleDistributorChange
                }
                placeholder="MED-2026-001"
                required
              />
            </label>

            <label>
              Pharmacy Wallet Address

              <input
                type="text"
                name="pharmacyAddress"
                value={
                  distributorData
                    .pharmacyAddress
                }
                onChange={
                  handleDistributorChange
                }
                placeholder="0x..."
                required
              />
            </label>

            <div className="workflow-note">
              <strong>
                Allowed transition
              </strong>

              <span>
                Distributor → Pharmacy
              </span>
            </div>

            <button
              type="submit"
              className="primary-action"
              disabled={loading}
            >
              Transfer Custody
            </button>
          </form>

        </div>
      </section>

      {/* PHARMACY */}

      <section
        className="action-panel"
        id="pharmacy-panel"
      >
        <div className="panel-heading">
          <div>
            <span className="panel-label">
              Pharmacy
            </span>

            <h3>
              Pharmacy Operations
            </h3>
          </div>

          <p>
            Record pharmacy arrival and
            final dispensing of a batch.
          </p>
        </div>

        <div className="single-operation-grid">

          <form
            className="operation-card"
            onSubmit={
              handleAtPharmacy
            }
          >
            <h4>
              Update Pharmaceutical Status
            </h4>

            <label>
              Batch ID

              <input
                type="text"
                value={pharmacyBatchId}
                onChange={(event) =>
                  setPharmacyBatchId(
                    event.target.value
                  )
                }
                placeholder="MED-2026-001"
                required
              />
            </label>

            <div className="status-flow">
              <span>In Transit</span>
              <span>→</span>
              <span>At Pharmacy</span>
              <span>→</span>
              <span>Dispensed</span>
            </div>

            <button
              type="submit"
              className="primary-action"
              disabled={loading}
            >
              Mark At Pharmacy
            </button>

            <button
              type="button"
              className="secondary-action"
              onClick={handleDispensed}
              disabled={
                loading ||
                !pharmacyBatchId
              }
            >
              Mark Dispensed
            </button>
          </form>

        </div>
      </section>

    </>
  )
}

export default SupplyChainPanels