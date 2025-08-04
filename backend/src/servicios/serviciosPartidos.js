import { daos } from '../modelo/DAOs.js';

export const serviciosPartidos = {
  // Crear un partido
  crear(bd, datosPartido) {
    return daos.partido.crear(bd, datosPartido);
  },

  // Actualizar un partido
  actualizar(bd, siglas, datosPartido) {
    return daos.partido.actualizar(bd, { siglas }, datosPartido);
  },

  // Eliminar un partido
  eliminar(bd, siglas) {
    return daos.partido.eliminar(bd, { siglas });
  },

  // Obtener todos los partidos
  obtenerTodos(bd) {
    return daos.partido.obtenerTodos(bd);
  },

  // Obtener partido por siglas
  obtenerPorSiglas(bd, siglas) {
    return daos.partido.obtenerPorId(bd, { siglas });
  },

  // Obtener partidos por elección
  obtenerPorEleccion(bd, eleccionId) {
    return daos.partido.obtenerPorEleccion(bd, eleccionId);
  },

  // Asignar partido a elección
  asignarPartidoEleccion(bd, partidoId, eleccionId) {
    return daos.partidoEleccion.asignarPartidoEleccion(bd, partidoId, eleccionId);
  },

  // Eliminar partido de elección
  eliminarPartidoEleccion(bd, partidoId, eleccionId) {
    return daos.partidoEleccion.eliminarPartidoEleccion(bd, partidoId, eleccionId);
  },
};