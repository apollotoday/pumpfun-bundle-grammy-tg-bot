import dotenv from 'dotenv'
import { COMMAND_LIST } from './contant'
import { Connection, Keypair } from '@solana/web3.js'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { AnchorProvider } from '@coral-xyz/anchor'
import bs58 from 'bs58'
import { PumpFunSDK } from '../web3/pump'
dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN!
const RPC_ENDPOINT = process.env.RPC_ENDPOINT!
const connection = new Connection(RPC_ENDPOINT, 'confirmed')

const mainKeypairHex = process.env.MAIN_KEYPAIR_HEX!
const mainKeypair = Keypair.fromSecretKey(bs58.decode(mainKeypairHex))
const wallet = new NodeWallet(mainKeypair)
const provider = new AnchorProvider(connection, wallet, {
    commitment: "finalized",
});
const pumpFunSDK = new PumpFunSDK(provider)


export { BOT_TOKEN, COMMAND_LIST, connection, provider, pumpFunSDK }