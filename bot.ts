import fs from 'fs'
import { Bot, Context, InlineKeyboard, session, SessionFlavor } from "grammy"
import { BOT_TOKEN, COMMAND_LIST } from "./src/config";
import { message } from "./src/utils";
import { initialSession, pumpfunActionType, pumpfunSessionType, SessionData, testSession } from "./src/config/contant";
import { createAndBundleTx, importNewWallet } from "./src/utils/utils";
import { handleNewWallet } from "./src/web3";

const main = async () => {
    const bot = new Bot<Context & SessionFlavor<SessionData>>(BOT_TOKEN)

    await bot.api.setMyCommands(COMMAND_LIST);

    bot.use(session({ initial: testSession }));

    bot.use(async (ctx, next) => {
        const username = ctx.from?.username
        const id = ctx.from?.id
        const message = ctx.update.message?.text
        const callback_query = ctx.update.callback_query?.data
        let log = `${username} (${id}): `
        if (message) log += `message => ${message}\n`
        if (callback_query) log += `callback_query => ${callback_query}\n`
        fs.appendFileSync('log.txt', log)
        // console.log(ctx.from?.username, ctx.from?.id)
        // console.log('message ===>>>', ctx.update.message?.text)
        // console.log('callback_query ===>>>', ctx.update.callback_query?.data)
        await next()
    });

    // Handle start command
    bot.command("start", (ctx) => {
        const data = message.startMessage(ctx.from?.username)
        ctx.reply(
            data.content,
            { reply_markup: data.reply_markup }
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
        const res = await message.walletMessage(ctx.session)
        await ctx.reply(
            res.content,
            { reply_markup: res.reply_markup }
        )
    })

    // Handle callback query
    bot.on("callback_query:data", async (ctx) => {
        const data = ctx.callbackQuery.data
        let res: { content: string, reply_markup: InlineKeyboard }

        if (data.startsWith('handle_delete_wallet_')) {
            const idx = data.split('_')[3]

            if (ctx.session.wallet[Number(idx)].default) {
                const index = Number(idx) == 0 ? 1 : 1
                if (index < ctx.session.wallet.length) ctx.session.wallet[index].default = true
            }

            ctx.session.wallet.splice(Number(idx), 1)
            res = await message.walletMessage(ctx.session)

            await ctx.editMessageText(
                res.content,
                { reply_markup: res.reply_markup }
            )
        } else if (data.startsWith('handle_default_wallet_')) {
            const index = data.split('_')[3]
            ctx.session.wallet = ctx.session.wallet.filter((item, idx) => {
                item.default = idx == Number(index)
                return item
            })
            res = await message.walletMessage(ctx.session)

            await ctx.editMessageText(
                res.content,
                { reply_markup: res.reply_markup }
            )
        } else if (data.startsWith('handle_show_wallet_')) {
            const index = data.split('_')[3]
            res = message.showPrivateKey(ctx.session.wallet[Number(index)].privKey!)
            await ctx.reply(
                res.content,
                {
                    reply_markup: res.reply_markup,
                    parse_mode: "MarkdownV2"
                }
            )
        }
        switch (data) {
            case 'handle_wallet':
                res = await message.walletMessage(ctx.session)
                await ctx.reply(
                    res.content,
                    { reply_markup: res.reply_markup }
                )
                break

            // case 'handle_show_private_key':
            //     res = message.showPrivateKey(ctx.session)
            //     await ctx.reply(
            //         res.content,
            //         {
            //             reply_markup: res.reply_markup,
            //             parse_mode: "MarkdownV2"
            //         }
            //     )
            //     break

            case 'handle_add_wallet':
                const { pubKey, privKey } = handleNewWallet()
                ctx.session.wallet.push({ pubKey, privKey, default: ctx.session.wallet.length == 0 })
                res = await message.walletMessage(ctx.session)

                await ctx.editMessageText(
                    res.content,
                    { reply_markup: res.reply_markup }
                )

                break

            case 'handle_import_wallet':
                res = message.importWallet()
                ctx.session.action = 'wallet-import'
                const importWalletMsg = await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML"
                    }
                )

                ctx.session.currentMsg = importWalletMsg.message_id
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
                        reply_markup: new InlineKeyboard().text("🚫 Cancel", "handle_delete_msg"),
                        parse_mode: "HTML"
                    }
                )
                break

            case 'handle_pump_buy_amount':
                ctx.session.action = 'pumpfun-sub-amount'
                res = message.pumpSubWalletAmountMsg()
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML"
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
                    const flag = ctx.session.wallet.some(item => item.privKey == str)

                    await ctx.deleteMessage()
                    await ctx.api.deleteMessage(ctx.chat.id, ctx.session.currentMsg)
                    if (!flag) {
                        res = importNewWallet(str)
                        if (res) {
                            ctx.session.wallet.push({ pubKey: res, privKey: str, default: ctx.session.wallet.length == 0 })
                            res = await message.walletMessage(ctx.session)

                        } else {
                            res = message.InvalidSecurityKey()
                        }
                        await ctx.reply(
                            res.content,
                            { reply_markup: res.reply_markup }
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
                // ctx.session.tempWallet.privkey = ctx.message.text
                // res = message.showTempWallet(ctx.session.tempWallet.privkey, ctx.session.tempWallet.amount)
                // await ctx.reply(
                //     res.content,
                //     {
                //         reply_markup: res.reply_markup,
                //         parse_mode: "HTML"
                //     }
                // )
                // break

                case 'pumpfun-sub-amount':
                    if (Number(ctx.message.text) > 0) {
                        ctx.session.pumpfun.amount = Number(ctx.message.text)
                        ctx.session.action = undefined
                        res = message.pumpfunMessage(ctx.session)
                    }
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
                    try { await ctx.deleteMessage() } catch (err) {

                    }
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