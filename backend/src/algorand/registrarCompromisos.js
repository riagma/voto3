import { votanteDAO, eleccionDAO, registroVotanteEleccionDAO, contratoBlockchainDAO } from '../modelo/DAOs.js';

import {
  leerEstadoContrato,
  abrirRegistroCompromisos,
  cerrarRegistroCompromisos,
  registrarCompromiso

} from './serviciosVoto3.js';

import { calcularSha256 } from '../utiles/utilesCrypto.js';

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function abrirRegistroCompromisosEleccion(bd, eleccionId) {

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  const resultadoLeerEstado = await leerEstadoContrato(bd, { contratoId: eleccionId });
  console.log(`Estado de la elección ${eleccionId}: ${resultadoLeerEstado}`);

  if (resultadoLeerEstado === 1n) {
    console.log(`Abriendo registro de compromisos para la elección ${eleccionId}:${contrato.appId}`);
    const { round } = await abrirRegistroCompromisos(bd, { contratoId: eleccionId });
    contratoBlockchainDAO.actualizar(bd, { contratoId: eleccionId }, { rondaInicialCompromisos: round });
    console.log(`Registro de compromisos abierto para la elección ${eleccionId}:${contrato.appId}:${round}`);
    // eleccionDAO.actualizar(bd, { id: eleccionId }, { fechaInicioRegistro: Date.now().toLocaleString() });

  } else if (resultadoLeerEstado === 2n) {
    console.log(`El registro de compromisos de la elección ${eleccionId} ya está abierto.`);

  } else {
    console.log(`La elección ${eleccionId}:${contrato.appId} no está en estado adecuado (1) != (${resultadoLeerEstado}).`);
  }
}

//----------------------------------------------------------------------------

export async function registrarVotanteEleccion(bd, { votanteId, eleccionId, compromiso, datosPrivados = null }) {

  console.log(`Registrando ${compromiso} para ${eleccionId} del votante ${votanteId}`);

  //-------------

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  try {

    const votante = votanteDAO.obtenerPorId(bd, { dni: votanteId });

    if (!votante) {
      throw new Error(`No se encontró el votante con DNI ${votanteId}`);
    }

    let registroVotante = registroVotanteEleccionDAO.obtenerPorId(bd, { votanteId, eleccionId });

    if (registroVotante && registroVotante.compromisoTxId !== 'TEMPORAL') {
      console.log(`El votante ${votanteId} ya está registrado en la elección ${eleccionId} con un compromiso previo.`);
      return registroVotante.compromisoIdx;

    } else if (!registroVotante) {

      registroVotante = registroVotanteEleccionDAO.registrarVotanteEleccion(bd, {
        votanteId,
        eleccionId,
        compromiso,
        compromisoTxId: 'TEMPORAL',
        datosPrivados
      });
    }

    const compromisoNote = {
      idx: registroVotante.compromisoIdx,
      dni: calcularSha256(votanteId),
      cmp: compromiso,
    };

    // console.log(`Compromiso a registrar: ${JSON.stringify(compromisoNote)}`);

    const resultadoRegistrar = await registrarCompromiso(bd, {
      contratoId: eleccionId,
      compromiso: compromisoNote
    });

    console.log(resultadoRegistrar);

    registroVotanteEleccionDAO.actualizar(bd, { votanteId, eleccionId }, { compromisoTxId: resultadoRegistrar.txId });

    console.log(`Compromiso registrado para el votante ${votanteId} en la elección ${eleccionId}}`);
    console.log(`Transacción registrada: ${resultadoRegistrar.txId}`);

    return registroVotante.compromisoIdx;

  } catch (error) {
    // TODO: Buscar el assert o su descripción en el error
    console.error(`Error al registrar compromiso en la elección ${eleccionId}:`, error.message);
    error.message.includes('assert') && console.error('Asegúrate de que el contrato esté desplegado y en estado adecuado.');
    throw new Error(`Error al registrar compromiso: ${error.message}`);
  }
}

//----------------------------------------------------------------------------

export async function cerrarRegistroCompromisosEleccion(bd, eleccionId) {

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  const resultadoLeerEstado = await leerEstadoContrato(bd, { contratoId: eleccionId });
  console.log(`Estado de la elección ${eleccionId}: ${resultadoLeerEstado}`);

  if (resultadoLeerEstado === 2n) {
    console.log(`Cerrando registro de compromisos para la elección ${eleccionId}:${contrato.appId}`);
    const { round } = await cerrarRegistroCompromisos(bd, { contratoId: eleccionId });
    contratoBlockchainDAO.actualizar(bd, { contratoId: eleccionId }, { rondaFinalCompromisos: round });
    console.log(`Registro de compromisos cerrado para la elección ${eleccionId}:${contrato.appId}`);
    // eleccionDAO.actualizar(bd, { id: eleccionId }, { fechaFinRegistro: Date.now().toLocaleString() });

  } else if (resultadoLeerEstado === 3n) {
    console.log(`La elección ${eleccionId}:${contrato.appId} ya estaba cerrada.`);

  } else {
    console.log(`
      La elección ${eleccionId}:${contrato.appId} 
      no está en estado adecuado (2) != (${resultadoLeerEstado}).`);
  }
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
