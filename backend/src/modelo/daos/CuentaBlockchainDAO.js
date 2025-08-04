import { BaseDAO } from './BaseDAO.js';
import { encriptar, desencriptar } from '../../utiles/utilesCrypto.js';
import { CLAVE_MAESTRA } from '../../utiles/constantes.js';

export class CuentaBlockchainDAO extends BaseDAO {
  constructor() {
    super('CuentaBlockchain');
  }

  obtenerPorAddr(bd,  { accNet, accAddr } ) {
    return bd.prepare(
      'SELECT * FROM CuentaBlockchain WHERE accNet = ? AND accAddr = ?'
    ).get([accNet, accAddr]);
  }

  async obtenerMnemonico(bd, { cuentaId }) {
    const cuenta = this.obtenerPorId(bd, { cuentaId });
    if (!cuenta) {
      return null;
    } 
    return await desencriptar(cuenta.accSecret, CLAVE_MAESTRA);
  }

  async actualizarMnemonico(bd, { cuentaId, nuevoMnemonico }) {
    const cuenta = this.obtenerPorId(bd, { cuentaId });
    if (!cuenta) {
      return null;
    } 
    cuenta.accSecret = await encriptar(nuevoMnemonico, CLAVE_MAESTRA);
    this.actualizar(bd, { cuentaId }, { accSecret: cuenta.accSecret });
  }
}
