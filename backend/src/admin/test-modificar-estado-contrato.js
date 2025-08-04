#!/usr/bin/env node
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { eleccionDAO, contratoBlockchainDAO } from '../modelo/DAOs.js';

import { leerEstadoContrato, establecerEstadoContrato } from '../algorand/serviciosVoto3.js';

import { preguntarUsuario } from '../utiles/utilesScripts.js';

//--------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const nuevoEstado = process.argv[3] ? parseInt(process.argv[3]) : undefined;

if (!eleccionId || !nuevoEstado) {
  console.error(`Uso: node ${process.argv[1]} <contrato-id> <nuevo-estado>`);
  process.exit(1);
}

//----------------------------------------------------------------------------

try {

  const bd = abrirConexionBD();

  const contratoId = eleccionId;

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${contratoId}`);
  }

  console.log(contrato);

  const resultadoLeerEstado = await leerEstadoContrato(bd, { contratoId });
  console.log(`Estado del contrato de la elección ${contratoId}: ${resultadoLeerEstado}`);

  let modificarlo = await preguntarUsuario(
    `Si se modifica el estado de su contrato puede invalidar la elección: ${eleccion.nombre}\n` + 
    '¿Desea modificarlo? (s/n): '
  );

  if(modificarlo) {
    modificarlo = await preguntarUsuario('¿Está seguro? (s/n): ');
  }

  if (modificarlo) {
    const resultadoEstablecerEstado = await establecerEstadoContrato(bd, { contratoId, estado: nuevoEstado });
    console.log(`Estado del contrato de la elección ${contratoId} establecido a ${resultadoEstablecerEstado}`);
  } else {
      console.log('Operación cancelada.');
      process.exit(0);
  }

} catch (err) {
  console.error('Error en el test de votaciones:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}



