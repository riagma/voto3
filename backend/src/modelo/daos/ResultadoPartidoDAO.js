import { BaseDAO } from './BaseDAO.js';

export class ResultadoPartidoDAO extends BaseDAO {
  constructor() {
    super('ResultadoPartido');
  }

  registrarResultado(bd, partidoId, eleccionId, votos, porcentaje) {
    return this.crear(bd, {
      partidoId,
      eleccionId,
      votos,
      porcentaje
    });
  }

  actualizarResultado(bd, partidoId, eleccionId, votos, porcentaje) {
    return this.actualizar(
      bd,
      { partidoId, eleccionId },
      { votos, porcentaje }
    );
  }

  eliminarResultado(bd, partidoId, eleccionId) {
    return this.eliminar(bd, { partidoId, eleccionId });
  }

  obtenerPorPartidoYEleccion(bd, partidoId, eleccionId) {
    return this.obtenerPorId(bd, { partidoId, eleccionId });
  }

  obtenerPorEleccion(bd, eleccionId) {
    return bd.prepare(
      `SELECT rp.*, p.nombre as nombrePartido
       FROM ${this.nombreTabla} rp
       INNER JOIN Partido p ON rp.partidoId = p.siglas
       WHERE rp.eleccionId = ?
       ORDER BY rp.votos DESC`
    ).all([eleccionId]);
  }

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