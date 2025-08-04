import { BaseDAO } from './BaseDAO.js';

export class AnuladorZKDAO extends BaseDAO {
  constructor() {
    super('AnuladorZK');
  }

  obtenerPorPruebaId(bd, pruebaId) {
    return bd.prepare('SELECT * FROM AnuladorZK WHERE pruebaId = ?').all(pruebaId);
  }
  
  eliminarPorPruebaId(bd, pruebaId) {
    return bd.prepare('DELETE FROM AnuladorZK WHERE pruebaId = ?').run(pruebaId).changes;
  }
}