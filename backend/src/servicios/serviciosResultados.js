import { daos } from '../modelo/DAOs.js';

export const serviciosResultados = {
  // Operaciones para ResultadoEleccion

  crearResultadoEleccion(bd, datosResultado) {
    return daos.resultadoEleccion.crear(bd, datosResultado);
  },

  actualizarResultadoEleccion(bd, idEleccion, datosResultado) {
    return daos.resultadoEleccion.actualizar(bd, { idEleccion }, datosResultado);
  },

  eliminarResultadoEleccion(bd, idEleccion) {
    return daos.resultadoEleccion.eliminar(bd, { idEleccion });
  },

  obtenerResultadoEleccion(bd, idEleccion) {
    return daos.resultadoEleccion.obtenerPorEleccionId(bd, idEleccion);
  },

  // Operaciones para ResultadoPartido

  crearResultadoPartido(bd, datosResultado) {
    return daos.resultadoPartido.crear(bd, datosResultado);
  },

  actualizarResultadoPartido(bd, idEleccion, partidoId, datosResultado) {
    return daos.resultadoPartido.actualizar(bd, { idEleccion, partidoId }, datosResultado);
  },

  eliminarResultadoPartido(bd, idEleccion, partidoId) {
    return daos.resultadoPartido.eliminar(bd, { idEleccion, partidoId });
  },

  obtenerResultadosPartidos(bd, idEleccion) {
    return daos.resultadoPartido.obtenerPorEleccion(bd, idEleccion);
  },

  obtenerResultadoPartido(bd, idEleccion, partidoId) {
    return daos.resultadoPartido.obtenerPorId(bd, idEleccion, partidoId);
  }
};