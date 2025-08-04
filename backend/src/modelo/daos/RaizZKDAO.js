import { BaseDAO } from './BaseDAO.js';

export class RaizZKDAO extends BaseDAO {
  constructor() {
    super('RaizZK');
  }

  obtenerPorPruebaId(bd, pruebaId) {
    return bd.prepare('SELECT * FROM RaizZK WHERE pruebaId = ?').all(pruebaId);
  }
  
  eliminarPorPruebaId(bd, pruebaId) {
    return bd.prepare('DELETE FROM RaizZK WHERE pruebaId = ?').run(pruebaId).changes;
  }

  obtenerPorRaiz(bd, { pruebaId, raiz }) {
    return bd.prepare('SELECT * FROM RaizZK WHERE pruebaId = ? AND raiz = ?').get(pruebaId, raiz);
  }
}