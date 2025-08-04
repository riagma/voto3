import { BaseDAO } from './BaseDAO.js';

export class PartidoDAO extends BaseDAO {
  constructor() {
    super('Partido');
  }

  obtenerPorNombre(bd, nombre) {
    return bd.prepare('SELECT * FROM Partido WHERE nombre = ?').get([nombre]);
  }

  obtenerPorEleccion(bd, eleccionId) {
    return bd.prepare(
      `SELECT p.* 
       FROM Partido p
       INNER JOIN PartidoEleccion pe ON p.siglas = pe.partidoId
       WHERE pe.eleccionId = ?`
    ).all([eleccionId]);
  }
}