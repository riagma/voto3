import { BaseDAO } from './BaseDAO.js';

export class ResultadoPartidoDAO extends BaseDAO {
  constructor() {
    super('ResultadoPartido');
  }

  // Registrar resultado (puedes usar this.crear directamente)
  registrarResultado(bd, partidoId, eleccionId, votos, porcentaje) {
    return this.crear(bd, {
      partidoId,
      eleccionId,
      votos,
      porcentaje
    });
  }

  // Actualizar resultado por partidoId y eleccionId (clave compuesta)
  actualizarResultado(bd, partidoId, eleccionId, votos, porcentaje) {
    return this.actualizar(
      bd,
      { partidoId, eleccionId },
      { votos, porcentaje }
    );
  }

  // Eliminar resultado por partidoId y eleccionId (clave compuesta)
  eliminarResultado(bd, partidoId, eleccionId) {
    return this.eliminar(bd, { partidoId, eleccionId });
  }

  // Obtener resultado por partidoId y eleccionId (clave compuesta)
  obtenerPorPartidoYEleccion(bd, partidoId, eleccionId) {
    return this.obtenerPorId(bd, { partidoId, eleccionId });
  }

  // Obtener todos los resultados de una elección
  obtenerPorEleccion(bd, eleccionId) {
    return bd.prepare(
      `SELECT rp.*, p.nombre as nombrePartido
       FROM ${this.nombreTabla} rp
       INNER JOIN Partido p ON rp.partidoId = p.siglas
       WHERE rp.eleccionId = ?
       ORDER BY rp.votos DESC`
    ).all([eleccionId]);
  }

  // Obtener todos los resultados de un partido en todas las elecciones
  obtenerPorPartido(bd, partidoId) {
    return bd.prepare(
      `SELECT rp.*, e.nombre as nombreEleccion
       FROM ${this.nombreTabla} rp
       INNER JOIN Eleccion e ON rp.eleccionId = e.id
       WHERE rp.partidoId = ?
       ORDER BY e.fechaEscrutinio DESC`
    ).all([partidoId]);
  }
}