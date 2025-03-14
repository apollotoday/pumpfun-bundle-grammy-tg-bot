import bs58 from 'bs58'
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet'
import { AnchorProvider } from '@coral-xyz/anchor'
import { COMMAND_LIST } from './contant'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { PumpFunSDK } from '../web3/pump'

export const envParams = () => {
  const BOT_TOKEN = process.env.BOT_TOKEN!
  const DB_URL = process.env.DB_URL!
  const RPC_ENDPOINT = process.env.RPC_ENDPOINT!
  const mainKeypairHex = process.env.MAIN_KEYPAIR_HEX!
  const treasuryFee = Number(process.env.TREASURY_FEE!)
  const treasuryWallet = new PublicKey(process.env.TREASURY_WALLET!)

  return { BOT_TOKEN, DB_URL, RPC_ENDPOINT, mainKeypairHex, treasuryFee, treasuryWallet }
}

const connection = new Connection(envParams().RPC_ENDPOINT, 'confirmed')
const mainKeypair = Keypair.fromSecretKey(bs58.decode(envParams().mainKeypairHex!))
const wallet = new NodeWallet(mainKeypair)
const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed", });
const pumpFunSDK = new PumpFunSDK(provider)

export {
  COMMAND_LIST,
  connection,
  provider,
  pumpFunSDK,
}