import { BaseDAO } from './BaseDAO.js';

export class ResultadoEleccionDAO extends BaseDAO {
  constructor() {
    super('ResultadoEleccion');
  }

  // Crear resultado (puedes usar this.crear directamente si los campos coinciden)
  crearResultado(bd, datos) {
    return this.crear(bd, {
      ...datos,
      fechaRecuento: datos.fechaRecuento || new Date().toISOString()
    });
  }

  // Obtener resultado por eleccionId (clave alternativa)
  obtenerPorEleccionId(bd, eleccionId) {
    return bd.prepare(
      'SELECT * FROM ResultadoEleccion WHERE eleccionId = ?'
    ).get([eleccionId]);
  }

  // Actualizar por eleccionId (clave alternativa)
  actualizarPorEleccionId(bd, eleccionId, datos) {
    return this.actualizar(bd, { eleccionId }, datos);
  }

  // Eliminar por eleccionId (clave alternativa)
  eliminarPorEleccionId(bd, eleccionId) {
    return this.eliminar(bd, { eleccionId });
  }

  // Obtener resultado completo con partidos
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