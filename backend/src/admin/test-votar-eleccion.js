#!/usr/bin/env node
import { algorand } from '../algorand/algorand.js';
import { toNote } from '../algorand/algoUtiles.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { votanteDatosEleccionDAO, eleccionDAO, partidoDAO } from '../modelo/DAOs.js';

import { ALGO_ENV } from '../utiles/constantes.js';

const TAM_LOTE = ALGO_ENV === 'localnet' ? 100 : 10;

const consoleLog = console.log;

//--------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotantes = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id> <número-votos>?`);
  process.exit(1);
}

//----------------------------------------------------------------------------

async function tienePapeleta(assetId, cuentaAddr) {

  const accountInfo = await algorand.asset.getAccountInformation(cuentaAddr, assetId);
  // console.log(accountInfo);

  return accountInfo.balance > 0n;
}

//----------------------------------------------------------------------------

let partidos = null
let pesos = []

function elegirPartido(bd, eleccionId) {

  if (!partidos) {
    partidos = partidoDAO.obtenerPorEleccion(bd, eleccionId);
    let sumaPesos = 0;
    for (const partido of partidos) {
      const peso = Math.random();
      pesos.push(peso);
      sumaPesos += peso;
    }
    pesos = pesos.map(peso => peso / sumaPesos);
  }

  const r = Math.random();

  let acumulado = 0;
  for (let i = 0; i < partidos.length; i++) {
    acumulado += pesos[i];
    if (r < acumulado) return partidos[i];
  }
  return partidos[partidos.length - 1];
}

//----------------------------------------------------------------------------

async function votar(mnemonico, appAddr, assetId, voto) {

  const cuenta = algorand.account.fromMnemonic(mnemonico);

  const resultadoTransfer = await algorand.send.assetTransfer(
    {
      sender: cuenta.addr,
      assetId: BigInt(assetId),
      amount: 1n,
      receiver: appAddr,
      signer: cuenta.signer,
      note: toNote(voto),
    },
    {
      skipWaiting: false,
      skipSimulate: true,
      maxRoundsToWaitForConfirmation: 12,
      maxFee: (2000).microAlgos(),
    }
  );

  // console.log(resultadoTransfer);

  return resultadoTransfer
}

//----------------------------------------------------------------------------

try {

  const bd = abrirConexionBD();

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  //--------------

  let contadorVotantes = 0;

  while (contadorVotantes < numeroVotantes) {

    const max = Math.min(TAM_LOTE, numeroVotantes - contadorVotantes);

    const datosVotantes = votanteDatosEleccionDAO.obtenerDatosVotantesVotar(bd, { eleccionId, max });

    if (!datosVotantes || datosVotantes.length === 0) {
      console.error(`No se encontraron más datos de votantes para la elección ${eleccionId}.`);
      break;
    }

    contadorVotantes += datosVotantes.length;
    console.log(`Votando ${datosVotantes.length} veces en la elección ${eleccionId}.`);

    const loteLabel = `Procesados ${datosVotantes.length} votantes. Total: ${contadorVotantes}/${numeroVotantes}`;
    console.time(loteLabel);

    //--------------
    // console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    const datosCalculados = await Promise.all(
      datosVotantes.map(async (datosVotante) => {

        if (await tienePapeleta(votante.tokenId, votante.cuentaAddr)) {

          console.log(`Votando ${votante.votanteId} en la elección ${eleccionId}.`);

          datosVotante.voto = elegirPartido(bd, datosVotante.eleccionId).siglas;
          datosVotante.votoEnc = await encriptarConClavePublica(JSON.stringify({
            siglas: datosVotante.voto,
            nonce: randomBytes(16).toString('hex')
          }), eleccion.claveVotoPublica);

          const voto = { voto: datosVotante.votoEnc };

          const resultadoVotar = await votar(
            votante.mnemonico,
            votante.appAddr,
            votante.tokenId, voto);

          datosVotante.votoTxId = resultadoVotar.txIds[0];
        }

        return datosVotante;
      })
    );

    for (const datosVotante of datosCalculados) {
      actualizarDatosVotante(bd, datosVotante);
    }

    console.log = consoleLog;
    console.timeEnd(loteLabel);
  }

} catch (err) {
  console.error('Error en el test de votaciones:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}

//----------------------------------------------------------------------------




