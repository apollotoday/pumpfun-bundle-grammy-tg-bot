import { InlineKeyboard } from "grammy";
import { connection } from "../config";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { validateBundle } from "./utils";
import { SessionData } from "../config/contant";
import bs58 from 'bs58'

const startMessage = (username: string | undefined) => {
    const content = `Hello ${username ?? ''}, Welcome to clickcreate bot`
    const reply_markup = new InlineKeyboard()
        .text("💳 Wallet", "handle_wallet")
        .row()
        .text("💊 Pump.fun", "handle_pumpfun")
    // .text("Meteora", "handle_meteora");

    return { content, reply_markup }
}

const walletMessage = async (session: SessionData) => {
    const content = `Your wallet list`
    const reply_markup = new InlineKeyboard()

    if (session.wallet.length) {
        reply_markup
            .text("Wallet")
            .text("Default")
            .text("Show Key")
            .text("Remove")
            .row()
    } else {
        reply_markup
            .text('No wallet found')
            .row()
    }
    session.wallet.map((item, idx) => {
        if (item.pubKey && item.privKey) {
            reply_markup
                .url(`${item.pubKey.slice(0, 5)}...`, `https://solscan.io/account/${item.pubKey}`)
                .text(`${item.default ? `🔵` : `⚫`}`, `handle_default_wallet_${idx}`)
                .text(`🔐`, `handle_show_wallet_${idx}`)
                .text(`⛔`, `handle_delete_wallet_${idx}`)
                .row()
        }
    })

    reply_markup
        .text("➕ Add new wallet", "handle_add_wallet")
        .text("🗝️ Import new wallet", "handle_import_wallet")

    return { content, reply_markup }
}

const showPrivateKey = (privKey: string) => {
    const content = `This is wallet private key ||${privKey}||`
    const reply_markup = new InlineKeyboard()
        .text("❌ Close", "handle_delete_msg")
    return { content, reply_markup }
}

const importWallet = () => {
    const content = `Please input your wallet private key`
    const reply_markup = new InlineKeyboard()
        .text("🚫 Cancel", "handle_delete_msg")
    return { content, reply_markup }
}

const InvalidSecurityKey = () => {
    const content = `You input invalid private key, please input other correct one`
    const reply_markup = new InlineKeyboard()
        .text("🗝️ Import new wallet", "handle_import_wallet")
        .text("🚫 Cancel", "handle_delete_msg")
    return { content, reply_markup }
}

const pumpfunMessage = (session: SessionData) => {
    let content = `💊 Pump Fun Bundler ⚙️

Name: ${session.pumpfun.name ?? '-'}
Symbol: ${session.pumpfun.symbol ?? '-'}
Description: ${session.pumpfun.description ?? '-'}
Image: ${session.pumpfun.image ? 'Uploaded' : 'Not uploaded yet'}
Amount: ${session.pumpfun.amount > 0 ? `${session.pumpfun.amount} SOL` : '-'}
Socials:
  - Website: ${session.pumpfun.website ?? '-'}
  - Twitter: ${session.pumpfun.twitter ?? '-'}
  - Telegram: ${session.pumpfun.telegram ?? '-'}
  - Discord: ${session.pumpfun.discord ?? '-'}
`

    const reply_markup = new InlineKeyboard()
        .text(" --- Metadata --- ")
        .row()
        .text("✏️ Name", "handle_pumpfun_name")
        .text("✏️ Symbol", "handle_pumpfun_symbol")
        .text("✏️ Description", "handle_pumpfun_description")
        .text("✏️ Image", "handle_pumpfun_image")
        .row()
        .text(" --- Socials --- ")
        .row()
        .text("✏️ Website", "handle_pumpfun_website")
        .text("✏️ Twitter", "handle_pumpfun_twitter")
        .text("✏️ Telegram", "handle_pumpfun_telegram")
        .text("✏️ Discord", "handle_pumpfun_discord")
        .row()
        .text("✏️ Set Buy Amount", "handle_pump_buy_amount")
        .row()
        .text("🚀 Run Bundling Create and Buy Transaction", "handle_pump_bundle")

    return { content, reply_markup }
}

const pumpfunDetailMessage = (item: string) => {
    const content = `Please input ${item} data`
    const reply_markup = new InlineKeyboard()
        .text("🚫 Cancel", "handle_delete_msg")

    return { content, reply_markup }
}

const pumpSubWalletAmountMsg = () => {
    const content = `Please input sol amount to buy`
    const reply_markup = new InlineKeyboard()
        .text("🚫 Cancel", "handle_delete_msg")
    return { content, reply_markup }
}

const showTempWallet = (privkey: string, amount: number) => {
    if (privkey) {
        try {
            if (amount) {
                const content = `Current new wallet address is ${Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privkey))).publicKey.toBase58()}, amount is ${amount} sol`
                const reply_markup = new InlineKeyboard()
                    .text("Set new private key", "handle_add_sub_wallet_key")
                    .text("Set new amount", "handle_add_sub_wallet_amount")
                    .row()
                    .text("Register", "handle_register_temp_wallet")

                return { content, reply_markup }
            } else {
                const content = `Current new wallet address is ${Keypair.fromSecretKey(Uint8Array.from(bs58.decode(privkey))).publicKey.toBase58()}, please set amount to buy`
                const reply_markup = new InlineKeyboard()
                    .text("Set new private key", "handle_add_sub_wallet_key")
                    .text("Set amount", "handle_add_sub_wallet_amount")

                return { content, reply_markup }
            }
        } catch (e) {
            const content = `Invalid private key, please input new private key`
            const reply_markup = new InlineKeyboard()
                .text("Set new amount", "handle_add_sub_wallet_amount")
            return { content, reply_markup }
        }
    } else {
        const content = `Current buy amount is ${amount} sol, please input private key to set wallet`
        const reply_markup = new InlineKeyboard()
            .text("Set private key", "handle_add_sub_wallet_key")
            .text("Set new amount", "handle_add_sub_wallet_amount")

        return { content, reply_markup }
    }
}

const pumpBundleMessage = async (session: SessionData) => {
    const res = await validateBundle(session)
    if (res.success) {
        const content = 'Bundling now...'
        const reply_markup = new InlineKeyboard()
            .text("🚫 Close", "handle_delete_msg")
        return { content, reply_markup, success: true }
    } else if (res.error) {
        const content = res.error
        const reply_markup = new InlineKeyboard()
            .text("🚫 Cancel", "handle_delete_msg")
    }
}



export {
    startMessage,
    walletMessage,
    showPrivateKey,
    importWallet,
    pumpfunMessage,
    pumpfunDetailMessage,
    showTempWallet,
    pumpBundleMessage,
    InvalidSecurityKey,
    pumpSubWalletAmountMsg,
}