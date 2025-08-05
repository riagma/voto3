import { BaseDAO } from './BaseDAO.js';

export class RegistroVotanteEleccionDAO extends BaseDAO {
  constructor() {
    super('RegistroVotanteEleccion');
  }

  obtenerPorEleccion(bd, eleccionId) {
    return bd.prepare(
      'SELECT * FROM RegistroVotanteEleccion WHERE eleccionId = ?'
    ).all([eleccionId]);
  }

  obtenerPorVotante(bd, votanteId) {
    return bd.prepare(
      'SELECT * FROM RegistroVotanteEleccion WHERE votanteId = ?'
    ).all([votanteId]);
  }

  obtenerSiguienteIdx(bd, eleccionId) {

    return bd.prepare(`
        SELECT COALESCE(MAX(compromisoIdx), -1) + 1 AS nuevo_idx
        FROM RegistroVotanteEleccion
        WHERE eleccionId = ?
      `).get(eleccionId).nuevo_idx;
   }

  //----------------------------------------------------------------------------

  registrarVotanteEleccion(bd, { votanteId, eleccionId, compromiso, compromisoTxId, datosPrivados = null }) {

    const registrar = bd.transaction((votanteId, eleccionId, compromiso, compromisoTxId, datosPrivados) => {

      const registro = {
        votanteId,
        eleccionId,
        compromiso,
        compromisoIdx: this.obtenerSiguienteIdx(bd, eleccionId),
        compromisoTxId,
        fechaRegistro: new Date().toISOString(),
        datosPrivados
      };

      // console.log(`Votante a registrar: ${registro.votanteId}`);

      this.crear(bd, registro);

      // console.log(`Votante registrado: ${registro.compromisoIdx}`);


      return registro;
    });

    return registrar(votanteId, eleccionId, compromiso, compromisoTxId, datosPrivados);
  }

  //----------------------------------------------------------------------------

  obtenerCompromisosEleccion(bd, { eleccionId, compromisoIdx, max = 100 }) {

    return bd.prepare(`
      
      SELECT compromiso, compromisoIdx
      FROM RegistroVotanteEleccion 
      WHERE eleccionId = @eleccionId
      AND compromisoIdx >= @compromisoIdx
      ORDER BY compromisoIdx LIMIT @max
    
    `).all({ eleccionId, compromisoIdx, max });
  }

  //----------------------------------------------------------------------------

  obtenerRegistrosEleccion(bd, { eleccionId, compromisoIdx, max = 100 }) {

    return bd.prepare(`
      
      SELECT *
      FROM RegistroVotanteEleccion 
      WHERE eleccionId = @eleccionId
      AND compromisoIdx >= @compromisoIdx
      ORDER BY compromisoIdx LIMIT @max
    
    `).all({ eleccionId, compromisoIdx, max });
  }

  //----------------------------------------------------------------------------
}