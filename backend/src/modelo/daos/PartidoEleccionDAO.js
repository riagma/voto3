import { BaseDAO } from './BaseDAO.js';

export class PartidoEleccionDAO extends BaseDAO {
  constructor() {
    super('PartidoEleccion');
  }

  asignarPartidoEleccion(bd, partidoId, eleccionId) {
    return this.crear(bd, { partidoId, eleccionId });
  }

  eliminarPartidoEleccion(bd, partidoId, eleccionId) {
    return bd
    .prepare('DELETE FROM PartidoEleccion WHERE partidoId = ? AND eleccionId = ?')
    .run([partidoId, eleccionId])
    
  }

  obtenerPartidosEleccion(bd, eleccionId) {
    return bd.prepare(
      `SELECT p.*, pe.eleccionId 
       FROM Partido p
       INNER JOIN PartidoEleccion pe ON p.siglas = pe.partidoId
       WHERE pe.eleccionId = ?`
      ).all([eleccionId]);
  }

  obtenerEleccionesPartido(bd, partidoId) {
    return bd.prepare(
      `SELECT e.*, pe.partidoId 
       FROM Eleccion e
       INNER JOIN PartidoEleccion pe ON e.id = pe.eleccionId
       WHERE pe.partidoId = ?`
    ).all([partidoId]);
  }
}