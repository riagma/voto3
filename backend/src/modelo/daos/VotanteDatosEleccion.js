import { BaseDAO } from './BaseDAO.js';

export class VotanteDatosEleccionDAO extends BaseDAO {
  constructor() {
    super('VotanteDatosEleccion');
  }

  obtenerDatosVotantes(bd, { eleccionId, compromisoIdx, max = 100 }) {

    return bd.prepare(`
      
      SELECT *
      FROM VotanteDatosEleccion 
      WHERE eleccionId = @eleccionId
      AND compromisoIdx >= @compromisoIdx
      ORDER BY compromisoIdx LIMIT @max
    
    `).all({ eleccionId, compromisoIdx, max });
  }
}