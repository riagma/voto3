import { algo, AlgorandClient, Config } from '@algorandfoundation/algokit-utils'
import { ABIMethod } from 'algosdk';
import { Voto3Client } from '../clients/voto3.js';
import { randomBytes } from 'node:crypto';

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = `.env.${process.env.NODE_ENV || 'localnet'}`;
console.log('Cargando configuración desde:', join(__dirname, '..', envFile));
config({ path: join(__dirname, '..', envFile) });

// Validar parámetros de entorno
const algodToken = process.env.ALGOD_TOKEN;
const algodServer = process.env.ALGOD_SERVER;
const algodPort = process.env.ALGOD_PORT;
const deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
const appId = Number(process.env.APP_ID);

if (!algodToken || !algodServer || !algodPort || !deployerMnemonic) {
    console.error("Faltan variables de entorno críticas.");
    process.exit(1);
}

const algorand = AlgorandClient.defaultLocalNet()
const deployerAccount = algorand.account.fromMnemonic(deployerMnemonic);

const ABIregistrarCompromiso = new ABIMethod({
    name: 'registrar_compromiso',
    args: [],                  // sin argumentos
    returns: { type: 'void' },
});

async function registrarCompromiso(callerAccount, i) {

    console.log(`Ejecutando registrarCompromiso #${i + 1}`);

    const { confirmation } = await algorand.send.appCallMethodCall({
        sender: callerAccount.addr,
        appId,
        method: ABIregistrarCompromiso,
        args: [],
        lease: randomBytes(32),
        skipWaiting: false,
        maxRoundsToWaitForConfirmation: 12,  // opcional
    });

    console.log('Confirmada en ronda', confirmation.confirmedRound);
}

async function registrarCompromisoOld(callerAccount, i) {
    console.log(`Ejecutando registrarCompromiso #${i + 1}`);
    const result = await algorand.send.applicationCall({
        sender: callerAccount,
        appId,
        method: 'registrarCompromiso',
        methodArgs: [],
    });
    console.log('Confirmada en ronda:', result.confirmation?.confirmedRound);
}

async function main() {

    console.log('Conectando al nodo Algorand...',
        `Token: ${algodToken}, Server: ${algodServer}, Port: ${algodPort}`);

    const deployerAccount = algorand.account.fromMnemonic(deployerMnemonic);

    const voto3 = new Voto3Client({
        algorand,
        appId,
        defaultSender: deployerAccount,
    })
    console.log("Cliente Voto3 creado con appId:", voto3.appAddress);

    // console.log("Ejecutando abrirRegistroCompromisos...");
    // const tx1 = await client.send.abrirRegistroCompromisos({});
    // printTxInfo(tx1);

    for (let i = 0; i < 10; i++) {
        await registrarCompromiso(deployerAccount, i);
    }
}

// function printTxInfo(confirmed) {
//     const txid = confirmed["tx"];
//     const round = confirmed["confirmed-round"];
//     const txn = confirmed["transaction"];
//     const sender = txn?.sender || txn?.txn?.snd || "N/A";
//     const timestamp = confirmed["block-time"] || confirmed["timestamp"];
//     console.log({
//         txid,
//         sender,
//         confirmed_round: round,
//         timestamp,
//     });


main().catch((err) => {
    console.error("Error durante la ejecución:", err);
    process.exit(1);
});
