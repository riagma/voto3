#!/usr/bin/env node
import { indexer } from '../algorand/algorand.js';
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


const codificador = new TextEncoder();
// const decodificador = new TextDecoder();

const eleccionId = process.argv[2];

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id>`);
  process.exit(1);
}

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

  const resultadosEleccion = crearResultadosEleccion(bd, eleccionId);
  const resultadosPartidos = crearResultadosPartidos(bd, eleccionId);

  const prefijoNota = codificador.encode('{"voto":');

  let nextToken = undefined;

  do {
    const response = await indexer
      .lookupAssetTransactions(contrato.tokenId)
      .address(contrato.appAddr)
      .notePrefix(prefijoNota)
      .minRound(contrato.rondaInicialAnuladores)
      .limit(1000)
      .nextToken(nextToken) 
      .do();

    console.log(`Transacciones encontradas: ${response.transactions.length}`);

    for (const txn of response.transactions) {
      const nota = fromNote(txn.note);
      // console.log(nota);

      const votoDesencriptado = await desencriptarConClavePrivada(nota.voto, claveVotoPrivada);
      // console.log(`Voto desencriptado: (${votoDesencriptado})`);

      let voto;

      try {
        voto = JSON.parse(votoDesencriptado);
      } catch (error) {
        // console.error(`Error al parsear el voto: ${error.message}`);
        resultadosEleccion.votosNulos++;
        continue;
      } 

      // let voto = { siglas: votoDesencriptado };

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
    
    nextToken = response.nextToken? response.nextToken : undefined;

  } while (nextToken);

  for (const resultadosPartido of resultadosPartidos.values()) {

    if(resultadosEleccion.votantes > 0) {
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
      fechaEscrutinio: Date.now().toLocaleString(),
      claveVotoPrivada,
    });


} catch (err) {
  console.error('Error realizando el escrutinio de la elección:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

