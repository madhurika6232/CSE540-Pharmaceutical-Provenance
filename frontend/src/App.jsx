import { useState } from 'react'
import { BrowserProvider } from 'ethers'

import BatchVerification from './components/BatchVerification'
import ManufacturerPanel from './components/ManufacturerPanel'
import RegulatorPanel from './components/RegulatorPanel'
import SupplyChainPanels from './components/SupplyChainPanels'

import './App.css'

function App() {
  const [walletAddress, setWalletAddress] = useState('')
  const [networkName, setNetworkName] = useState('')
  const [error, setError] = useState('')

  const connectWallet = async () => {
    try {
      setError('')

      if (!window.ethereum) {
        setError('MetaMask is not installed.')
        return
      }

      const provider = new BrowserProvider(window.ethereum)

      await provider.send('eth_requestAccounts', [])

      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      const network = await provider.getNetwork()

      setWalletAddress(address)

      if (network.chainId === 80002n) {
        setNetworkName('Polygon Amoy Testnet')
      } else {
        setNetworkName(
          `Wrong Network (${network.chainId.toString()})`
        )
      }
    } catch (err) {
      console.error(err)
      setError('Unable to connect to MetaMask.')
    }
  }

  return (
    <div className="app">

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <header className="navbar">

        <div>
          <h1>PharmaTrace</h1>
          <p>Blockchain Pharmaceutical Provenance</p>
        </div>

        <div className="wallet-area">

          <button
            className="wallet-button"
            onClick={connectWallet}
          >
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : 'Connect MetaMask'}
          </button>

          {walletAddress && (
            <span className="wallet-network">
              {networkName}
            </span>
          )}

        </div>

      </header>

      {/* =====================================================
          WALLET ERROR
      ====================================================== */}

      {error && (
        <div className="wallet-error">
          {error}
        </div>
      )}

      <main className="container">

        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="hero">

          <span className="network-badge">
            Polygon Amoy Testnet
          </span>

          <h2>
            Pharmaceutical Drug Provenance &amp;
            Anti-Counterfeit System
          </h2>

          <p>
            Track pharmaceutical batches across manufacturers,
            distributors, pharmacies, and regulators using
            blockchain technology.
          </p>

        </section>

        {/* ===================================================
            CONSUMER VERIFICATION
        ==================================================== */}

        <BatchVerification />

        {/* ===================================================
            ROLE OVERVIEW
        ==================================================== */}

        <section className="role-section">

          <h3>Supply Chain Operations</h3>

          <div className="role-grid">

            {/* Administrator */}

            <div className="role-card">

              <h4>Administrator</h4>

              <p>
                Appoint authorized pharmaceutical regulators.
              </p>

              <button>
                Manage Regulators
              </button>

            </div>

            {/* Regulator */}

            <div className="role-card">

              <h4>Regulator</h4>

              <p>
                Approve stakeholders, verify batches,
                flag suspicious products, and issue recalls.
              </p>

              <button>
                Regulatory Actions
              </button>

            </div>

            {/* Manufacturer */}

            <div className="role-card">

              <h4>Manufacturer</h4>

              <p>
                Register pharmaceutical batches and transfer
                them to authorized distributors.
              </p>

              <button>
                Manufacturer Actions
              </button>

            </div>

            {/* Distributor */}

            <div className="role-card">

              <h4>Distributor</h4>

              <p>
                Transfer pharmaceutical batches to authorized
                pharmacies.
              </p>

              <button>
                Distributor Actions
              </button>

            </div>

            {/* Pharmacy */}

            <div className="role-card">

              <h4>Pharmacy</h4>

              <p>
                Record pharmacy receipt and final dispensing
                of a pharmaceutical batch.
              </p>

              <button>
                Pharmacy Actions
              </button>

            </div>

            {/* Consumer */}

            <div className="role-card consumer">

              <h4>Consumer Verification</h4>

              <p>
                Review provenance and regulatory status
                without requiring a blockchain account.
              </p>

              <button>
                Search Provenance
              </button>

            </div>

          </div>

        </section>

        {/* ===================================================
            ADMIN / DISTRIBUTOR / PHARMACY OPERATIONS
        ==================================================== */}

        <SupplyChainPanels />

        {/* ===================================================
            MANUFACTURER OPERATIONS
        ==================================================== */}

        <ManufacturerPanel />

        {/* ===================================================
            REGULATOR OPERATIONS
        ==================================================== */}

        <RegulatorPanel />

      </main>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer>
        CSE 540 — Engineering Blockchain Applications |
        Project Group 1
      </footer>

    </div>
  )
}

export default App