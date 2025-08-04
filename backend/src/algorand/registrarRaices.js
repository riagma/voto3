// src/deployer/deployContract.js
import { contratoBlockchainDAO, pruebaZKDAO, raizZKDAO } from '../modelo/DAOs.js';

import {
  leerEstadoContrato,
  abrirRegistroRaices,
  registrarRaiz,
  cerrarRegistroRaices,
  leerDatosRaices

} from './serviciosVoto3.js';

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function abrirRegistroRaicesEleccion(bd, eleccionId) {

  console.log(`Abriendo registro de raices para la elección ${eleccionId}`);

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  const resultadoLeerEstado = await leerEstadoContrato(bd, { contratoId: eleccionId });
  console.log(`Estado de la elección ${eleccionId}: ${resultadoLeerEstado}`);

  if (resultadoLeerEstado === 3n) {

    const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: eleccionId });
    if (!pruebaZK) {
      throw new Error(`No se ha encontrado una prueba ZK para la elección ${eleccionId}`);
    }

    const resultadoAbrir = await abrirRegistroRaices(bd, {
      contratoId: eleccionId,
      numBloques: pruebaZK.numBloques,
      tamBloque: pruebaZK.tamBloque,
      tamResto: pruebaZK.tamResto,
    });
    console.log(`Registro de raices abierto para la elección ${eleccionId}: ${resultadoAbrir.txId}`);

  } else if (resultadoLeerEstado === 4n) {
    console.log(`El registro de raices para la ${eleccionId} ya estaba abierto.`);

  } else {
    console.log(`La elección ${eleccionId}:${contrato.appId} no está en estado adecuado (3) != (${resultadoLeerEstado}).`);
  }
}

//----------------------------------------------------------------------------

export async function registrarRaicesEleccion(bd, eleccionId) {

  console.log(`Registrando raices para ${eleccionId}`);

  //-------------

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  try {

    let txnId_1 = '';
    let txnId_10 = '';
    let txnId_100 = '';

    const raices = raizZKDAO.obtenerPorPruebaId(bd, eleccionId);

    for (let idx = raices.length - 1; idx >= 0; idx--) {

      const raiz = raices[idx];
      
      console.log(`Registrando raiz: ${raiz.bloqueIdx} - ${raiz.raiz}`);

      if (idx + 1 < raices.length) {
        txnId_1 = raices[idx + 1].txIdRaiz;
      }
      if (idx + 10 < raices.length) {
        txnId_10 = raices[idx + 10].txIdRaiz;
      }
      if (idx + 100 < raices.length) {
        txnId_100 = raices[idx + 100].txIdRaiz;
      }

      if (raiz.txIdRaiz === 'TEMPORAL') {

        const raizNote = {
          idx: raiz.bloqueIdx.toString(),
          raiz: raiz.raiz,
          ipfs: raiz.ipfsCompromisos,
          t1: txnId_1,
          t10: txnId_10,
          t100: txnId_100,
        };

        console.log(raizNote);
        const resultadoRegistrar = await registrarRaiz(bd, { contratoId: eleccionId, raiz: raizNote });

        raiz.txIdRaiz = resultadoRegistrar.txId;

        raizZKDAO.actualizar(bd,
          {
            pruebaId: raiz.pruebaId,
            bloqueIdx: raiz.bloqueIdx,
          },
          {
            txIdRaiz: resultadoRegistrar.txId,
          });
      }

      console.log(`Raiz registrada: ${raiz.txIdRaiz}`);
    }

    pruebaZKDAO.actualizar(bd, { pruebaId: eleccionId }, { txIdRaizInicial: raices[0].txIdRaiz });

  } catch (Error) {
    // TODO: Buscar el assert o su descripción en el error
    console.error(`Error al registrar raíz en la elección ${eleccionId}:`, Error.message);
  }
}

//----------------------------------------------------------------------------

export async function cerrarRegistroRaicesEleccion(bd, eleccionId) {

  console.log(`Cerrando registro de raices para la elección ${eleccionId}`);

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  const resultadoLeerEstado = await leerEstadoContrato(bd, { contratoId: eleccionId });
  console.log(`Estado de la elección ${eleccionId}: ${resultadoLeerEstado}`);

  if (resultadoLeerEstado === 4n) {
    const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: eleccionId });
    if (!pruebaZK) {
      throw new Error(`No se ha encontrado una prueba ZK para la elección ${eleccionId}`);
    }

    const resultadoCerrar = await cerrarRegistroRaices(bd, { 
      contratoId: eleccionId, 
      txIdRaizInicial: pruebaZK.txIdRaizInicial 
    });
    console.log(`Registro de raices cerrado para la elección ${eleccionId}: ${resultadoCerrar}`);

  } else if (resultadoLeerEstado === 5n) {
    console.log(`El registro de raices para la ${eleccionId} ya está cerrado.`);

  } else {
    console.log(`La elección ${eleccionId}:${contrato.appId} no está en estado adecuado (5) != (${resultadoLeerEstado}).`);
  }
}

//----------------------------------------------------------------------------

export async function leerDatosRaicesEleccion(bd, eleccionId) {

  console.log(`Consultando los datos de las raices para la elección ${eleccionId}`);

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  try {

    const resultadoLeer = await leerDatosRaices(bd, { contratoId: eleccionId });

    console.log(`Datos de raices leídos para la elección ${eleccionId}:`, JSON.stringify(resultadoLeer, null, 2));

  return resultadoLeer;

  } catch (Error) {
    // TODO: Buscar el assert o su descripción en el error
    console.error(`Error al consultar los datos de las raices de la elección ${eleccionId}:`, Error.message);
  }

}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
