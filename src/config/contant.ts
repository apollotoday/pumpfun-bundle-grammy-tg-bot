import { Context } from "grammy";

const COMMAND_LIST = [
    { command: "start", description: "Start the clickcreate bot" },
    { command: "pumpfun", description: "Bundle create token and buy tokens" },
    { command: "meteora", description: "Create meteora pool" },
]

interface BOT_CONTEXT extends Context {
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
    },
    wallet: {
        pubKey: string | undefined
        privKey: string | undefined
    },
    action: 'meteora-baseMint' | 'meteora-quoteMint' | 'meteora-baseAmount' | 'meteora-quoteAmount' | 'wallet-import' | undefined
}

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
    },
    wallet: {
        pubKey: string | undefined
        privKey: string | undefined
    },
    action: 'meteora-baseMint' | 'meteora-quoteMint' | 'meteora-baseAmount' | 'meteora-quoteAmount' | 'wallet-import' | undefined
}

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
        discord: undefined
    },
    wallet: {
        pubKey: undefined,
        privKey: undefined
    },
    action: undefined

});

export { COMMAND_LIST, BOT_CONTEXT, initialSession, SessionData }

// 4R8XEFbFaCWGhXb5fPjUJEW3rg8581DZNLCzG3pCJQQoTxPiBCtzygkN4c3p3wmhC2JG4b5sNHABqMC6wVBwco1r