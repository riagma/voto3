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

  obtenerDatosVotantesCrear(bd, { eleccionId, max = 100 }) {

    return bd.prepare(`
      
      SELECT *
      FROM VotanteDatosEleccion 
      WHERE eleccionId = @eleccionId
      AND compromisoTxId = '-'
      ORDER BY compromisoIdx LIMIT @max
    
    `).all({ eleccionId, max });
  }

  obtenerDatosVotantesSolicitar(bd, { eleccionId, max = 100 }) {

    return bd.prepare(`
      
      SELECT *
      FROM VotanteDatosEleccion 
      WHERE eleccionId = @eleccionId
      AND compromisoTxId != '-'
      AND anuladorHash = '-'
      ORDER BY compromisoIdx LIMIT @max
    
    `).all({ eleccionId, max });
  }

  obtenerDatosVotantesVotar(bd, { eleccionId, max = 100 }) {

    return bd.prepare(`
      
      SELECT *
      FROM VotanteDatosEleccion 
      WHERE eleccionId = @eleccionId
      AND anuladorHash != '-'
      AND votoTxId = '-'
      ORDER BY compromisoIdx LIMIT @max
    
    `).all({ eleccionId, max });
  }
}