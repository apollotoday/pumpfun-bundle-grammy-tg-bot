import { Bot, Context, InlineKeyboard, session, SessionFlavor } from "grammy"
import { BOT_TOKEN, COMMAND_LIST } from "./src/config";
import { message } from "./src/utils";
import { initialSession, pumpfunActionType, pumpfunSessionType, SessionData, testSession } from "./src/config/contant";
import fs from 'fs'
import { createAndBundleTx } from "./src/utils/utils";

const main = async () => {
    const bot = new Bot<Context & SessionFlavor<SessionData>>(BOT_TOKEN)

    await bot.api.setMyCommands(COMMAND_LIST);

    bot.use(session({ initial: initialSession }));

    bot.use(async (ctx, next) => {
        // console.log(JSON.stringify(ctx.session, null, 4))
        // console.log(ctx.from?.username,ctx.from?.id)
        await next()
    });

    // Handle start command
    bot.command("start", (ctx) => {
        ctx.reply(
            message.startMessage(ctx.from?.username).content,
            { reply_markup: message.startMessage(ctx.from?.username).reply_markup }
        )
    })

    bot.command("pumpfun", async (ctx) => {
        const res = message.pumpfunMessage(ctx.session)
        await ctx.reply(
            res.content,
            {
                reply_markup: res.reply_markup,
                parse_mode: "HTML"
            }
        )
    })

    bot.command("wallet", async (ctx) => {
        const res = await message.walletMessage(ctx.session.wallet.pubKey)
        await ctx.reply(
            res.content,
            { reply_markup: res.reply_markup }
        )
    })

    // Handle callback query
    bot.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data
        let res: { content: string, reply_markup: InlineKeyboard }
        switch (data) {
            case 'handle_wallet':
                res = await message.walletMessage(ctx.session.wallet.pubKey)
                await ctx.reply(
                    res.content,
                    { reply_markup: res.reply_markup }
                )
                break

            case 'handle_show_private_key':
                res = message.showPrivateKey(ctx.session.wallet.privKey!)
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "MarkdownV2"
                    }
                )
                break

            case 'handle_import_wallet':
                res = message.importWallet()
                ctx.session.action = 'wallet-import'
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_pumpfun':
                res = message.pumpfunMessage(ctx.session)
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML",
                        link_preview_options: { is_disabled: true },
                    }
                )
                break

            case 'handle_pumpfun_name':
            case 'handle_pumpfun_symbol':
            case 'handle_pumpfun_description':
            case 'handle_pumpfun_website':
            case 'handle_pumpfun_twitter':
            case 'handle_pumpfun_telegram':
            case 'handle_pumpfun_discord':
                ctx.session.action = pumpfunActionType[data];
                res = message.pumpfunDetailMessage(pumpfunSessionType[pumpfunActionType[data]])
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_pumpfun_image':
                ctx.session.action = pumpfunActionType[data];
                await ctx.reply(
                    'Please upload image',
                    {
                        reply_markup: new InlineKeyboard().text("Cancel", "handle_delete_msg"),
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_add_sub_wallet':
                await ctx.reply(
                    `Currently you have ${ctx.session.pumpfun.subWallet.length} sub wallets, Please add new wallet`,
                    {
                        reply_markup: new InlineKeyboard()
                            .text("Private Key", "handle_add_sub_wallet_key")
                            .text("Amount", "handle_add_sub_wallet_amount")
                            .text("Cancel", "handle_delete_msg"),
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_add_sub_wallet_key':
                ctx.session.action = 'pumpfun-sub-key'
                await ctx.reply(
                    `Please set new wallet private key`,
                    {
                        reply_markup: new InlineKeyboard()
                            .text("Cancel", "handle_delete_msg"),
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_add_sub_wallet_amount':
                ctx.session.action = 'pumpfun-sub-amount'
                await ctx.reply(
                    `Please set sol amount to buy`,
                    {
                        reply_markup: new InlineKeyboard()
                            .text("Cancel", "handle_delete_msg"),
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_register_temp_wallet':
                ctx.session.pumpfun.subWallet.push({ privkey: ctx.session.tempWallet.privkey, amount: ctx.session.tempWallet.amount })
                ctx.session.tempWallet.privkey = ''
                ctx.session.tempWallet.amount = 0
                res = message.pumpfunMessage(ctx.session)
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML",
                        link_preview_options: { is_disabled: true },
                    }
                )
                break

            case 'handle_pump_bundle':
                const handle_pump_bundle_message_result = await message.pumpBundleMessage(ctx.session)
                if (handle_pump_bundle_message_result) {
                    const loadingMessage = await ctx.reply(
                        handle_pump_bundle_message_result.content,
                        {
                            reply_markup: handle_pump_bundle_message_result.reply_markup,
                            parse_mode: "HTML",
                            link_preview_options: { is_disabled: true },

                        }
                    )
                    if (handle_pump_bundle_message_result.success) {
                        // 
                        const txRes = await createAndBundleTx(ctx.session)
                        await ctx.api.deleteMessage(ctx.chat?.id!, loadingMessage.message_id);
                    }
                }
                break

            case 'handle_delete_msg':
                ctx.session.action = undefined
                await ctx.deleteMessage()
                break

            default:

        }
    })

    bot.on("message", async (ctx) => {
        let str: string = ''
        let res: any

        if (ctx.message.text) {
            switch (ctx.session.action) {
                case 'wallet-import':
                    str = ctx.message.text
                    res = message.updateWallet(str)
                    await ctx.deleteMessage()
                    if (res.pubkey) {
                        ctx.session.wallet.privKey = str
                        ctx.session.wallet.pubKey = res.pubkey

                        await ctx.reply(
                            res.content, {
                            reply_markup: res.reply_markup,
                            parse_mode: "HTML"
                        }
                        )
                        ctx.session.action = undefined
                    } else {
                        await ctx.reply(
                            res.content,
                            {
                                reply_markup: res.reply_markup,
                                parse_mode: "HTML"
                            }
                        )

                    }
                    break

                case 'pumpfun-name':
                case 'pumpfun-symbol':
                case 'pumpfun-description':
                case 'pumpfun-website':
                case 'pumpfun-twitter':
                case 'pumpfun-telegram':
                case 'pumpfun-discord':
                    str = ctx.message.text
                    ctx.session.pumpfun[pumpfunSessionType[ctx.session.action]] = str

                    res = message.pumpfunMessage(ctx.session)
                    await ctx.reply(
                        res.content,
                        {
                            reply_markup: res.reply_markup,
                            parse_mode: "HTML"
                        }
                    )
                    break

                case 'pumpfun-sub-key':
                    ctx.session.tempWallet.privkey = ctx.message.text
                    res = message.showTempWallet(ctx.session.tempWallet.privkey, ctx.session.tempWallet.amount)
                    await ctx.reply(
                        res.content,
                        {
                            reply_markup: res.reply_markup,
                            parse_mode: "HTML"
                        }
                    )
                    break

                case 'pumpfun-sub-amount':
                    ctx.session.tempWallet.amount = Number(ctx.message.text)
                    res = message.showTempWallet(ctx.session.tempWallet.privkey, ctx.session.tempWallet.amount)
                    await ctx.reply(
                        res.content,
                        {
                            reply_markup: res.reply_markup,
                            parse_mode: "HTML"
                        }
                    )
                    break

                default:
                    // ctx.session.action = undefined
                    await ctx.deleteMessage()
            }
        }

        if (ctx.message.photo) {
            if (ctx.session.action == 'pumpfun-image') {
                const fileId = ctx.message.photo.pop()?.file_id;
                if (fileId) {
                    const file = await ctx.api.getFile(fileId);
                    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
                    ctx.session.pumpfun.image = fileUrl
                    await ctx.deleteMessage()
                    res = message.pumpfunMessage(ctx.session)
                    await ctx.reply(
                        res.content,
                        {
                            reply_markup: res.reply_markup,
                            parse_mode: "HTML"
                        }
                    )
                }
            }
        }
    });

    bot.start();
}

main()