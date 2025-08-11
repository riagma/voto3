import { serviciosElecciones } from '../servicios/serviciosElecciones.js';
import {
  serviciosContratos,
  serviciosCuentas,
  serviciosPruebas,
  serviciosRaices
} from '../servicios/serviciosContratos.js';
import { serviciosPartidos } from '../servicios/serviciosPartidos.js';
import { serviciosResultados } from '../servicios/serviciosResultados.js';
import { serviciosRegistros } from '../servicios/serviciosRegistros.js';

export const controladorEleccion = {

  //----------------------------------------------------------------------------

  obtenerEleccionesDisponibles(peticion, respuesta) {
    try {
      const elecciones = serviciosElecciones.obtenerTodas(peticion.bd);
      respuesta.json(elecciones ?? []);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  obtenerDetalleEleccion(peticion, respuesta) {
    try {
      const eleccion = serviciosElecciones.obtenerPorId(
        peticion.bd,
        peticion.params.idEleccion
      );
      if (!eleccion) {
        return respuesta.status(404).json({ error: 'Elección no encontrada' });
      }
      respuesta.json(eleccion);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  obtenerPartidosEleccion(peticion, respuesta) {
    try {
      const partidos = serviciosPartidos.obtenerPorEleccion(
        peticion.bd,
        peticion.params.idEleccion
      );
      respuesta.json(partidos ?? []);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  obtenerContratoEleccion(peticion, respuesta) {
    try {
      const contrato = serviciosContratos.obtenerPorId(
        peticion.bd,
        peticion.params.idEleccion
      );
      if (!contrato) {
        return respuesta.status(404).json({ error: 'Contrato no encontrado' });
      }
      const cuenta = serviciosCuentas.obtenerPorId(
        peticion.bd,
        contrato.cuentaId
      );
      if (!cuenta) {
        return respuesta.status(404).json({ error: 'Cuenta no encontrada' });
      }
      contrato.accAddr = cuenta.accAddr;
      respuesta.json(contrato);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  obtenerPruebaZkEleccion(peticion, respuesta) {
    try {
      const pruebaZK = serviciosPruebas.obtenerPorId(
        peticion.bd,
        peticion.params.idEleccion
      );
      if (!pruebaZK) {
        return respuesta.status(404).json({ error: 'Prueba ZK no encontrada' });
      }
      respuesta.json(pruebaZK);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  obtenerRaizZkEleccion(peticion, respuesta) {
    try {
      const raizZK = serviciosRaices.obtenerPorId(
        peticion.bd,
        peticion.params.idEleccion,
        peticion.params.idxBloque
      );
      if (!raizZK) {
        return respuesta.status(404).json({ error: 'Raíz ZK no encontrada' });
      }
      respuesta.json(raizZK);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  obtenerResultadosEleccion(peticion, respuesta) {
    try {
      const resultados = serviciosResultados.obtenerResultadoEleccion(
        peticion.bd,
        peticion.params.idEleccion
      );
      if (!resultados) {
        return respuesta.json({});
      }
      const partidos = serviciosResultados.obtenerResultadosPartidos(
        peticion.bd,
        peticion.params.idEleccion
      );
      respuesta.json({
        ...resultados,
        partidos: partidos ?? []
      });
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------

  async obtenerRegistroEleccionEleccion(peticion, respuesta) {
    try {
      const registro = await serviciosRegistros.obtenerPorId(
        peticion.bd,
        peticion.votante.dni,
        peticion.params.idEleccion
      );
      if (!registro) {
        return respuesta.status(404).json({ error: 'Registro no encontrado' });
      }
      respuesta.json(registro);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------

  async registrarseEnEleccion(peticion, respuesta, siguiente) {
    try {
      const registro = {
        votanteId: peticion.votante.dni,
        eleccionId: peticion.params.idEleccion,
        compromisoTxId: 'compromisoTxId-' + Date.now(),
        fechaRegistro: new Date().toISOString(),
        ...peticion.body,
      };
      console.log('Registrando votante:', registro);
      await serviciosRegistros.crear(peticion.bd, registro);
      respuesta.sendStatus(204);
    } catch (error) {
      respuesta.status(400).json({ error: error.message });
      // respuesta.status(400).json({ error: 'Error registrando votante' });
    }
  },

  //----------------------------------------------------------------------------

  async anularRegistroEnEleccion(peticion, respuesta) {
    try {
      await serviciosRegistros.eliminar(
        peticion.bd,
        peticion.votante.dni,
        peticion.params.idEleccion
      );
      respuesta.sendStatus(204);
    } catch (error) {
      respuesta.status(400).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
};