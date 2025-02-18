import { InlineKeyboard } from "grammy";
import { connection } from "../config";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getPubkey, newWallet, validateBundle } from "./utils";
import { SessionData } from "../config/contant";
import bs58 from 'bs58'

const startMessage = (username: string | undefined) => {
    const content = `Hello ${username ?? ''}, Welcome to clickcreate bot`
    const reply_markup = new InlineKeyboard()
        .text("Wallet", "handle_wallet")
        .row()
        .text("Pump.fun", "handle_pumpfun")
        .text("Meteora", "handle_meteora");

    return { content, reply_markup }
}

const walletMessage = async (pubkey: string | undefined) => {
    if (pubkey) {
        const balance = await connection.getBalance(new PublicKey(pubkey))
        const content = `Your wallet balance is ${balance / LAMPORTS_PER_SOL} SOL`
        const reply_markup = new InlineKeyboard()
            .text("Show private key", "handle_show_private_key")
        return { content, reply_markup }
    } else {
        const content = `You never set wallet. Please import your wallet`
        const reply_markup = new InlineKeyboard()
            .text("Import", "handle_import_wallet")
            .text("Cancel", "handle_delete_msg")
        return { content, reply_markup }
    }
}

const showPrivateKey = (privKey: string) => {
    const content = `This is your wallet private key ||${privKey}||`
    const reply_markup = new InlineKeyboard()
        .text("Close", "handle_delete_msg")
    return { content, reply_markup }
}

const importWallet = () => {
    const content = `Please input your wallet hex private key`
    const reply_markup = new InlineKeyboard()
        .text("Cancel", "handle_delete_msg")
    return { content, reply_markup }
}

const updateWallet = (privKey: string) => {
    const data = getPubkey(privKey)
    if (data.success) {
        const content = `Successfully imported. Your wallet is <code>${data.pubkey}</code>`
        const reply_markup = new InlineKeyboard()
            .text("Pump.fun", "handle_pumpfun")
            .text("Meteora", "handle_meteora");
        return { content, reply_markup, pubkey: data.pubkey }
    } else {
        const content = `Wallet import failed, bad private key. Try again`
        const reply_markup = new InlineKeyboard()
            .text("Cancel", "handle_delete_msg")
        return { content, pubkey: "", reply_markup }
    }
}

const pumpfunMessage = (session: SessionData) => {
    let content = `Pump Fun Bundler

Name: ${session.pumpfun.name ?? '-'}
Symbol: ${session.pumpfun.symbol ?? '-'}
Description: ${session.pumpfun.description ?? '-'}
Image: ${session.pumpfun.image ? 'Uploaded' : 'Not uploaded yet'}
Socials:
  - Website: ${session.pumpfun.website ?? '-'}
  - Twitter: ${session.pumpfun.twitter ?? '-'}
  - Telegram: ${session.pumpfun.telegram ?? '-'}
  - Discord: ${session.pumpfun.discord ?? '-'}
`

    if (session.pumpfun.subWallet.length) {
        content += `Sub Wallet List\n`
        session.pumpfun.subWallet.map((item, idx) => {
            const pubkey = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privkey))).publicKey.toBase58()
            content += `  No #${idx + 1}: Public Key <a href="https://solscan.io/account/${pubkey}">${pubkey.slice(0, 4)}...${pubkey.slice(-4)}</a> amount: ${item.amount} sol\n`
        })
    }

    const reply_markup = new InlineKeyboard()
        .text(" --- Metadata --- ", "_")
        .row()
        .text("Name", "handle_pumpfun_name")
        .text("Symbol", "handle_pumpfun_symbol")
        .text("Description", "handle_pumpfun_description")
        .text("Image", "handle_pumpfun_image")
        .row()
        .text(" --- Socials --- ", "_")
        .row()
        .text("Website", "handle_pumpfun_website")
        .text("Twitter", "handle_pumpfun_twitter")
        .text("Telegram", "handle_pumpfun_telegram")
        .text("Discord", "handle_pumpfun_discord")
        .row()
        .text(" --- Sub wallet --- ", "_")
        .row()
        .text("Set new sub wallet", "handle_add_sub_wallet")
        // .text("Remove sub wallet", "handle_remove_sub_wallet")
        .row()
        .text("Run Bundling Create and Buy Transaction", "handle_pump_bundle")

    return { content, reply_markup }
}

const pumpfunDetailMessage = (item: string) => {
    const content = `Please input ${item} data`
    const reply_markup = new InlineKeyboard()
        .text("Cancel", "handle_delete_msg")

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
            .text("Close", "handle_delete_msg")
        return { content, reply_markup, success: true }
    } else if (res.error) {
        const content = res.error
        const reply_markup = new InlineKeyboard()
            .text("Cancel", "handle_delete_msg")
    }
}

export {
    startMessage,
    walletMessage,
    showPrivateKey,
    importWallet,
    updateWallet,
    pumpfunMessage,
    pumpfunDetailMessage,
    showTempWallet,
    pumpBundleMessage,
}