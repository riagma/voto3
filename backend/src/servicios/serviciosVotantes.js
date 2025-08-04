import { daos } from '../modelo/DAOs.js';

export const serviciosVotantes = {
  // Crear un votante
  async crear(bd, datosVotante) {
    return await daos.votante.crear(bd, datosVotante);
  },

  // Actualizar un votante
  async actualizar(bd, dni, datosVotante) {
    return await daos.votante.actualizar(bd, { dni }, datosVotante);
  },

  // Eliminar un votante
  async eliminar(bd, dni) {
    return await daos.votante.eliminar(bd, { dni });
  },

  // Obtener todos los votantes
  async obtenerTodos(bd) {
    return await daos.votante.obtenerTodos(bd);
  },

  // Obtener votante por DNI
  async obtenerPorDni(bd, dni) {
    return await daos.votante.obtenerPorId(bd, { dni });
  }
};