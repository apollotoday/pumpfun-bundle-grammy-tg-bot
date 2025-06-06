import bs58 from "bs58";
import { Result, PriorityFee, TransactionResult } from "./types";
import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Finality,
  Keypair,
  PublicKey,
  SendTransactionError,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  AddressLookupTableProgram,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { commitmentType } from "../../../config/contant";
import { connection } from "../../../config/env";

export const calcNonDecimalValue = (
  value: number,
  decimals: number
): number => {
  return Math.trunc(value * Math.pow(10, decimals));
};

export const calcDecimalValue = (value: number, decimals: number): number => {
  return value / Math.pow(10, decimals);
};

export const getKeypairFromStr = (str: string): Keypair | null => {
  try {
    return Keypair.fromSecretKey(Uint8Array.from(bs58.decode(str)));
  } catch (error) {
    return null;
  }
};

export const getNullableResutFromPromise = async <T>(
  value: Promise<T>,
  opt?: { or?: T; logError?: boolean }
): Promise<T | null> => {
  return value.catch((error) => {
    if (opt) console.log({ error });
    return opt?.or != undefined ? opt.or : null;
  });
};

export const sleep = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const createLookupTable = async (
  connection: Connection,
  signer: Keypair,
  addresses: PublicKey[] = []
): Promise<Result<{ lookupTable: PublicKey }, string>> => {
  try {
    const slot = await connection.getSlot();

    addresses.push(AddressLookupTableProgram.programId);
    console.log(addresses.length);
    const [lookupTableInst, lookupTableAddress] =
      AddressLookupTableProgram.createLookupTable({
        authority: signer.publicKey,
        payer: signer.publicKey,
        recentSlot: slot - 10,
      });

    for (let i = 0; i < addresses.length; i += 30) {
      const initAddressList = addresses.slice(
        i,
        Math.min(i + 30, addresses.length)
      );
      const extendInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: signer.publicKey,
        authority: signer.publicKey,
        lookupTable: lookupTableAddress,
        addresses: [...initAddressList],
      });

      const blockhash = await connection
        .getLatestBlockhash()
        .then((res) => res.blockhash);

      const instructions: Array<TransactionInstruction> = [];
      if (i == 0) instructions.push(lookupTableInst);
      instructions.push(extendInstruction);
      const messageV0 = new TransactionMessage({
        payerKey: signer.publicKey,
        recentBlockhash: blockhash,
        instructions: [...instructions],
      }).compileToV0Message();

      const vtx = new VersionedTransaction(messageV0);
      vtx.sign([signer]);

      const sim = await connection.simulateTransaction(vtx, { sigVerify: true })
      console.log(sim)

      const sig = await connection.sendTransaction(vtx);
      const confirm = await connection.confirmTransaction(
        sig,
        commitmentType.Finalized
      );
      console.log("lut sig", sig);
    }

    return { Ok: { lookupTable: lookupTableAddress } };
  } catch (err) {
    console.log("look up table creation error", err);

    return { Err: (err as any).toString() };
  }
};

export const deactiveLookupTable = async (
  connection: Connection,
  signer: Keypair,
  payer?: Keypair
) => {
  const res = await connection.getProgramAccounts(
    AddressLookupTableProgram.programId,
    {
      filters: [
        {
          memcmp: {
            offset: 22,
            bytes: signer.publicKey.toBase58(),
          },
        },
      ],
    }
  );

  console.log(res.map((item) => item.pubkey.toBase58()));

  const instructions: Array<TransactionInstruction> = [];
  res.map((item) => {
    if (item.pubkey.toBase58() != "") {
      const closeInx = AddressLookupTableProgram.deactivateLookupTable({
        lookupTable: item.pubkey, // Address of the lookup table to close
        authority: signer.publicKey, // Authority to close the LUT
      });
      instructions.push(closeInx);
    }
  });

  for (let i = 0; i < instructions.length; i += 25) {
    const blockhash = await connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);

    const instructionsList = instructions.slice(
      i,
      Math.min(i + 25, instructions.length)
    );
    const messageV0 = new TransactionMessage({
      payerKey: signer.publicKey,
      recentBlockhash: blockhash,
      instructions: instructionsList,
    }).compileToV0Message();

    const vtx = new VersionedTransaction(messageV0);
    vtx.sign([signer]);

    const sim = await connection.simulateTransaction(vtx);
    console.log(sim);

    const sig = await connection.sendTransaction(vtx);
    const confirm = await connection.confirmTransaction(sig);
  }
};

export const closeLookupTable = async (
  connection: Connection,
  signer: Keypair
) => {
  const res = await connection.getProgramAccounts(
    AddressLookupTableProgram.programId,
    {
      filters: [
        {
          memcmp: {
            offset: 22,
            bytes: signer.publicKey.toBase58(),
          },
        },
      ],
    }
  );

  const instructions: Array<TransactionInstruction> = [];
  res.map((item) => {
    if (item.pubkey.toBase58() != "") {
      const closeInx = AddressLookupTableProgram.closeLookupTable({
        lookupTable: item.pubkey, // Address of the lookup table to close
        authority: signer.publicKey, // Authority to close the LUT
        recipient: signer.publicKey, // Recipient of the reclaimed rent balance
      });
      instructions.push(closeInx);
    }
  });

  for (let i = 0; i < instructions.length; i += 25) {
    const blockhash = await connection
      .getLatestBlockhash()
      .then((res) => res.blockhash);

    const instructionsList = instructions.slice(
      i,
      Math.min(i + 25, instructions.length)
    );
    const messageV0 = new TransactionMessage({
      payerKey: signer.publicKey,
      recentBlockhash: blockhash,
      instructions: instructionsList,
    }).compileToV0Message();

    const vtx = new VersionedTransaction(messageV0);
    vtx.sign([signer]);

    const sim = await connection.simulateTransaction(vtx);
    console.log(sim);

    const sig = await connection.sendTransaction(vtx);
    const confirm = await connection.confirmTransaction(sig);
  }
};

