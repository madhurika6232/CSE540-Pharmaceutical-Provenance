import {
  BrowserProvider,
  Contract,
} from 'ethers'

import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
} from './contractConfig'

const AMOY_CHAIN_ID = 80002n

export async function getWriteContract() {
  if (!window.ethereum) {
    throw new Error(
      'MetaMask is not installed.'
    )
  }

  const provider =
    new BrowserProvider(window.ethereum)

  const network =
    await provider.getNetwork()

  if (network.chainId !== AMOY_CHAIN_ID) {
    throw new Error(
      'Please switch MetaMask to Polygon Amoy Testnet.'
    )
  }

  const accounts = await provider.send(
    'eth_requestAccounts',
    []
  )

  if (!accounts.length) {
    throw new Error(
      'No MetaMask account is connected.'
    )
  }

  const signer =
    await provider.getSigner()

  const contract =
    new Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    )

  return {
    provider,
    signer,
    contract,
  }
}

export function getTransactionError(error) {
  console.error(error)

  if (error?.code === 4001) {
    return 'Transaction rejected in MetaMask.'
  }

  if (error?.code === 'ACTION_REJECTED') {
    return 'Transaction rejected in MetaMask.'
  }

  if (error?.revert?.args?.[0]) {
    return error.revert.args[0]
  }

  if (error?.reason) {
    return error.reason
  }

  if (error?.shortMessage) {
    return error.shortMessage
  }

  if (error?.message) {
    const match =
      error.message.match(
        /reason="([^"]+)"/
      )

    if (match?.[1]) {
      return match[1]
    }
  }

  return 'Blockchain transaction failed.'
}