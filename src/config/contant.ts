import { Context } from "grammy";

const COMMAND_LIST = [
    { command: "start", description: "Start the clickcreate bot" },
    { command: "wallet", description: "Manage your wallet" },
    { command: "pumpfun", description: "Bundle create token and buy tokens" },
    { command: "meteora", description: "Create meteora pool" },
]

// interface BOT_CONTEXT extends Context {
//     meteora: {
//         baseMint: string | undefined
//         quoteMint: string | undefined
//         baseAmount: string | undefined
//         quoteAmount: string | undefined
//     },
//     pumpfun: {
//         name: string | undefined
//         symbol: string | undefined
//         image: string | undefined
//         description: string | undefined
//         website: string | undefined
//         twitter: string | undefined
//         telegram: string | undefined
//         discord: string | undefined
//     },
//     wallet: {
//         pubKey: string | undefined
//         privKey: string | undefined
//     },
//     action: 'meteora-basemint' | 'meteora-quotemint' | 'meteora-baseAmount' | 'meteora-quoteAmount' | 'wallet-import' | undefined
// }

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
        subWallet: Array<{ privkey: string, amount: number }>
    },
    wallet: {
        pubKey: string | undefined
        privKey: string | undefined
    },
    tempWallet: {
        privkey: string, amount: number
    }
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
        subWallet: []
    },
    wallet: {
        pubKey: undefined,
        privKey: undefined
    },
    tempWallet: { privkey: '', amount: 0 },
    action: undefined

});

const subwalletFee = 0
const mainwalletFee = 0.003
export { COMMAND_LIST, initialSession, SessionData, pumpfunActionType, pumpfunSessionType, subwalletFee, mainwalletFee }

// 4R8XEFbFaCWGhXb5fPjUJEW3rg8581DZNLCzG3pCJQQoTxPiBCtzygkN4c3p3wmhC2JG4b5sNHABqMC6wVBwco1r

// rLRfVRaJsqTpN74UH7WCyjxGU95UUnUoDFb5FYLw5LpnPa6PTUnPixnGjV5k2CudcZdJ2SjvxNwbym2HPpqU8qv

// 2RSmZWJaB1YRVt1rGkqDDmPqESPNxpUezVK4s59UWsa5jg1MdgUUkxEgHhwShvy4rw4XarGYPfTqWzFsySWqGbeY