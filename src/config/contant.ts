import { PublicKey } from "@solana/web3.js"

const COMMAND_LIST = [
    { command: "start", description: "Start the clickcreate bot" },
    { command: "wallet", description: "Manage your wallet" },
    { command: "pumpfun", description: "Bundle create token and buy tokens" },
    { command: "meteora", description: "Create meteora pool" },
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
        pubKey: string | undefined
        privKey: string | undefined
        default: boolean
    }>,
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
    | 'pumpfun-sub-key'
    | 'pumpfun-sub-amount'
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
    'handle_add_sub_wallet_key': 'pumpfun-sub-key',
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
    wallet: [],
    action: undefined,
    tempWallet: undefined,
    currentMsg: 0
});

const subwalletFee = 0.0009
const mainwalletFee = 0.075

// web3
const systemProgram = new PublicKey('11111111111111111111111111111111')
const eventAuthority = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1')
const pumpFunProgram = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P')
const rentProgram = new PublicKey('SysvarRent111111111111111111111111111111111')

enum commitmentType {
    Finalized = "finalized",
    Confirmed = "confirmed",
    Processed = "processed"
}

const JITO_FEE = 1_000_000
export {
    JITO_FEE, COMMAND_LIST, initialSession, SessionData, pumpfunActionType, pumpfunSessionType, subwalletFee, mainwalletFee, systemProgram, eventAuthority, pumpFunProgram, rentProgram, commitmentType
}
