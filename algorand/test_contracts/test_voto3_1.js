import { config } from 'dotenv';
import algosdk from 'algosdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFile = `.env.${process.env.NODE_ENV || 'localnet'}`;
console.log('Cargando configuración desde:', join(__dirname, '..', envFile));
config({ path: join(__dirname, '..', envFile) });

// Parámetros de conexión
const algodToken = process.env.ALGOD_TOKEN;
const algodServer = process.env.ALGOD_SERVER;
const algodPort = process.env.ALGOD_PORT;

if (!algodToken || !algodServer || !algodPort) {
    throw new Error('Faltan parámetros de conexión en .env');
}

const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Cuenta del remitente
const deployerMnemonic = process.env.DEPLOYER_MNEMONIC;
if (!deployerMnemonic) {
    throw new Error('DEPLOYER_MNEMONIC no encontrado en .env');
}

const deployerAccount = algosdk.mnemonicToSecretKey(deployerMnemonic);

const appId = parseInt(process.env.APP_ID);
if (isNaN(appId)) {
    throw new Error('APP_ID inválido en .env');
}

async function callAbrirRegistroCompromisos() {
    try {
        const params = await algodClient.getTransactionParams().do();
        params.fee = 1000;
        params.flatFee = true;

        const appArgs = [Buffer.from('abrir_registro_compromisos')];

        const txn = algosdk.makeApplicationCallTxnFromObject({
            sender: deployerAccount.addr,
            suggestedParams: params,
            appIndex: appId,
            appArgs: appArgs,
            onComplete: algosdk.OnApplicationComplete.NoOpOC,
        });

        const signedTxn = txn.signTxn(deployerAccount.sk);
        const txId = txn.txID();

        console.log('Enviando transacción con ID:', txId);

        await algodClient.sendRawTransaction(signedTxn).do();

        const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

        console.log('Transacción confirmada en ronda:', confirmedTxn['confirmed-round']);

        return confirmedTxn;

    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
}

callAbrirRegistroCompromisos().catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
});
