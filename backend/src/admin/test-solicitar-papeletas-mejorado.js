#!/usr/bin/env node
import { algorand } from '../algorand/algorand.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { contratoBlockchainDAO, pruebaZKDAO, raizZKDAO, votanteDatosEleccionDAO } from '../modelo/DAOs.js';
import { registrarAnuladorEleccion, solicitarPapeletaEleccion } from '../algorand/registrarAnuladores.js';
import { calcularBloqueIndice, calcularPruebaDatosPublicos } from '../utiles/utilesArbol.js';

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

try {

  const bd = abrirConexionBD();

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });

  if (!contrato) {
    console.error(`No se encontró el contrato para la elección ${eleccionId}.`);
    process.exit(-1);
  }

  console.log('Datos del contrato:', contrato);

  const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: eleccionId });

  if (!pruebaZK) {
    console.error(`No se encontró la prueba ZK para la elección ${eleccionId}.`);
    process.exit(-1);
  }

  console.log('Datos de la prueba ZK:', pruebaZK);

  let raizZK = null;

  //--------------

  let contadorVotantes = 0;

  const totalLabel = 'Tiempo total transcurrido';
  console.time(totalLabel);

  while (contadorVotantes < numeroVotantes) {

    const max = Math.min(TAM_LOTE, numeroVotantes - contadorVotantes);

    const datosVotantes = votanteDatosEleccionDAO.obtenerDatosVotantesSolicitar(bd, { eleccionId, max });

    if (!datosVotantes || datosVotantes.length === 0) {
      console.error(`No se encontraron más datos de votantes para la elección ${eleccionId}.`);
      break;
    }

    contadorVotantes += datosVotantes.length;
    console.log(`Solicitando ${datosVotantes.length} papeletas de votantes en la elección ${eleccionId}.`);

    const loteLabel = `Procesados ${datosVotantes.length} votantes. Total: ${contadorVotantes}/${numeroVotantes}`;
    console.time(loteLabel);

    //--------------
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    const datosCalculados = await Promise.all(
      datosVotantes.map(async (datosVotante) => {

        const { bloque, bloqueIdx } = calcularBloqueIndice(
          pruebaZK.tamBloque,
          pruebaZK.tamResto,
          datosVotante.compromisoIdx);

        if (raizZK === null || raizZK.bloqueIdx !== bloque) {
          raizZK = raizZKDAO.obtenerPorId(bd, { pruebaId: eleccionId, bloqueIdx: bloque });
        }

        //--------------

        const proofLabel = `Prueba ZK Votante ${datosVotante.votanteId}`;
        console.time(proofLabel);

        const { proof, proofHash, publicInputs } = await calcularPruebaDatosPublicos({
          clave: datosVotante.secreto,
          anulador: datosVotante.anulador,
          bloqueIdx: bloqueIdx,
          ficheroMerkle11: pruebaZK.urlCircuito,
          ficheroCompromisos: raizZK.urlCompromisos,
        });

        console.timeEnd(proofLabel);

        //--------------

        const resultadoRegistrar = await registrarAnuladorEleccion(bd, {
          eleccionId,
          destinatario: datosVotante.cuentaAddr,
          proof,
          proofHash,
          publicInputs,
        });

        console.log('Resultado del registro:', resultadoRegistrar);

        //--------------

        if (resultadoRegistrar && resultadoRegistrar.txId) {

          await realizarOptInCuentaVotante(
            datosVotante.tokenId,
            datosVotante.mnemonico);
        }

        //--------------

        const anuladorHash = BigInt(publicInputs[1]).toString();

        await solicitarPapeletaEleccion(bd, { eleccionId, anulador: anuladorHash });

        datosVotante.anuladorHash = anuladorHash;

        return datosVotante;
      })
    );

    for (const datosVotante of datosCalculados) {
      actualizarDatosVotante(bd, datosVotante);
    }

    console.log = consoleLog;
    console.timeEnd(loteLabel);
    console.timeLog(totalLabel);
  }

  // console.timeEnd(totalLabel);


} catch (err) {
  console.log = consoleLog;
  console.error('Error solicitando papeletas votantes:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}

//----------------------------------------------------------------------------

async function realizarOptInCuentaVotante(assetId, mnemonico) {

  console.log(`Realizando Opt-In para la cuenta votante con assetId ${assetId} y mnemonico ${mnemonico}`);
  const cuenta = algorand.account.fromMnemonic(mnemonico);

  const resultadoOptIn = await algorand.send.assetOptIn(
    {
      sender: cuenta.addr,
      assetId: BigInt(assetId),
      signer: cuenta.signer,
    },
    {
      skipWaiting: false,
      skipSimulate: true,
      maxRoundsToWaitForConfirmation: 12,
      maxFee: (2000).microAlgos(),
    });

  // console.log(resultadoOptIn);

  return resultadoOptIn
}

//----------------------------------------------------------------------------

function actualizarDatosVotante(bd, datosVotante) {

  const { votanteId, eleccionId, ...datos } = datosVotante;

  const id = { votanteId, eleccionId };

  votanteDatosEleccionDAO.actualizar(bd, id, datos);
}

//----------------------------------------------------------------------------

