import { BaseDAO } from './BaseDAO.js';

export class AdministradorDAO extends BaseDAO {
  constructor() {
    super('Administrador');
  }

  obtenerPorCorreo(bd, correo) {
    return this.obtenerPorId(bd, correo, 'correo');
  }

  async verificarCredenciales(bd, correo, hashContrasena) {
    return bd.prepare('SELECT * FROM Administrador WHERE correo = ? AND hashContrasena = ?').get([correo, hashContrasena]);
  }
}