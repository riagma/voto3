import { daos } from '../modelo/DAOs.js';

export const serviciosContratos = {
  crear(bd, datosContrato) {
    return daos.contratoBlockchain.crear(bd, datosContrato);
  },

  actualizar(bd, contratoId, datosContrato) {
    return daos.contratoBlockchain.actualizar(bd, { contratoId }, datosContrato);
  },

  eliminar(bd, contratoId) {
    return daos.contratoBlockchain.eliminar(bd, { contratoId });
  },

  obtenerTodos(bd) {
    return daos.contratoBlockchain.obtenerTodos(bd);
  },

  obtenerPorId(bd, contratoId) {
    return daos.contratoBlockchain.obtenerPorId(bd, { contratoId });
  }
};

export const serviciosPruebas = {
  crear(bd, datosPrueba) {
    return daos.pruebaZK.crear(bd, datosPrueba);
  },

  actualizar(bd, pruebaId, datosPrueba) {
    return daos.pruebaZK.actualizar(bd, { pruebaId }, datosPrueba);
  },

  eliminar(bd, pruebaId) {
    return daos.pruebaZK.eliminar(bd, { pruebaId });
  },

  obtenerTodos(bd) {
    return daos.pruebaZK.obtenerTodos(bd);
  },

  obtenerPorId(bd, pruebaId) {
    return daos.pruebaZK.obtenerPorId(bd, { pruebaId });
  }
};

export const serviciosRaices = {
  crear(bd, datosRaiz) {
    return daos.raizZK.crear(bd, datosRaiz);
  },

  actualizar(bd, pruebaId, bloqueIdx, datosRaiz) {
    return daos.raizZK.actualizar(bd, { pruebaId, bloqueIdx }, datosRaiz);
  },

  eliminar(bd, pruebaId, bloqueIdx) {
    return daos.raizZK.eliminar(bd, { pruebaId, bloqueIdx });
  },

  obtenerTodos(bd) {
    return daos.raizZK.obtenerTodos(bd);
  },

  obtenerPorId(bd, pruebaId, bloqueIdx) {
    return daos.raizZK.obtenerPorId(bd, { pruebaId, bloqueIdx });
  }
};

export const serviciosCuentas = {
  crear(bd, datosCuenta) {
    return daos.cuentaBlockchain.crear(bd, datosCuenta);
  },

  actualizar(bd, cuentaId, datosCuenta) {
    return daos.cuentaBlockchain.actualizar(bd, { cuentaId }, datosCuenta);
  },

  eliminar(bd, cuentaId) {
    return daos.cuentaBlockchain.eliminar(bd, { cuentaId });
  },

  obtenerTodos(bd) {
    return daos.cuentaBlockchain.obtenerTodos(bd);
  },

  obtenerPorId(bd, cuentaId) {
    return daos.cuentaBlockchain.obtenerPorId(bd, { cuentaId });
  },
};