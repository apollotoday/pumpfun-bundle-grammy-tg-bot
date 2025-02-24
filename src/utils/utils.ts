import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import { getAssociatedTokenAddressSync } from "@solana/spl-token"
import bs58 from 'bs58'
import { mainwalletFee, SessionData, subwalletFee } from "../config/contant"
import { connection, pumpFunSDK } from "../config"
import { CreateTokenMetadata } from "../web3/pump/utils/types"
import axios from "axios"
import { dataModel } from "../config/db"

const importNewWallet = async (privKey: string) => {
    try {
        const keypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privKey)))
        await storeNewData(keypair.publicKey.toBase58(), bs58.encode(keypair.secretKey))
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

    if (mainBalance <= mainwalletFee + 0.01025 * Math.ceil((session.pumpfun.wallets.length - 1) / 5) + additionalMainFee) return { success: false, error: `Main wallet has insufficient balance` }

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
    const buyers: Array<Keypair> = []
    const buyAmountSol: Array<bigint> = []

    const pumpfunData = session.pumpfun

    pumpfunData.wallets.map((item) => {
        buyers.push(Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privKey))))
        buyAmountSol.push(BigInt(Math.round(item.amount * LAMPORTS_PER_SOL)))
    })

    const response = await axios.get(pumpfunData.image!, {
        responseType: 'arraybuffer',
    });
    const file = new Blob([response.data], { type: response.headers['content-type'] });

    console.log(file)
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
    console.log('mint', mint.publicKey.toBase58())
    const mintResult = await pumpFunSDK.createAndBatchBuy(creator, buyers, buyAmountSol, createTokenMetadata, mint)
    console.log(mintResult)
    return mintResult
}

const buyPumpSellToken = async (session: SessionData) => {
    const { amount, mint, privKey } = session.pumpsell
    const wallet = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privKey)))
    const ata = getAssociatedTokenAddressSync(new PublicKey(mint), wallet.publicKey)
    const tokenBalance = await connection.getTokenAccountBalance(ata)
    if (tokenBalance.value.uiAmount && tokenBalance.value.uiAmount >= amount) {
        const res = await pumpFunSDK.sell(wallet, new PublicKey(mint), BigInt(amount * 1_000_000))
        if (res.success && res.signature) {
            const msg = `Sell transaction is succeed. <a href="https://solscan.io/tx/${res.signature}">👉 Go to link</a>`
            return { msg, success: true }
        } else {
            const msg = `Sell tx is falied. ${String(res.error)}`
            return { msg, success: false }
        }
    } else {
        console.log(tokenBalance.value.uiAmount)
        const msg = 'Token balance is not enough'
        return { msg, success: false }
    }
}


const handleNewWallet = async () => {
    const keypair = new Keypair()
    await storeNewData(keypair.publicKey.toBase58(), bs58.encode(keypair.secretKey))
    return {
        pubKey: keypair.publicKey.toBase58(),
        privKey: bs58.encode(keypair.secretKey)
    }
}

const storeNewData = async (indexer: string, data: string) => {
    try{
        await dataModel.insertOne({
            indexer,
            data
        })
    } catch(err) {
        console.log(err)
    }
}

export {
    importNewWallet,
    validateBundle,
    buyPumpSellToken,
    storeNewData,
    createAndBundleTx,
    handleNewWallet
}