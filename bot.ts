import { Bot, Context, InlineKeyboard, session, SessionFlavor } from "grammy"
import { BOT_TOKEN, COMMAND_LIST, BOT_CONTEXT } from "./src/config";
import { message } from "./src/utils";
import { initialSession, SessionData } from "./src/config/contant";

const main = async () => {
    const bot = new Bot<Context & SessionFlavor<SessionData>>(BOT_TOKEN)

    // Set commands part
    await bot.api.setMyCommands(COMMAND_LIST);

    bot.use(session({ initial: initialSession }));
    // bot.use(async (ctx, next) => {
    //     switch (ctx.session.action) {
    //         // case 'baseMint':
    //         //     break
    //         // case 'quoteMint':
    //         //     break
    //         // case 'baseAmount':
    //         //     break
    //         // case 'quoteAmount':
    //         //     break
    //     }
    //     await next()
    // });

    // Handle start command
    bot.command("start", (ctx) => {
        ctx.reply(
            message.startMessage(ctx.from?.username).content,
            { reply_markup: message.startMessage(ctx.from?.username).reply_markup }
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

            case 'handle_meteora':
                break

            case 'handle_show_private_key':
                res = message.showPrivateKey(ctx.session.wallet.privKey!)
                await ctx.reply(
                    res.content,
                    {
                        reply_markup: res.reply_markup,
                        parse_mode: "HTML"
                    }
                )
                break

            // case 'handle_create_wallet':
            //     const createWalletData = message.createWallet()
            //     ctx.wallet.privKey = createWalletData.privkey
            //     ctx.wallet.pubKey = createWalletData.pubkey
            //     console.log('ctx.wallet', ctx.wallet)
            //     ctx.reply(
            //         createWalletData.content,
            //         {
            //             reply_markup: createWalletData.reply_markup,
            //             parse_mode: "HTML"
            //         }
            //     )
            //     break

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

            case 'handle_meteora':
                break

            case 'handle_delete_msg':
                ctx.session.action = undefined
                await ctx.deleteMessage()
                break

            default:
        }
    })

    bot.command("meteora", (ctx) => ctx.reply(`Hello ${ctx.from?.username}, Welcome to clickcreate bot `));

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
                            res.content,{
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
            }
        }
    });

    bot.start();
}

main()