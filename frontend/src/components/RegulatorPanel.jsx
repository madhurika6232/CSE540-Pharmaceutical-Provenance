import { useState } from 'react'

import {
  getTransactionError,
  getWriteContract,
} from '../contract/contractService'

function RegulatorPanel() {
  const [stakeholder, setStakeholder] =
    useState({
      address: '',
      role: '1',
    })

  const [
    verifyBatchId,
    setVerifyBatchId,
  ] = useState('')

  const [flagData, setFlagData] =
    useState({
      batchId: '',
      reason: '',
    })

  const [recallData, setRecallData] =
    useState({
      batchId: '',
      reason: '',
    })

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const handleStakeholderChange =
    (event) => {
      const { name, value } =
        event.target

      setStakeholder((previous) => ({
        ...previous,
        [name]: value,
      }))
    }

  const handleFlagChange =
    (event) => {
      const { name, value } =
        event.target

      setFlagData((previous) => ({
        ...previous,
        [name]: value,
      }))
    }

  const handleRecallChange =
    (event) => {
      const { name, value } =
        event.target

      setRecallData((previous) => ({
        ...previous,
        [name]: value,
      }))
    }

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

  const handleRegisterStakeholder =
    async (event) => {
      event.preventDefault()

      const success =
        await runTransaction(
          (contract) =>
            contract.registerStakeholder(
              stakeholder.address.trim(),
              Number(stakeholder.role)
            ),
          'Stakeholder approved successfully.'
        )

      if (success) {
        setStakeholder({
          address: '',
          role: '1',
        })
      }
    }

  const handleVerifyBatch =
    async (event) => {
      event.preventDefault()

      const currentBatchId =
        verifyBatchId.trim()

      const success =
        await runTransaction(
          (contract) =>
            contract.verifyBatch(
              currentBatchId
            ),
          `Batch ${currentBatchId} verified successfully.`
        )

      if (success) {
        setVerifyBatchId('')
      }
    }

  const handleFlagBatch =
    async (event) => {
      event.preventDefault()

      const currentBatchId =
        flagData.batchId.trim()

      const success =
        await runTransaction(
          (contract) =>
            contract.flagBatch(
              currentBatchId,
              flagData.reason.trim()
            ),
          `Batch ${currentBatchId} flagged successfully.`
        )

      if (success) {
        setFlagData({
          batchId: '',
          reason: '',
        })
      }
    }

  const handleRecallBatch =
    async (event) => {
      event.preventDefault()

      const currentBatchId =
        recallData.batchId.trim()

      const success =
        await runTransaction(
          (contract) =>
            contract.recallBatch(
              currentBatchId,
              recallData.reason.trim()
            ),
          `Batch ${currentBatchId} recalled successfully.`
        )

      if (success) {
        setRecallData({
          batchId: '',
          reason: '',
        })
      }
    }

  return (
    <section
      className="action-panel"
      id="regulator-panel"
    >
      <div className="panel-heading">
        <div>
          <span className="panel-label">
            Regulator
          </span>

          <h3>
            Regulatory Operations
          </h3>
        </div>

        <p>
          Authorize pharmaceutical
          supply-chain participants and
          manage verification, warnings,
          and recalls.
        </p>
      </div>

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

      <div className="regulator-grid">

        <form
          className="operation-card"
          onSubmit={
            handleRegisterStakeholder
          }
        >
          <h4>
            Approve Stakeholder
          </h4>

          <p>
            Register an authorized
            manufacturer, distributor,
            or pharmacy.
          </p>

          <label>
            Wallet Address

            <input
              type="text"
              name="address"
              value={
                stakeholder.address
              }
              onChange={
                handleStakeholderChange
              }
              placeholder="0x..."
              required
            />
          </label>

          <label>
            Stakeholder Role

            <select
              name="role"
              value={stakeholder.role}
              onChange={
                handleStakeholderChange
              }
            >
              <option value="1">
                Manufacturer
              </option>

              <option value="2">
                Distributor
              </option>

              <option value="3">
                Pharmacy
              </option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-action"
            disabled={loading}
          >
            Approve Stakeholder
          </button>
        </form>

        <form
          className="operation-card"
          onSubmit={handleVerifyBatch}
        >
          <h4>
            Verify Pharmaceutical Batch
          </h4>

          <p>
            Mark a registered and
            non-flagged batch as regulator
            verified.
          </p>

          <label>
            Batch ID

            <input
              type="text"
              value={verifyBatchId}
              onChange={(event) =>
                setVerifyBatchId(
                  event.target.value
                )
              }
              placeholder="MED-2026-001"
              required
            />
          </label>

          <div className="workflow-note">
            <strong>
              Regulatory Verification
            </strong>

            <span>
              Flagged or recalled batches
              cannot receive new
              verification.
            </span>
          </div>

          <button
            type="submit"
            className="primary-action"
            disabled={loading}
          >
            Verify Batch
          </button>
        </form>

        <form
          className="operation-card"
          onSubmit={handleFlagBatch}
        >
          <h4>
            Flag Suspicious Batch
          </h4>

          <label>
            Batch ID

            <input
              type="text"
              name="batchId"
              value={flagData.batchId}
              onChange={
                handleFlagChange
              }
              placeholder="MED-2026-002"
              required
            />
          </label>

          <label>
            Flag Reason

            <textarea
              name="reason"
              value={flagData.reason}
              onChange={
                handleFlagChange
              }
              placeholder="Suspicious certificate information"
              required
            />
          </label>

          <button
            type="submit"
            className="warning-action"
            disabled={loading}
          >
            Flag Batch
          </button>
        </form>

        <form
          className="operation-card"
          onSubmit={handleRecallBatch}
        >
          <h4>
            Recall Pharmaceutical Batch
          </h4>

          <label>
            Batch ID

            <input
              type="text"
              name="batchId"
              value={
                recallData.batchId
              }
              onChange={
                handleRecallChange
              }
              placeholder="MED-2026-002"
              required
            />
          </label>

          <label>
            Recall Reason

            <textarea
              name="reason"
              value={recallData.reason}
              onChange={
                handleRecallChange
              }
              placeholder="Quality control issue"
              required
            />
          </label>

          <button
            type="submit"
            className="danger-action"
            disabled={loading}
          >
            Recall Batch
          </button>
        </form>

      </div>
    </section>
  )
}

export default RegulatorPanel