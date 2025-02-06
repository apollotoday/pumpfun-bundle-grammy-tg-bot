import { Keypair } from "@solana/web3.js"
import bs58 from 'bs58'

const newWallet = () => {
    const keypair = new Keypair()
    return {
        pubkey: keypair.publicKey.toBase58(),
        privkey: bs58.encode(keypair.secretKey)
    }
}

const getPubkey = (privKey: string) => {
    try {
        const keypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privKey)))
        return { success: true, pubkey: keypair.publicKey.toBase58() }
    } catch (err) {
        return { success: false, pubkey: '' }
    }
}

export {
    newWallet,
    getPubkey
}