import { useState } from 'react'

import {
  getTransactionError,
  getWriteContract,
} from '../contract/contractService'

function ManufacturerPanel() {
  const [batchData, setBatchData] =
    useState({
      batchId: '',
      drugName: '',
      manufactureDate: '',
      expirationDate: '',
      certificateHash: '',
    })

  const [transferData, setTransferData] =
    useState({
      batchId: '',
      distributorAddress: '',
    })

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const [loading, setLoading] =
    useState(false)

  const handleBatchChange = (event) => {
    const { name, value } =
      event.target

    setBatchData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleTransferChange =
    (event) => {
      const { name, value } =
        event.target

      setTransferData((previous) => ({
        ...previous,
        [name]: value,
      }))
    }

  const handleRegisterBatch =
    async (event) => {
      event.preventDefault()

      setMessage('')
      setError('')
      setLoading(true)

      try {
        const manufactureTimestamp =
          Math.floor(
            new Date(
              `${batchData.manufactureDate}T00:00:00Z`
            ).getTime() / 1000
          )

        const expirationTimestamp =
          Math.floor(
            new Date(
              `${batchData.expirationDate}T00:00:00Z`
            ).getTime() / 1000
          )

        if (
          expirationTimestamp <=
          manufactureTimestamp
        ) {
          throw new Error(
            'Expiration date must be after manufacture date.'
          )
        }

        const { contract } =
          await getWriteContract()

        const transaction =
          await contract.registerBatch(
            batchData.batchId.trim(),
            batchData.drugName.trim(),
            manufactureTimestamp,
            expirationTimestamp,
            batchData.certificateHash.trim()
          )

        setMessage(
          'Transaction submitted. Waiting for confirmation...'
        )

        await transaction.wait()

        setMessage(
          `Batch ${batchData.batchId} registered successfully on Polygon Amoy.`
        )

        setBatchData({
          batchId: '',
          drugName: '',
          manufactureDate: '',
          expirationDate: '',
          certificateHash: '',
        })
      } catch (err) {
        setError(
          getTransactionError(err)
        )
      } finally {
        setLoading(false)
      }
    }

  const handleTransferBatch =
    async (event) => {
      event.preventDefault()

      setMessage('')
      setError('')
      setLoading(true)

      try {
        const { contract } =
          await getWriteContract()

        const transaction =
          await contract.transferCustody(
            transferData.batchId.trim(),
            transferData.distributorAddress.trim()
          )

        setMessage(
          'Custody transfer submitted. Waiting for confirmation...'
        )

        await transaction.wait()

        setMessage(
          `Batch ${transferData.batchId} transferred to the distributor successfully.`
        )

        setTransferData({
          batchId: '',
          distributorAddress: '',
        })
      } catch (err) {
        setError(
          getTransactionError(err)
        )
      } finally {
        setLoading(false)
      }
    }

  return (
    <section
      className="action-panel"
      id="manufacturer-panel"
    >
      <div className="panel-heading">
        <div>
          <span className="panel-label">
            Manufacturer
          </span>

          <h3>
            Manufacturer Operations
          </h3>
        </div>

        <p>
          Register pharmaceutical batches
          and transfer custody to an
          authorized distributor.
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

      <div className="panel-grid">

        <form
          className="operation-card"
          onSubmit={handleRegisterBatch}
        >
          <h4>
            Register Pharmaceutical Batch
          </h4>

          <p>
            Create the initial blockchain
            record for a new pharmaceutical
            batch.
          </p>

          <label>
            Batch ID

            <input
              type="text"
              name="batchId"
              value={batchData.batchId}
              onChange={handleBatchChange}
              placeholder="MED-2026-001"
              required
            />
          </label>

          <label>
            Drug Name

            <input
              type="text"
              name="drugName"
              value={batchData.drugName}
              onChange={handleBatchChange}
              placeholder="Amoxicillin 500mg"
              required
            />
          </label>

          <div className="form-row">
            <label>
              Manufacture Date

              <input
                type="date"
                name="manufactureDate"
                value={
                  batchData.manufactureDate
                }
                onChange={
                  handleBatchChange
                }
                required
              />
            </label>

            <label>
              Expiration Date

              <input
                type="date"
                name="expirationDate"
                value={
                  batchData.expirationDate
                }
                onChange={
                  handleBatchChange
                }
                required
              />
            </label>
          </div>

          <label>
            Certificate Hash / IPFS
            Reference

            <input
              type="text"
              name="certificateHash"
              value={
                batchData.certificateHash
              }
              onChange={
                handleBatchChange
              }
              placeholder="Qm... or certificate reference"
            />
          </label>

          <button
            type="submit"
            className="primary-action"
            disabled={loading}
          >
            {loading
              ? 'Processing...'
              : 'Register Batch'}
          </button>
        </form>

        <form
          className="operation-card"
          onSubmit={handleTransferBatch}
        >
          <h4>
            Transfer to Distributor
          </h4>

          <p>
            Transfer custody of a
            manufactured batch to an
            authorized distributor.
          </p>

          <label>
            Batch ID

            <input
              type="text"
              name="batchId"
              value={
                transferData.batchId
              }
              onChange={
                handleTransferChange
              }
              placeholder="MED-2026-001"
              required
            />
          </label>

          <label>
            Distributor Wallet Address

            <input
              type="text"
              name="distributorAddress"
              value={
                transferData.distributorAddress
              }
              onChange={
                handleTransferChange
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
              Manufacturer → Distributor
            </span>
          </div>

          <button
            type="submit"
            className="primary-action"
            disabled={loading}
          >
            {loading
              ? 'Processing...'
              : 'Transfer Custody'}
          </button>
        </form>

      </div>
    </section>
  )
}

export default ManufacturerPanel