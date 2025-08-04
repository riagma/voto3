import { registroVotanteEleccionDAO } from '../modelo/DAOs.js';
import { registrarVotanteEleccion } from '../algorand/registrarCompromisos.js';

import { DatosVotanteEleccion } from '../tipos/DatosVotanteEleccion.js';

export const serviciosPapeletas = {

  // Obtener registro por DNI y elección
  obtenerRegistroVotanteEleccion(bd, votanteId, eleccionId) {
    console.log(`Obteniendo registro de votante ${votanteId} para elección ${eleccionId}`);

    // const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
    // if (!eleccion) {
    //   console.log(`Elección no encontrada: ${eleccionId}`);
    //   return null;
    // }
    const registro = registroVotanteEleccionDAO.obtenerPorId(bd, { votanteId, eleccionId });
    if (!registro) {
      console.log(`Registro no encontrado para votante ${votanteId} en elección ${eleccionId}`);
      return null;
    }
    return registro;

    // const datosVotanteEleccion = new DatosVotanteEleccion({ votanteId, eleccionId });

    // datosVotanteEleccion.compromiso = registro.compromiso;
    // datosVotanteEleccion.compromisoIdx = registro.compromisoIdx;
    // datosVotanteEleccion.compromisoTxId = registro.compromisoTxId;
    // datosVotanteEleccion.datosPrivados = registro.datosPrivados;

    // const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });

    // if (contrato) {
    //   datosVotanteEleccion.appId = contrato.appId;
    //   datosVotanteEleccion.appAddr = contrato.appAddr;
    //   datosVotanteEleccion.tokenId = contrato.tokenId;
    // }

    // return datosVotanteEleccion;
  },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------

  // Crear un registro de votante en elección
  obtenerPorId(bd, votanteId, eleccionId) {
    return registroVotanteEleccionDAO.obtenerPorId(bd, { votanteId, eleccionId });
  },

  // Crear un registro de votante en elección
  crear(bd, datosRegistro) {
    return registroVotanteEleccionDAO.crear(bd, datosRegistro);
  },

  // Actualizar un registro de votante en elección
  actualizar(bd, votanteId, eleccionId, datosRegistro) {
    return registroVotanteEleccionDAO.actualizar(bd, { votanteId, eleccionId }, datosRegistro);
  },

  // Eliminar un registro de votante en elección
  eliminar(bd, votanteId, eleccionId) {
    return registroVotanteEleccionDAO.eliminar(bd, { votanteId, eleccionId });
  },

  // Obtener todos los registros
  obtenerTodos(bd) {
    return registroVotanteEleccionDAO.obtenerTodos(bd);
  },

  // Obtener registros por elección
  obtenerPorEleccion(bd, eleccionId) {
    return registroVotanteEleccionDAO.obtenerPorEleccion(bd, eleccionId);
  },

  // Obtener registros por votante
  obtenerPorVotante(bd, votanteId) {
    return registroVotanteEleccionDAO.obtenerPorVotante(bd, votanteId);
  }
};