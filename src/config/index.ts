import dotenv from 'dotenv'
import { COMMAND_LIST } from './contant'
import { Connection } from '@solana/web3.js'
dotenv.config()

const BOT_TOKEN = process.env.BOT_TOKEN!
const RPC_ENDPOINT = process.env.RPC_ENDPOINT!
const connection = new Connection(RPC_ENDPOINT)

export { BOT_TOKEN, COMMAND_LIST, connection }