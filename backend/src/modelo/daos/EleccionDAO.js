import { BaseDAO } from './BaseDAO.js';

export class EleccionDAO extends BaseDAO {
  constructor() {
    super('Eleccion');
  }

  actualizarContratoEleccion(bd, id, contratoId) {
    const resultado = bd.prepare('UPDATE Eleccion SET contratoId = ? WHERE id = ?').run(contratoId, id);
    return resultado.changes;
  }
}