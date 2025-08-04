import { BaseDAO } from './BaseDAO.js';

export class PruebaZKDAO extends BaseDAO {
  constructor() {
    super('PruebaZK');
  }

  obtenerPorRaiz(bd, { pruebaId, raiz }) {
    return bd.prepare(
      'SELECT * FROM PruebaZK WHERE pruebaId = ? AND raiz = ?'
    ).get([pruebaId, raiz]);
  }
}