import { Keypair } from "@solana/web3.js"
import bs58 from 'bs58'

const handleNewWallet = () => {
  const keypair = new Keypair()
  return {
    pubKey: keypair.publicKey.toBase58(),
    privKey: bs58.encode(keypair.secretKey)
  }
}

export {
  handleNewWallet
}