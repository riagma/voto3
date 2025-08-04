import { BaseDAO } from './BaseDAO.js';
import { contratoRecicladoDAO } from '../DAOs.js';

export class ContratoBlockchainDAO extends BaseDAO {
  constructor() {
    super('ContratoBlockchain');
  }

  reciclarContrato(bd, contratoId) {
    const reciclarContrato = bd.transaction((contratoId) => {
      const contrato = this.obtenerPorId(bd, { contratoId });
      const contratoReciclado = {
        contratoId: contrato.contratoId,
        appId: contrato.appId,
        appAddr: contrato.appAddr,
        tokenId: contrato.tokenId,
        cuentaId: contrato.cuentaId,
      };
      contratoRecicladoDAO.crear(bd, contratoReciclado);
      this.eliminar(bd, { contratoId });
    });
    return reciclarContrato(contratoId);
  }
}