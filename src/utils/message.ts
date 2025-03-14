import { InlineKeyboard } from "grammy";
import { getAssociatedTokenAddressSync, MintLayout } from "@solana/spl-token";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { validateBundle } from "./utils";
import { pumpfunMintAuthority, SessionData } from "../config/contant";
import bs58 from 'bs58'
import { connection } from "../config/env";

const startMessage = (username: string | undefined) => {
    const content = `Hello ${username ?? ''}, Welcome to Click Create Bot`
    const reply_markup = new InlineKeyboard()
        .text("💳 Wallet", "handle_wallet")
        .row()
        .text("💲 Sell Pump Token", "handle_pump_sell")
        .row()
        .text("💊 Pump.fun", "handle_pumpfun")

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
        .text("🔒 Hide Key", "handle_delete_msg")
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
Socials:
  - Website: ${session.pumpfun.website ?? '-'}
  - Twitter: ${session.pumpfun.twitter ?? '-'}
  - Telegram: ${session.pumpfun.telegram ?? '-'}
  - Discord: ${session.pumpfun.discord ?? '-'}

Main Wallet:
${session.wallet.find((item) => item.default)?.pubKey ? `<a href='https://solscan.io/account/${session.wallet.find((item) => item.default)?.pubKey}'>${session.wallet.find((item) => item.default)?.pubKey}</a>` : '-'}
`

    if (session.pumpfun.wallets.length) {
        content += `\nSub Wallets:`
        session.pumpfun.wallets.map((item, idx) => {
            const pubkey = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privKey))).publicKey.toBase58()
            content += `\n${idx + 1}. <a href='https://solscan.io/account/${pubkey}'>${pubkey}</a> (${item.amount} sol)`
        })
    }

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
        .text("✏️ Select Sub Wallet", "handle_pump_subWallet")
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

const pumpSubWalletMsg = (session: SessionData) => {
    const content = `Please select sub wallet`
    const reply_markup = new InlineKeyboard()
    session.wallet.map((item, idx) => {
        reply_markup
            .text(`${item.pubKey}`)
        const flag = session.pumpfun.wallets.some((sub) => sub.privKey === item.privKey)
        if (flag) {
            reply_markup
                .text(`⛔`, `handle_remove_pumpfun_sub_wallet_${idx}`)
                .row()
        } else {
            reply_markup
                .text(`👉`, `handle_pumpfun_sub_wallet_${idx}`)
                .row()
        }
    })
    reply_markup
        .text("🚫 Close", "handle_delete_msg")
    return { content, reply_markup }
}

const pumpSubWalletAmountMsg = (pubkey: string) => {
    const content = `You select this wallet <code>${pubkey}</code>, please input amount`
    const reply_markup = new InlineKeyboard()
        .text("🚫 Cancel", "handle_delete_msg")

    return { content, reply_markup }
}

const pumpBundleMessage = async (session: SessionData) => {
    const res = await validateBundle(session)
    if (res.success) {
        const content = 'Bundling now...'
        const reply_markup = new InlineKeyboard()
            .text("🚫 Close", "handle_delete_msg")
        return { content, reply_markup, success: true }
    } else {
        const content = res.error
        const reply_markup = new InlineKeyboard()
            .text("🚫 Cancel", "handle_delete_msg")
        return { content, reply_markup, success: false }
    }
}

const pumpSellMessage = async (session: SessionData) => {
    const content = `Please select wallet to sell`
    const reply_markup = new InlineKeyboard()
    session.wallet.map((item, idx) => {
        reply_markup
            .text(`${item.pubKey}`)
            .text(`${item.default ? `🔑  ` : ``}👉`, `handle_sell_pump_${idx}`)
            .row()
    })
    if (session.wallet.length > 0) reply_markup
        .text(`👥  Batch 💲🇪 🇱 🇱`, `handle_sell_all`)
        .row()
    else reply_markup
        .text(`No wallet found`)
        .row()

    reply_markup.text("🚫 Cancel", "handle_delete_msg")

    return { content, reply_markup }
}

const pumpSellConfirmMessage = async () => {
    const content = `Token selling now...`
    const reply_markup = new InlineKeyboard().text("🚫 Close", "handle_delete_msg")

    return { content, reply_markup }
}

const pumpSellInputMintMessage = async (session: SessionData) => {
    const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(session.pumpsell.privKey)))
    const content = `You have select wallet <a href='https://solscan.io/account/${walletKeypair.publicKey.toBase58()}'>${walletKeypair.publicKey.toBase58()}</a>. Please input token address to sell`
    const reply_markup = new InlineKeyboard().text("🚫 Close", "handle_delete_msg")

    return { content, reply_markup }
}

const pumpSellMintResultMessage = async (mint: string, session: SessionData) => {
    try {
        const mintPubkey = new PublicKey(mint)
        const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(session.pumpsell.privKey)))
        const info = await connection.getAccountInfo(mintPubkey)
        const deserialize = MintLayout.decode(info?.data!)
        const mintAuthority = deserialize.mintAuthority

        if (pumpfunMintAuthority.toBase58() != mintAuthority.toBase58()) {
            const content = `Please input pump fun token mint address. This <code>${mint}</code> is not pump fun token.`
            const reply_markup = new InlineKeyboard()
                .text("🚫 Close", "handle_delete_msg")
            return { content, reply_markup, result: false }
        }

        const ata = getAssociatedTokenAddressSync(mintPubkey, walletKeypair.publicKey)
        try {
            const balance = await connection.getTokenAccountBalance(ata)
            if (balance.value.uiAmount && balance.value.uiAmount > 0) {
                const content = `Wallet: <code>${walletKeypair.publicKey.toBase58()}</code>
Mint: <code>${mint}</code>
Token Amount: ${balance.value.uiAmount}`
                const reply_markup = new InlineKeyboard()
                    .text("💲 Sell", "handle_pump_sell_confirm")
                    .text("🚫 Close", "handle_delete_msg")
                return { content, reply_markup, result: true }
            } else {
                const content = `Wallet: <code>${walletKeypair.publicKey.toBase58()}</code>
Mint: <code>${mint}</code>
Token Amount: No token in this wallet`
                const reply_markup = new InlineKeyboard()
                    .text("🚫 Close", "handle_delete_msg")
                return { content, reply_markup, result: false }
            }

        } catch (err) {
            const content = `Wallet: <code>${walletKeypair.publicKey.toBase58()}</code>
Mint: <code>${mint}</code>
Token Amount: No token in this wallet`
            const reply_markup = new InlineKeyboard()
                .text("🚫 Close", "handle_delete_msg")
            return { content, reply_markup, result: false }
        }
    } catch (err) {
        const content = `Please input token mint address correctly. <code>${mint}</code> is not valid`
        const reply_markup = new InlineKeyboard().text("🚫 Close", "handle_delete_msg")
        return { content, reply_markup, result: false }
    }
}

const pumpSellAllMintMessage = () => {
    const content = `Please input token mint address`
    const reply_markup = new InlineKeyboard()
        .text("🚫 Close", "handle_delete_msg")
    return { content, reply_markup }
}

const pumpSellAllMintResultMessage = async (mint: string, session: SessionData) => {
    try {
        const mintPubkey = new PublicKey(mint)
        const info = await connection.getAccountInfo(mintPubkey)
        const deserialize = MintLayout.decode(info?.data!)
        const mintAuthority = deserialize.mintAuthority

        if (pumpfunMintAuthority.toBase58() != mintAuthority.toBase58()) {
            const content = `Please input pump fun token mint address. This <code>${mint}</code> is not pump fun token.`
            const reply_markup = new InlineKeyboard()
                .text("🚫 Close", "handle_delete_msg")
            return { content, reply_markup }
        }

        const walletList: { privkey: string; amount: number, solAmt: number }[] = (await Promise.all(
            session.wallet.map(async (item) => {
                const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privKey)));
                const ata = getAssociatedTokenAddressSync(mintPubkey, walletKeypair.publicKey);
                try {
                    const balance = await connection.getTokenAccountBalance(ata);
                    if (balance.value.uiAmount && balance.value.uiAmount > 0) {
                        const sol = await connection.getBalance(walletKeypair.publicKey)
                        return { privkey: item.privKey, amount: balance.value.uiAmount, solAmt: sol / LAMPORTS_PER_SOL };
                    }
                } catch (err) { }
                return null;
            })
        )).filter(item => item != null)

        const reply_markup = new InlineKeyboard()
        let content: string
        if (walletList.length) {
            const feePayerKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(session.wallet.find((item) => item.default)?.privKey!)));
            content = `  💲 Fee payer \n<code>${feePayerKeypair.publicKey.toBase58()}</code>\n`
            walletList.map((item, idx) => {
                const walletKeypair = Keypair.fromSecretKey(Uint8Array.from(bs58.decode(item.privkey)));
                content += `\n  💳 Wallet  #${idx}\nAddress: <code>${walletKeypair.publicKey.toBase58()}</code>\nToken Amount: ${item.amount}\nSol Balance: ${item.solAmt} SOL`
            })
            reply_markup.text("💲💲💲 Sell all tokens", "handle_sell_all_tokens").row()
        } else { content = `No possible wallet` }
        reply_markup.text("🚫 Close", "handle_delete_msg")

        return { content, reply_markup, walletList }
    } catch (err) {
        const content = `Please input token mint address correctly. <code>${mint}</code> is not valid`
        const reply_markup = new InlineKeyboard().text("🚫 Close", "handle_delete_msg")
        return { content, reply_markup }
    }
}

export {
    startMessage,
    walletMessage,
    showPrivateKey,
    importWallet,
    pumpfunMessage,
    pumpfunDetailMessage,
    pumpBundleMessage,
    pumpSellAllMintMessage,
    pumpSellAllMintResultMessage,
    InvalidSecurityKey,
    pumpSubWalletAmountMsg,
    pumpSubWalletMsg,
    pumpSellMessage,
    pumpSellInputMintMessage,
    pumpSellMintResultMessage,
    pumpSellConfirmMessage,
}