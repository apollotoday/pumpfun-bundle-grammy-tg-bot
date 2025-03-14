import { PublicKey } from "@solana/web3.js"
import { treasuryFee } from '../config/env';

const COMMAND_LIST = [
    { command: "start", description: "Start the clickcreate bot" },
    { command: "wallet", description: "Manage your wallet" },
    { command: "sell", description: "Sell pumpfun token from your wallet" },
    { command: "pumpfun", description: "Bundle create token and buy tokens" },
]

interface SessionData {
    meteora: {
        baseMint: string | undefined
        quoteMint: string | undefined
        baseAmount: string | undefined
        quoteAmount: string | undefined
    },
    pumpfun: {
        name: string | undefined
        symbol: string | undefined
        image: string | undefined
        description: string | undefined
        website: string | undefined
        twitter: string | undefined
        telegram: string | undefined
        discord: string | undefined
        wallets: Array<{
            privKey: string
            amount: number
            default: boolean
        }>
    },
    wallet: Array<{
        pubKey: string
        privKey: string
        default: boolean
    }>,
    pumpsell: {
        mint: string
        privKey: string
        amount: number
    },
    batchSellMint: string
    tempWallet: string | undefined,
    action: 'meteora-baseMint'
    | 'meteora-quoteMint'
    | 'meteora-baseAmount'
    | 'meteora-quoteAmount'
    | 'wallet-import'
    | 'pumpfun-name'
    | 'pumpfun-symbol'
    | 'pumpfun-description'
    | 'pumpfun-image'
    | 'pumpfun-website'
    | 'pumpfun-twitter'
    | 'pumpfun-telegram'
    | 'pumpfun-discord'
    | 'pumpfun-sub-amount'
    | 'pumpsell-mint'
    | 'pumpsell-all-mint'
    | 'pumpsell-amount'
    | undefined
    currentMsg: number
}

const pumpfunActionType = {
    'handle_pumpfun_name': 'pumpfun-name',
    'handle_pumpfun_symbol': 'pumpfun-symbol',
    'handle_pumpfun_description': 'pumpfun-description',
    'handle_pumpfun_image': 'pumpfun-image',
    'handle_pumpfun_website': 'pumpfun-website',
    'handle_pumpfun_twitter': 'pumpfun-twitter',
    'handle_pumpfun_telegram': 'pumpfun-telegram',
    'handle_pumpfun_discord': 'pumpfun-discord',
    'handle_add_sub_wallet_amount': 'pumpfun-sub-amount',
} as const

const pumpfunSessionType = {
    'pumpfun-name': 'name',
    'pumpfun-symbol': 'symbol',
    'pumpfun-description': 'description',
    'pumpfun-image': 'image',
    'pumpfun-website': 'website',
    'pumpfun-twitter': 'twitter',
    'pumpfun-telegram': 'telegram',
    'pumpfun-discord': 'discord',
} as const

const initialSession = (): SessionData => ({
    meteora: {
        baseMint: undefined,
        quoteMint: undefined,
        baseAmount: undefined,
        quoteAmount: undefined
    },
    pumpfun: {
        name: undefined,
        symbol: undefined,
        image: undefined,
        description: undefined,
        website: undefined,
        twitter: undefined,
        telegram: undefined,
        discord: undefined,
        wallets: [],
    },
    pumpsell: {
        mint: '',
        privKey: '',
        amount: 0,
    },
    batchSellMint: '',
    wallet: [],
    action: undefined,
    tempWallet: undefined,
    currentMsg: 0
});

const subwalletFee = 0.0009
const mainwalletFee = 0.034 + treasuryFee

// web3
const systemProgram = new PublicKey('11111111111111111111111111111111')
const eventAuthority = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1')
const pumpFunProgram = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
const rentProgram = new PublicKey('SysvarRent111111111111111111111111111111111')
const pumpfunMintAuthority = new PublicKey('TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM')

enum commitmentType {
    Finalized = "finalized",
    Confirmed = "confirmed",
    Processed = "processed"
}

const JITO_FEE = 1_000_000

export {
    JITO_FEE,
    COMMAND_LIST,
    initialSession,
    SessionData,
    pumpfunActionType,
    pumpfunSessionType,
    subwalletFee,
    mainwalletFee,
    systemProgram,
    eventAuthority,
    pumpFunProgram,
    rentProgram,
    pumpfunMintAuthority,
    commitmentType
}
