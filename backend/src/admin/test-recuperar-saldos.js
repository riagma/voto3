#!/usr/bin/env node
import algosdk from 'algosdk';
import { randomBytes } from 'node:crypto';
import { algorand, indexer } from '../algorand/algorand.js';
import { toNote } from '../algorand/algoUtiles.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import {
  votanteDatosEleccionDAO,
  contratoBlockchainDAO,
  eleccionDAO,
  partidoDAO,
} from '../modelo/DAOs.js';

import { encriptarConClavePublica } from '../utiles/utilesCrypto.js';

import { ALGO_ENV } from '../utiles/constantes.js';

const TAM_LOTE = ALGO_ENV === 'localnet' ? 100 : 10;

const consoleLog = console.log;

//--------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotantes = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id> <número-votantes>?`);
  process.exit(1);
}

//----------------------------------------------------------------------------

// async function tieneSaldo(cuentaAddr) {
//   const accountInfo = await algorand.account.getInformation(cuentaAddr);
//   console.log('AccountInfo:', accountInfo);
//   return accountInfo.amount > 1000n;
// }

// async function aceptaPapeleta(cuentaAddr, assetId) {
//   const assetInfo = await algorand.asset.getAccountInformation(cuentaAddr, assetId);
//   console.log('AssetInfo:', assetInfo);
//   return assetInfo !== null && assetInfo !== undefined;
// }

// async function tienePapeleta(cuentaAddr, assetId) {
//   const assetInfo = await algorand.asset.getAccountInformation(cuentaAddr, assetId);
//   console.log('AssetInfo:', assetInfo);
//   return assetInfo.balance > 0n;
// }

//----------------------------------------------------------------------------

async function tienePapeleta(cuentaAddr, assetId) {
  const accountInfo = await algorand.account.getInformation(cuentaAddr);
  console.log('AccountInfo:', accountInfo);
  const papeleta = accountInfo.assets.find(asset => asset.assetId === BigInt(assetId));
  console.log('Papeleta:', papeleta ? papeleta : 'null');
  return papeleta ? papeleta.amount > 0n : false;
}

//----------------------------------------------------------------------------

async function obtenerAxferCuenta(cuentaAddr) {

  const response = await indexer
    .searchForTransactions()
    .address(cuentaAddr)
    .addressRole('sender')
    .txType('axfer')
    .do();

  const txAxfer = response.transactions.find(
    tx => tx.assetTransferTransaction?.amount === 1n
  );

  if (txAxfer) {
    console.log("txAxfer", txAxfer.id);
  } else {
    console.log("No se encontró transacción con amount = 1n");
  }

  return txAxfer;
}

//----------------------------------------------------------------------------

async function destruirCuenta(accountInfo, cuentaAddr, mnemonico, appAddr, assetId, creadorAddr) {

  console.log(`Destruyendo cuenta ${cuentaAddr} con appAddr ${appAddr} para assetId ${assetId}`);

  const cuenta = algorand.account.fromMnemonic(mnemonico);

  const assetIdNum = BigInt(assetId);

  const papeleta = accountInfo.assets.find(asset => asset.assetId === assetIdNum);

  console.log('Papeleta encontrada:', papeleta ? papeleta : 'No hay papeleta');

  if (papeleta) {

    console.log(`No aceptar papeletas ${papeleta.assetId} de cuenta ${cuentaAddr}`);

    const assetTransfer = await algorand.send.assetTransfer(
      {
        sender: cuenta.addr,
        assetId: assetIdNum,
        amount: papeleta.amount,
        receiver: appAddr,
        closeAssetTo: appAddr,
        signer: cuenta.signer,
        note: toNote('CIERRE DE CUENTA'),

        skipWaiting: false,
        skipSimulate: true,
        maxRoundsToWaitForConfirmation: 12,
        maxFee: (2000).microAlgos(),
      }
    );

    // console.log('AssetTransfer:', assetTransfer);
  }

  console.log(`Cerrando cuenta ${cuentaAddr} con appAddr ${appAddr}`);

  const payment = await algorand.send.payment(
    {
      sender: cuenta.addr,
      amount: (0).microAlgos(),
      receiver: creadorAddr,
      closeRemainderTo: creadorAddr,
      signer: cuenta.signer,
      note: toNote('CIERRE DE CUENTA'),

      skipWaiting: false,
      skipSimulate: true,
      maxRoundsToWaitForConfirmation: 12,
      maxFee: (2000).microAlgos(),
    }
  );

  // console.log('Payment:', payment);
}

