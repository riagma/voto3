#!/usr/bin/env node
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';

import {
  votanteDatosEleccionDAO,
  partidoDAO,

  contratoBlockchainDAO,
  pruebaZKDAO,
  raizZKDAO,

} from '../modelo/DAOs.js';

import { calcularBloqueIndice, calcularPruebaDatosPublicos } from '../utiles/utilesArbol.js';

import { ALGO_ENV } from '../utiles/constantes.js';

const TAM_LOTE = ALGO_ENV === 'localnet' ? 100 : 10;

const consoleLog = console.log;

//----------------------------------------------------------------------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotantes = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id> <número-votantes>?`);
  process.exit(-1);
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

  let contadorVotantes = 0;

  //--------------

  while (contadorVotantes < numeroVotantes) {

    const max = Math.min(TAM_LOTE, numeroVotantes - contadorVotantes);

    const datosVotantes = votanteDatosEleccionDAO.obtenerDatosVotantesCrear(bd, { eleccionId, max });

    if (!datosVotantes || datosVotantes.length === 0) {
      console.error(`No se encontraron más datos de votantes para la elección ${eleccionId}.`);
      break;
    }

    contadorVotantes += datosVotantes.length;
    console.log(`Creando ${datosVotantes.length} datos de votantes en la elección ${eleccionId}.`);

    const loteLabel = `Procesados ${datosVotantes.length} votantes. Total: ${contadorVotantes}/${numeroVotantes}`;
    console.time(loteLabel);

    //--------------
    // console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    for (const datosVotante of datosVotantes) {

      datosVotante.appId = contrato.appId;
      datosVotante.appAddr = contrato.appAddr;
      datosVotante.tokenId = contrato.tokenId;

      datosVotante.numBloques = pruebaZK.numBloques;
      datosVotante.tamBloque = pruebaZK.tamBloque;
      datosVotante.tamResto = pruebaZK.tamResto;
      datosVotante.txIdRaizInicial = pruebaZK.txIdRaizInicial;
      datosVotante.urlCircuito = pruebaZK.urlCircuito;

      const { bloque, bloqueIdx } = calcularBloqueIndice(
        datosVotante.tamBloque,
        datosVotante.tamResto,
        datosVotante.compromisoIdx);

      datosVotante.bloque = bloque;
      datosVotante.bloqueIdx = bloqueIdx;

      if (raizZK === null || raizZK.bloqueIdx !== datosVotante.bloque) {
        raizZK = raizZKDAO.obtenerPorId(bd, {
          pruebaId: datosVotante.eleccionId,
          bloqueIdx: datosVotante.bloque
        });
      }

      datosVotante.raiz = raizZK.raiz;
      datosVotante.txIdRaiz = raizZK.txIdRaiz;
      datosVotante.urlCompromisos = raizZK.urlCompromisos;

      const proofLabel = `Prueba ZK Votante ${datosVotante.votanteId}`;
      console.time(proofLabel);

      const { proof, proofHash, publicInputs } = await calcularPruebaDatosPublicos({
        clave: datosVotante.secreto,
        anulador: datosVotante.anulador,
        bloqueIdx: datosVotante.bloqueIdx,
        ficheroMerkle11: datosVotante.urlCircuito,
        ficheroCompromisos: datosVotante.urlCompromisos,
      });

      console.timeEnd(proofLabel);

      // Codificar el proof a Base64 - OJO - proof.toString('base64') - NO VALE !!
      datosVotante.proof = btoa(String.fromCharCode(...proof)); //proof.toString('base64');
      datosVotante.claveVotoPublica = proofHash; // OJO truco claveVotoPublica 
      datosVotante.publicInputs = JSON.stringify(publicInputs);

      actualizarDatosVotante(bd, datosVotante);
    }

    console.log = consoleLog;
    console.timeEnd(loteLabel);
  }

  console.log = consoleLog;
  console.log(`Se han creado ${contadorVotantes} datos de votantes para la elección ${eleccionId}.`);

} catch (err) {
  console.log = consoleLog;
  console.error('Error abriendo el registro de compromisos:', err);
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






