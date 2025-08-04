import { BaseDAO } from './BaseDAO.js';

export class VotanteDAO extends BaseDAO {
  constructor() {
    super('Votante');
  }

  obtenerPorDNI(bd, dni) {
    console.log('Obteniendo votante por DNI:', dni);
    return this.obtenerPorId(bd, { dni });
  }

  obtenerPorEmail(bd, email) {
    return bd.prepare('SELECT * FROM Votante WHERE email = ?').get(email);
  }

  actualizarContrasena(bd, dni, hashContrasena) {
    return this.actualizar(
      bd,
      { dni },
      { hashContrasena }
    );
  }

  obtenerVotantesSinRegistro(bd, eleccionId, max = 100) {
    const filtroConExistencia = bd.prepare
    (`
      SELECT v.*
      FROM Votante AS v
      WHERE NOT EXISTS (
        SELECT 1 
        FROM RegistroVotanteEleccion AS r
        WHERE r.votanteId = v.dni AND r.eleccionId = @eleccionId)
      ORDER BY v.dni LIMIT @max
    `);

    return filtroConExistencia.all({eleccionId, max});
  }
}