export const calculateWithSlippageBuy = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount + (amount * basisPoints) / BigInt(10000);
};

export const calculateWithSlippageSell = (
  amount: bigint,
  basisPoints: bigint
) => {
  return amount - (amount * basisPoints) / BigInt(10000);
};

export const sendTx = async (
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = commitmentType.Confirmed,
  finality: Finality = commitmentType.Finalized
): Promise<TransactionResult> => {
  const newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });
    newTx.add(modifyComputeUnits);
    newTx.add(addPriorityFee);
  }
  newTx.add(tx);
  const versionedTx = await buildVersionedTx(connection, payer, newTx);
  versionedTx.sign(signers);
  try {
    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });

    const txResult = await connection.confirmTransaction(sig);

    if (txResult.value.err) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }
    return {
      success: true,
      signature: sig,
    };
  } catch (e) {
    console.error(e);

    if (e instanceof SendTransactionError) {
      e as SendTransactionError;
    }

    return {
      error: e,
      success: false,
    };
  }
};

export const buildTx = async (
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
  commitment: Commitment = commitmentType.Confirmed,
  finality: Finality = commitmentType.Finalized
): Promise<VersionedTransaction> => {
  const newTx = new Transaction();

  if (priorityFees) {
    const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
      units: priorityFees.unitLimit,
    });

    const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFees.unitPrice,
    });
    newTx.add(modifyComputeUnits);
    newTx.add(addPriorityFee);
  }
  newTx.add(tx);
  const versionedTx = await buildVersionedTx(
    connection,
    payer,
    newTx,
    commitment
  );
  versionedTx.sign(signers);
  return versionedTx;
};

export const buildVersionedTx = async (
  connection: Connection,
  payer: PublicKey,
  tx: Transaction,
  commitment: Commitment = commitmentType.Finalized
): Promise<VersionedTransaction> => {
  const blockHash = (await connection.getLatestBlockhash(commitment)).blockhash;

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockHash,
    instructions: tx.instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};

export const getTxDetails = async (
  connection: Connection,
  sig: string,
  commitment: Commitment = commitmentType.Confirmed,
  finality: Finality = commitmentType.Finalized
): Promise<VersionedTransactionResponse | null> => {
  const latestBlockHash = await connection.getLatestBlockhash(commitment);
  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    },
    commitment
  );

  return connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: finality,
  });
};

export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive, the minimum is inclusive
};

export const printSOLBalance = async (
  connection: Connection,
  pubKey: PublicKey,
  info: string = ""
) => {
  const balance = await connection.getBalance(pubKey);
  console.log(
    `${info ? info + " " : ""}${pubKey.toBase58()}:`,
    balance / LAMPORTS_PER_SOL,
    `SOL`
  );
};

export const getSPLBalance = async (
  connection: Connection,
  mintAddress: PublicKey,
  pubKey: PublicKey,
  allowOffCurve: boolean = false
) => {
  try {
    const ata = getAssociatedTokenAddressSync(
      mintAddress,
      pubKey,
      allowOffCurve
    );
    const balance = await connection.getTokenAccountBalance(ata, "processed");
    return balance.value.uiAmount;
  } catch (e) {}
  return null;
};

export const printSPLBalance = async (
  connection: Connection,
  mintAddress: PublicKey,
  user: PublicKey,
  info: string = ""
) => {
  const balance = await getSPLBalance(connection, mintAddress, user);
  if (balance === null) {
    console.log(
      `${info ? info + " " : ""}${user.toBase58()}:`,
      "No Account Found"
    );
  } else {
    console.log(`${info ? info + " " : ""}${user.toBase58()}:`, balance);
  }
};

export const baseToValue = (base: number, decimals: number): number => {
  return base * Math.pow(10, decimals);
};

export const valueToBase = (value: number, decimals: number): number => {
  return value / Math.pow(10, decimals);
};

export const distributSol = async (
  data: Array<{ wallet: string; amount: number }>
) => {
  const pubKeyList = data
    .slice(1)
    .map((item) => Keypair.fromSecretKey(bs58.decode(item.wallet)).publicKey);
  const mainkey = Keypair.fromSecretKey(bs58.decode(data[0].wallet));
  const ixs: TransactionInstruction[] = [];

  for (let i = 0; i < pubKeyList.length; i++) {
    const bal = await connection.getBalance(pubKeyList[i]);
    console.log(i, bal);

    if (bal < 1_000_000 + data[i].amount * LAMPORTS_PER_SOL) {
      const amount = 900_000 + data[i].amount * LAMPORTS_PER_SOL - bal;
      console.log(i, amount);
      ixs.push(
        SystemProgram.transfer({
          fromPubkey: mainkey.publicKey,
          toPubkey: pubKeyList[i],
          lamports: amount,
        })
      );
    }
  }

  const latestBlockhash = await connection.getLatestBlockhash("finalized");

  const txMsg = new TransactionMessage({
    payerKey: mainkey.publicKey,
    recentBlockhash: latestBlockhash.blockhash,
    instructions: ixs,
  }).compileToV0Message();

  const vtx = new VersionedTransaction(txMsg);
  vtx.sign([mainkey]);

  const sim = await connection.simulateTransaction(vtx);
  console.log(sim);

  const sig = await connection.sendTransaction(vtx);
  const confirm = await connection.confirmTransaction(sig);

  console.log(sig);
};

export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    result.push(chunk);
  }

  return result;
};
