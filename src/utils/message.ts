import { CommandContext, InlineKeyboard } from "grammy";
import { BOT_CONTEXT, connection } from "../config";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { getPubkey, newWallet } from "./utils";

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
        return { content, reply_markup }
    }
}

const showPrivateKey = (privKey: string) => {
    const content = `This is your wallet private key ||${privKey}||`
    const reply_markup = new InlineKeyboard()
        .text("Close", "handle_delete_msg")
    return { content, reply_markup }
}

const createWallet = () => {
    const { pubkey, privkey } = newWallet()
    const content = `You have created new wallet: ${pubkey}`
    const reply_markup = new InlineKeyboard()
        .text("Close", "handle_delete_msg")
    return { content, reply_markup, pubkey, privkey }
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
        return { content, reply_markup: undefined, pubkey: data.pubkey }
    } else {
        const content = `Wallet import failed, bad private key. Try again`
        const reply_markup = new InlineKeyboard()
            .text("Cancel", "handle_delete_msg")
        return { content, pubkey: "", reply_markup }
    }
}

export {
    startMessage,
    walletMessage,
    showPrivateKey,
    importWallet,
    updateWallet
}