import { BaseDAO } from './BaseDAO.js';

export class ResultadoEleccionDAO extends BaseDAO {
  constructor() {
    super('ResultadoEleccion');
  }

  crearResultado(bd, datos) {
    return this.crear(bd, {
      ...datos,
      fechaRecuento: datos.fechaRecuento || new Date().toISOString()
    });
  }

  obtenerPorEleccionId(bd, eleccionId) {
    return bd.prepare(
      'SELECT * FROM ResultadoEleccion WHERE eleccionId = ?'
    ).get([eleccionId]);
  }

  actualizarPorEleccionId(bd, eleccionId, datos) {
    return this.actualizar(bd, { eleccionId }, datos);
  }

  eliminarPorEleccionId(bd, eleccionId) {
    return this.eliminar(bd, { eleccionId });
  }

  obtenerResultadoCompleto(bd, eleccionId) {
    const resultado = this.obtenerPorId(bd, { eleccionId });
    if (!resultado) return null;

    const partidosResultados = bd.prepare(
      `SELECT p.nombre, p.siglas, rp.votos, rp.porcentaje
       FROM ResultadoPartido rp
       INNER JOIN Partido p ON rp.partidoId = p.siglas
       WHERE rp.eleccionId = ?`
    ).all([eleccionId]);

    return {
      ...resultado,
      partidos: partidosResultados
    };
  }
}