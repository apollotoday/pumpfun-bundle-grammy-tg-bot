import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import bs58 from 'bs58'
import { mainwalletFee, SessionData, subwalletFee } from "../config/contant"
import { connection, pumpFunSDK } from "../config"
import { CreateTokenMetadata } from "../web3/pump/utils/types"
import axios from "axios"

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

const validateBundle = async (session: SessionData): Promise<{ success: false, error: string } | { success: true }> => {
    if (!session.wallet.privKey) return { success: false, error: 'You never set main wallet' }
    if (!session.pumpfun.name) return { success: false, error: 'You never set token name' }
    if (!session.pumpfun.symbol) return { success: false, error: 'You never set token symbol' }
    if (!session.pumpfun.description) return { success: false, error: 'You never set token description' }
    if (!session.pumpfun.image) return { success: false, error: 'You never set token image' }
    if (session.pumpfun.subWallet.length == 0) return { success: false, error: 'You never set no sub wallets' }
    if (session.pumpfun.subWallet.length > 20) return { success: false, error: 'You have too many sub wallets' }
    if (duplicateCheck(session.pumpfun.subWallet)) return { success: false, error: 'You have duplicatd sub wallet' }

    const mainKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(session.wallet.privKey)))
    const mainBalance = await connection.getBalance(mainKeypair.publicKey) / LAMPORTS_PER_SOL
    let additionalMainFee = 0

    for (const [idx, walletInfo] of session.pumpfun.subWallet.entries()) {
        const wallet = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(walletInfo.privkey)))
        const balance = await connection.getBalance(wallet.publicKey) / LAMPORTS_PER_SOL
        if (wallet.publicKey.toBase58() == mainKeypair.publicKey.toBase58()) additionalMainFee = balance
        if (balance <= walletInfo.amount + subwalletFee) return { success: false, error: `Wallet #${idx + 1} has insufficient balance` }
    }

    if (mainBalance <= mainwalletFee + additionalMainFee) return { success: false, error: `Main wallet has insufficient balance` }

    return { success: true }
}

const duplicateCheck = (subWallet: Array<{
    privkey: string;
    amount: number;
}>) => {
    const keyArray = subWallet.map((item: { privkey: string; amount: number; }) => {
        return item.privkey
    })

    return new Set(keyArray).size != keyArray.length;
}

const createAndBundleTx = async (session: SessionData) => {
    const creator = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(session.wallet.privKey!)))

    const buyers: Array<Keypair> = []
    const buyAmountSol: Array<bigint> = []

    const pumpfunData = session.pumpfun

    pumpfunData.subWallet.map((item) => {
        buyers.push(Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privkey))))
        buyAmountSol.push(BigInt(item.amount * LAMPORTS_PER_SOL))
    })

    const response = await axios.get(pumpfunData.image!, {
        responseType: 'arraybuffer',
    });
    const file = new Blob([response.data], { type: response.headers['content-type'] });

    const createTokenMetadata: CreateTokenMetadata = {
        name: pumpfunData.name!,
        symbol: pumpfunData.symbol!,
        description: pumpfunData.description!,
        file,
        ...(pumpfunData.website && { website: pumpfunData.website }),
        ...(pumpfunData.twitter && { twitter: pumpfunData.twitter }),
        ...(pumpfunData.telegram && { telegram: pumpfunData.telegram }),
        ...(pumpfunData.discord && { discord: pumpfunData.discord }),
    }

    const mint = Keypair.generate()
    const mintResult = await pumpFunSDK.createAndBatchBuy(creator, buyers, buyAmountSol, createTokenMetadata, mint)
    console.log(mintResult)
    return mintResult
}

export {
    newWallet,
    getPubkey,
    validateBundle,
    createAndBundleTx
}