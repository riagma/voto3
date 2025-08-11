import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { UltraHonkBackend } from '@aztec/bb.js';

import { anuladorZKDAO, contratoBlockchainDAO, raizZKDAO, eleccionDAO } from '../modelo/DAOs.js';

import { MERKLE11_JSON } from '../utiles/constantes.js';

import {
  leerEstadoContrato,
  abrirRegistroAnuladores,
  cerrarRegistroAnuladores,
  registrarAnulador,
  enviarPapeleta

} from './serviciosVoto3.js';

//--------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ficheroMerkle11 = path.join(__dirname, '../../', MERKLE11_JSON);

const merkle11Texto = await fs.readFile(ficheroMerkle11, 'utf8');
const merkle11Json = JSON.parse(merkle11Texto);
const honk = new UltraHonkBackend(merkle11Json.bytecode, { threads: 8 });

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function abrirRegistroAnuladoresEleccion(bd, eleccionId) {

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

  if (resultadoLeerEstado === 5n) {
    console.log(`Abriendo registro de anuladores para la elección ${eleccionId}:${contrato.appId}`);
    const resultadoAbrir = await abrirRegistroAnuladores(bd, { contratoId: eleccionId });
    console.log(`Registro de anuladores abierto para la elección ${eleccionId}:${contrato.appId}`);
    contratoBlockchainDAO.actualizar(bd, { contratoId: eleccionId }, { rondaInicialAnuladores: resultadoAbrir.ronda });
    // eleccionDAO.actualizar(bd, { id: eleccionId }, { fechaInicioVotacion: Date.now().toLocaleString() });

  } else if (resultadoLeerEstado === 6n) {
    console.log(`El registro de anuladores de la elección ${eleccionId} ya estaba abierto.`);

  } else {
    console.log(`La elección ${eleccionId}:${contrato.appId} no está en estado adecuado (5) != (${resultadoLeerEstado}).`);
  }
}

//----------------------------------------------------------------------------

export async function registrarAnuladorEleccion(bd, { eleccionId, destinatario, proof, proofHash, publicInputs }) {

  console.log(`Registrando ${destinatario} para ${eleccionId}`);

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

  try {

    const raiz = BigInt(publicInputs[0]).toString();
    const anulador = BigInt(publicInputs[1]).toString();

    const raizZK = raizZKDAO.obtenerPorRaiz(bd, { pruebaId: eleccionId, raiz });

    if (!raizZK) {
      console.log(`No se encontró la raíz ZK para la elección ${eleccionId} con raíz ${raiz}`);
      return false;
    }

    console.log(`Registrando ${anulador} de ${raizZK.bloqueIdx}:${raiz}`);

    const anuladorZK = anuladorZKDAO.obtenerPorId(bd, { pruebaId: eleccionId, anulador });

    if (anuladorZK && anuladorZK.registroTxId !== 'TEMPORAL') {
      console.log(`El anulador ${anulador} ya está registrado para la elección ${eleccionId}`);
      return false;
    }

    console.log(`Verificando ${proofHash}\n`, publicInputs);
    const pruebaVerificada = await honk.verifyProof({ proof, publicInputs });
    console.log(`Prueba verificada: ${pruebaVerificada}`);

    if (!pruebaVerificada) {
      console.log(`La prueba ZK no es válida para el anulador ${anulador} en la elección ${eleccionId}`);
      return false;
    }

    if (!anuladorZK) {
      anuladorZKDAO.crear(bd, {
        pruebaId: eleccionId,
        anulador,
        bloqueIdx: raizZK.bloqueIdx,
        destinatario,
        registroTxId: 'TEMPORAL',
        papeletaTxId: 'TEMPORAL',
        votacionTxId: 'TEMPORAL',
      });
    }

    const anuladorNote = { anulador, destinatario }

    console.log("Registrando anulador:", anuladorNote);

    const resultadoRegistrar = await registrarAnulador(bd, {
      contratoId: eleccionId,
      destinatario,
      anuladorNote
    });

    anuladorZKDAO.actualizar(bd, { pruebaId: eleccionId, anulador }, { registroTxId: resultadoRegistrar.txId });

    console.log(`Anulador registrado en la elección ${eleccionId} con txId: ${resultadoRegistrar.txId}`);

    return resultadoRegistrar;

  } catch (Error) {
    // TODO: Buscar el assert o su descripción en el error
    console.error(`Error al registrar anulador en la elección ${eleccionId}:`, Error.message);
    return undefined
  }
}

//----------------------------------------------------------------------------

export async function solicitarPapeletaEleccion(bd, { eleccionId, anulador }) {

  console.log(`Enviando papeleta ${anulador} para ${eleccionId}`);

  //-------------

  const registroAnulador = anuladorZKDAO.obtenerPorId(bd, { pruebaId: eleccionId, anulador });

  if (!registroAnulador) {
    throw new Error(`No se encontró el registro del anulador ${anulador} para la elección ${eleccionId}`);
  }

  if (registroAnulador.papeletaTxId !== 'TEMPORAL') {
    throw new Error(
      "El destinatario " + destinatario +
      " ya recibió " + registroAnulador.papeletaTxId +
      " una papeleta para la elección " + eleccionId
    );
  }

  try {
    const resultadoEnviar = await enviarPapeleta(bd, {
      contratoId: eleccionId,
      destinatario: registroAnulador.destinatario
    });

    anuladorZKDAO.actualizar(bd, { pruebaId: eleccionId, anulador }, { papeletaTxId: resultadoEnviar.txId });

    console.log(`Papeleta de elección ${eleccionId} enviada al destinatario ${registroAnulador.destinatario}`);

    return resultadoEnviar;

  } catch (Error) {
    // TODO: Buscar el assert o su descripción en el error
    console.error(`Error al enviar la papeleta a ${destinatario}:`, Error.message);
  }
}

//----------------------------------------------------------------------------

export async function cerrarRegistroAnuladoresEleccion(bd, eleccionId) {

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

  if (resultadoLeerEstado === 6n) {
    console.log(`Cerrando registro de anuladores para la elección ${eleccionId}:${contrato.appId}`);
    const resultadoCerrar = await cerrarRegistroAnuladores(bd, { contratoId: eleccionId });
    console.log(`Registro de anuladores cerrado para la elección ${eleccionId}:${contrato.appId}`);
    contratoBlockchainDAO.actualizar(bd, { contratoId: eleccionId }, { rondaFinalAnuladores: resultadoCerrar.ronda });
    // eleccionDAO.actualizar(bd, { id: eleccionId }, { fechaFinVotacion: Date.now().toLocaleString() });

  } else if (resultadoLeerEstado === 7n) {
    console.log(`La elección ${eleccionId}:${contrato.appId} ya estaba cerrada.`);

  } else {
    console.log(`
      La elección ${eleccionId}:${contrato.appId} 
      no está en estado adecuado (6) != (${resultadoLeerEstado}).`);
  }
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