//----------------------------------------------------------------------------

try {

  const bd = abrirConexionBD();

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}.`);
  }

  console.log('Datos del contrato:', contrato);

  const cuentaCreador = cuentaBlockchainDAO.obtenerPorId(bd, { cuentaId: contrato.cuentaId });
  if (!cuentaCreador) {
    throw new Error(`No se encontró la cuenta que creó el contrato ${eleccionId}.`);
  }

  const creadorAddr = cuentaCreador.accAddr;
  console.log('Cuenta creadora del contrato:', creadorAddr);

  const globalState = await algorand.app.getGlobalState(BigInt(contrato.appId));
  if (!globalState) {
    throw new Error(`No se encontró el estado global de la aplicación con ID ${contrato.appId}`);
  }

  // console.log('Global State:', globalState);

  const estadoContrato = globalState.estado_contrato ? Number(globalState.estado_contrato.value) : 0;
  console.log(`Estado del contrato: ${estadoContrato}`);

  if (estadoContrato !== 7) {
    throw new Error(`El contrato no está en estado cerrado. Estado actual: ${estadoContrato}`);
  }

  //--------------

  let contadorVotantes = 0;
  let compromisoIdx = 0;

  const totalLabel = 'Tiempo total transcurrido';
  console.time(totalLabel);

  while (contadorVotantes < numeroVotantes) {

    const datosVotantes = votanteDatosEleccionDAO.obtenerDatosVotantes(bd, { eleccionId, compromisoIdx, TAM_LOTE });

    if (!datosVotantes || datosVotantes.length === 0) {
      console.error(`No se encontraron más datos de votantes para la elección ${eleccionId}.`);
      break;
    }

    compromisoIdx += datosVotantes.length;
    console.log(`Borrando ${datosVotantes.length} cuentas de la elección ${eleccionId}.`);

    const loteLabel = `Procesados ${datosVotantes.length} votantes. Total: ${compromisoIdx}`;
    console.time(loteLabel);

    //--------------
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    const datosVotantesProcesados = await Promise.all(

      datosVotantes.map(async (datosVotante) => {

        const accountInfo = await algorand.account.getInformation(datosVotante.cuentaAddr);
        console.log(`Cuenta ${datosVotante.cuentaAddr} = ${accountInfo.amount}`);

        if (accountInfo.amount < 1000n) {
          console.log(`Cuenta ${datosVotante.cuentaAddr} ya se ha recuperado el saldo.`);
          return null;
        }

        await destruirCuenta(
          accountInfo,
          datosVotante.cuentaAddr,
          datosVotante.mnemonico,
          contrato.appAddr,
          contrato.tokenId,
          creadorAddr);

        return datosVotante;
      })
    );

    for (const datosVotante of datosVotantesProcesados) {
      if (!datosVotante) continue; // Si es null, no actualizamos
      contadorVotantes++;
      actualizarDatosVotante(bd, datosVotante);
    }

    console.log = consoleLog;
    console.timeEnd(loteLabel);
    console.timeLog(totalLabel);
  }

  console.log = consoleLog;
  console.log(`Total de cuentas eliminadas: ${contadorVotantes}`);

} catch (err) {
  console.error('Error en el test de votaciones:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}

//----------------------------------------------------------------------------

function actualizarDatosVotante(bd, datosVotante) {

  const { votanteId, eleccionId, ...datos } = datosVotante;

  const id = { votanteId, eleccionId };

  votanteDatosEleccionDAO.actualizar(bd, id, datos);
}

//----------------------------------------------------------------------------




