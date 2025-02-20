import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js"
import bs58 from 'bs58'
import { mainwalletFee, SessionData, subwalletFee } from "../config/contant"
import { connection, pumpFunSDK } from "../config"
import { CreateTokenMetadata } from "../web3/pump/utils/types"
import axios from "axios"

const importNewWallet = (privKey: string) => {
    try {
        const keypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privKey)))
        return keypair.publicKey.toBase58()
    } catch (err) {
        return ''
    }
}

const validateBundle = async (session: SessionData): Promise<{ success: false, error: string } | { success: true }> => {
    if (!session.wallet.some((item) => item.default === true)) return { success: false, error: 'You never set main wallet' }
    if (!session.pumpfun.name) return { success: false, error: 'You never set token name' }
    if (!session.pumpfun.symbol) return { success: false, error: 'You never set token symbol' }
    if (!session.pumpfun.description) return { success: false, error: 'You never set token description' }
    if (!session.pumpfun.image) return { success: false, error: 'You never set token image' }
    // if (session.pumpfun.subWallet.length == 0) return { success: false, error: 'You never set no sub wallets' }
    if (session.pumpfun.wallets.length > 20) return { success: false, error: 'You have too many sub wallets' }
    if (duplicateCheck(session.pumpfun.wallets)) return { success: false, error: 'You have duplicatd sub wallet' }

    const mainPrivkey = session.wallet.find((item) => item.default === true)
    const mainKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(mainPrivkey?.privKey!)))
    const mainBalance = await connection.getBalance(mainKeypair.publicKey) / LAMPORTS_PER_SOL
    let additionalMainFee = 0

    for (const [idx, walletInfo] of session.pumpfun.wallets.entries()) {
        const wallet = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(walletInfo.privKey)))
        const balance = await connection.getBalance(wallet.publicKey) / LAMPORTS_PER_SOL
        if (wallet.publicKey.toBase58() == mainKeypair.publicKey.toBase58()) additionalMainFee = walletInfo.amount
        if (balance <= walletInfo.amount + subwalletFee) return { success: false, error: `Wallet #${idx + 1} has insufficient balance` }
    }

    if (mainBalance <= mainwalletFee + additionalMainFee) return { success: false, error: `Main wallet has insufficient balance` }

    return { success: true }
}

const duplicateCheck = (subWallet: Array<{
    privKey: string
    amount: number
    default: boolean
}>) => {
    const keyArray = subWallet.map((item) => {
        return item.privKey
    })

    return new Set(keyArray).size != keyArray.length;
}

const createAndBundleTx = async (session: SessionData) => {
    const mainWallet = session.wallet.find((item) => item.default === true)
    const creator = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(mainWallet?.privKey!)))
    console.log(1)
    const buyers: Array<Keypair> = []
    const buyAmountSol: Array<bigint> = []
    
    const pumpfunData = session.pumpfun
    
    console.log(1)
    pumpfunData.wallets.map((item) => {
        buyers.push(Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privKey))))
        buyAmountSol.push(BigInt(Math.round(item.amount * LAMPORTS_PER_SOL)))
    })
    
    const response = await axios.get(pumpfunData.image!, {
        responseType: 'arraybuffer',
    });
    const file = new Blob([response.data], { type: response.headers['content-type'] });
    
    console.log(file)
    console.log(1)
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
    console.log(1)
    
    const mint = Keypair.generate()
    console.log('mint', mint.publicKey.toBase58())
    const mintResult = await pumpFunSDK.createAndBatchBuy(creator, buyers, buyAmountSol, createTokenMetadata, mint)
    console.log(mintResult)
    return mintResult
}

export {
    // newWallet,
    importNewWallet,
    validateBundle,
    createAndBundleTx
}