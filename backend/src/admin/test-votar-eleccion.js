#!/usr/bin/env node
import { algorand } from '../algorand/algorand.js';
import { toNote } from '../algorand/algoUtiles.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { votanteDatosEleccionDAO, eleccionDAO } from '../modelo/DAOs.js';

import { encriptarConClavePublica} from '../utiles/utilesCrypto.js';

import { CLAVE_MAESTRA, CLAVE_PRUEBAS } from '../utiles/constantes.js';

//--------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotos = process.argv[3] ? parseInt(process.argv[3]) : 100;

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

  // console.log(eleccion);

  // if (!eleccion.claveVotoPublica || !eleccion.claveVotoPrivada ) {
  //   const { clavePublica, clavePrivada } = await generarParClavesRSA();
  //   const clavePrivadaEncriptada = await encriptar(clavePrivada, CLAVE_MAESTRA);
  //   eleccion.claveVotoPublica = clavePublica;
  //   eleccion.claveVotoPrivada = clavePrivadaEncriptada;
  //   eleccionDAO.actualizar(bd, { id: eleccionId }, { 
  //     claveVotoPublica: clavePublica, 
  //     claveVotoPrivada: clavePrivadaEncriptada 
  //   });
  // }


  // const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  // if (!contrato) {
  //   throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  // }

  // console.log(contrato);

  //--------------
  const consoleLog = console.log;
  console.log = function () {}; // Desactiva console.log para evitar demasiada salida
  //--------------

  let contadorVotos = 0;
  let compromisoIdx = 0;

  while (contadorVotos < numeroVotos) {

    const votantes = votanteDatosEleccionDAO.obtenerDatosVotantes(bd,
      {
        eleccionId,
        compromisoIdx,
        max: 1000
      });

    if (!votantes || votantes.length === 0) {
      console.log(`No hay votantes registrados para la elección ${eleccionId} con compromisoIdx ${compromisoIdx}.`);
      break;
    }
   
    compromisoIdx += votantes.length;
    
    for (const votante of votantes) {

      if(await tienePapeleta(votante.tokenId, votante.cuentaAddr)) {

        console.log(`Votando ${votante.votanteId} en la elección ${eleccionId}.`);

        // const voto = { voto: await encriptarConClavePublica(votante.voto, eleccion.claveVotoPublica) };
        const voto = { voto: votante.votoEnc };

        const resultadoVotar = await votar(
          votante.mnemonico, 
          votante.appAddr, 
          votante.tokenId, voto);

        contadorVotos++;

        votanteDatosEleccionDAO.actualizar(bd, 
          { 
            eleccionId, 
            votanteId: votante.votanteId 
          }, 
          { 
            votoTxId: resultadoVotar.txIds[0]
          });

        console.log(`Voto registrado para ${votante.votanteId} en la elección ${eleccionId}. TxId: ${resultadoVotar.txIds[0]}`);

        if(contadorVotos >= numeroVotos) {
          console.log(`Se alcanzó el número máximo de votos: ${numeroVotos}`);
          break;
        }
      }
    }
  }

  console.log = consoleLog;
  console.log(`Total de votos realizados: ${contadorVotos} para la elección ${eleccionId}.`);

} catch (err) {
  console.error('Error en el test de votaciones:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}



