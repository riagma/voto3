#!/usr/bin/env node
import { algorand, indexer } from '../algorand/algorand.js';
import { fromNote } from '../algorand/algoUtiles.js';
import {
  eleccionDAO,
  contratoBlockchainDAO,
  resultadoEleccionDAO,
  partidoEleccionDAO,
  resultadoPartidoDAO
} from '../modelo/DAOs.js';

import { desencriptar, desencriptarConClavePrivada } from '../utiles/utilesCrypto.js';

import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { TextEncoder } from 'node:util';

import { CLAVE_MAESTRA } from '../utiles/constantes.js';

import { ALGO_ENV } from '../utiles/constantes.js';

const TAM_LOTE = ALGO_ENV === 'localnet' ? 1000 : 1000;

const consoleLog = console.log;

//--------------

const codificador = new TextEncoder();
// const decodificador = new TextDecoder();

const eleccionId = process.argv[2];

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id>`);
  process.exit(1);
}

//----------------------------------------------------------------------------

function crearResultadosEleccion(bd, eleccionId) {

  let resultadosEleccion = resultadoEleccionDAO.obtenerPorId(bd, { eleccionId });

  if (!resultadosEleccion) {

    resultadosEleccion = {
      eleccionId,
      censados: 0,
      votantes: 0,
      abstenciones: 0,
      votosBlancos: 0,
      votosNulos: 0,
      fechaRecuento: new Date().toISOString()
    };

    resultadoEleccionDAO.crear(bd, resultadosEleccion);

  } else {

    resultadosEleccion.censados = 0;
    resultadosEleccion.votantes = 0;
    resultadosEleccion.abstenciones = 0;
    resultadosEleccion.votosBlancos = 0;
    resultadosEleccion.votosNulos = 0;
    resultadosEleccion.fechaRecuento = new Date().toISOString();
  }

  return resultadosEleccion;
}

function crearResultadosPartidos(bd, eleccionId) {

  const resultadosPartidos = new Map();

  const partidos = partidoEleccionDAO.obtenerPartidosEleccion(bd, eleccionId);

  for (const partido of partidos) {

    // console.log(partido);

    let resultadosPartido = resultadoPartidoDAO.obtenerPorId(bd, { partidoId: partido.siglas, eleccionId });

    if (!resultadosPartido) {

      resultadosPartido = {
        partidoId: partido.siglas,
        eleccionId,
        votos: 0,
        porcentaje: 0
      };

      // console.log(resultadosPartido);

      resultadoPartidoDAO.crear(bd, resultadosPartido);

    } else {
      resultadosPartido.votos = 0;
      resultadosPartido.porcentaje = 0;
    }

    resultadosPartidos.set(resultadosPartido.partidoId, resultadosPartido);
  }

  return resultadosPartidos
}

try {

  const bd = abrirConexionBD();

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  console.log(eleccion.nombre);

  const claveVotoPrivada = await desencriptar(eleccion.claveVotoPrivadaEncriptada, CLAVE_MAESTRA);
  // console.log(`Clave privada desencriptada: ${claveVotoPrivada}`);

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  console.log(contrato);

  const globalState = await algorand.app.getGlobalState(BigInt(contrato.appId));
  if (!globalState) {
    throw new Error(`No se encontró el estado global de la aplicación con ID ${contrato.appId}`);
  }

  console.log('Global State:', globalState);

  const estadoContrato = globalState.estado_contrato ? Number(globalState.estado_contrato.value) : 0;
  console.log(`Estado del contrato: ${estadoContrato}`);

  if (estadoContrato !== 7) {
    throw new Error(`El contrato no está en estado de escrutinio. Estado actual: ${estadoContrato}`);
  } 
  
  const votantesRegistrados = globalState.contador_compromisos ? globalState.contador_compromisos.value : 0n;
  console.log(`Número de votantes registrados: ${votantesRegistrados}`);

  const papeletasSolicitadas = globalState.contador_anuladores ? globalState.contador_anuladores.value : 0n;
  console.log(`Número de papeletas solicitadas: ${papeletasSolicitadas}`);

  const papeletasEnviadas = globalState.papeletas_enviadas ? globalState.papeletas_enviadas.value : 0n;
  console.log(`Número de papeletas enviadas: ${papeletasEnviadas}`);

  // const accountInfo = await algorand.account.getInformation(contrato.appAddr);
  // console.log('AccountInfo:', accountInfo);

  // const papeleta = accountInfo.assets.find(asset => asset.assetId === BigInt(contrato.tokenId));
  // const numPapeletas = papeleta ? papeleta.amount : 0;
  // console.log(`Número de papeletas: ${numPapeletas}`);

  const resultadosEleccion = crearResultadosEleccion(bd, eleccionId);
  const resultadosPartidos = crearResultadosPartidos(bd, eleccionId);

  const totalLabel = 'Tiempo total transcurrido';
  console.time(totalLabel);

  const prefijoNota = codificador.encode('{"voto":');

  let totalTransaccionesBorrado = 0;
  let totalTransacciones = 0;

  let nextToken = undefined;

  do {
    const response = await indexer
      .lookupAssetTransactions(contrato.tokenId)
      .address(contrato.appAddr)
      .notePrefix(prefijoNota)
      .minRound(contrato.rondaInicialAnuladores)
      .maxRound(contrato.rondaFinalAnuladores)
      .limit(TAM_LOTE)
      .nextToken(nextToken)
      .do();

    totalTransacciones += response.transactions.length;

    const loteLabel = `Transacciones procesadas ${response.transactions.length}. Total: ${totalTransacciones}`;
    console.time(loteLabel);

    //--------------
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    for (const txn of response.transactions) {
      console.log(`Procesando transacción ${txn.id} de la ronda ${txn['confirmed-round']}`);
      console.log('Transacción:', txn);

      if (txn.assetTransferTransaction?.amount !== 1n) {
        console.log(`Transacción ${txn.id} no es una transferencia de 1 papeleta`);
        totalTransaccionesBorrado++;
        continue;
      }

      let nota;

      try {
        nota = fromNote(txn.note);
        // console.log(nota);
      } catch (error) {
        console.error(`Error al procesar la nota de la transacción ${txn.id}: ${error.message}`);
        resultadosEleccion.votosNulos++;
        continue;
      }

      let voto;

      try {
        const votoDesencriptado = await desencriptarConClavePrivada(nota.voto, claveVotoPrivada);
        voto = JSON.parse(votoDesencriptado);
        // console.log(`Voto: ${voto}`);
      } catch (error) {
        console.error(`Error al desencriptar el voto: ${error.message}`);
        resultadosEleccion.votosNulos++;
        continue;
      }

      if (!voto.siglas) {
        // console.error(`Voto en blanco: ${votoDesencriptado}`);
        resultadosEleccion.votosBlancos++;
        continue;
      }

      const resultadosPartido = resultadosPartidos.get(voto.siglas);

      if (!resultadosPartido) {
        // console.error(`Partido no encontrado para las siglas: ${voto.siglas}`);
        resultadosEleccion.votosNulos++;
        continue;
      }

      resultadosPartido.votos++;
      resultadosEleccion.votantes++;
    }

    nextToken = response.nextToken ? response.nextToken : undefined;

    console.log = consoleLog;
    console.timeEnd(loteLabel);
    console.timeLog(totalLabel);

  } while (nextToken);

  //--------------

  resultadosEleccion.censados = Number(votantesRegistrados);
  resultadosEleccion.abstenciones = resultadosEleccion.censados - resultadosEleccion.votantes;

  for (const resultadosPartido of resultadosPartidos.values()) {

    if (resultadosEleccion.votantes > 0) {
      resultadosPartido.porcentaje = (resultadosPartido.votos / resultadosEleccion.votantes) * 100;
    }

    resultadoPartidoDAO.actualizar(bd,
      {
        partidoId: resultadosPartido.partidoId,
        eleccionId: resultadosPartido.eleccionId
      },
      resultadosPartido);

    console.log(resultadosPartido);
  }

  resultadoEleccionDAO.actualizar(bd, { eleccionId }, resultadosEleccion);
  console.log(resultadosEleccion);

  eleccionDAO.actualizar(bd, { id: eleccionId },
    {
      // fechaEscrutinio: Date.now().toLocaleString(), OJO - No se usa este formato el frontend
      claveVotoPrivada,
    });

  console.log(`Total de cuentas eliminadas: ${totalTransaccionesBorrado}`);


} catch (err) {
  console.error('Error realizando el escrutinio de la elección:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

