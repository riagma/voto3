import { serviciosElecciones } from '../servicios/serviciosElecciones.js';
import { serviciosPartidos } from '../servicios/serviciosPartidos.js';
import { serviciosResultados } from '../servicios/serviciosResultados.js';
import { serviciosRegistros } from '../servicios/serviciosRegistros.js';

export const controladorVotante = {

  //----------------------------------------------------------------------------

  async obtenerDatosVotante(peticion, respuesta) {
    try {
      const { dni, nombre, primerApellido, segundoApellido, correoElectronico } = peticion.votante;
      respuesta.json({ dni, nombre, primerApellido, segundoApellido, correoElectronico });
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------

  async obtenerEleccionesDisponibles(peticion, respuesta) {
    try {
      console.log('Listando elecciones para el votante:', peticion.votante.dni);
      const elecciones = await serviciosElecciones.obtenerTodas(peticion.bd);
      respuesta.json(elecciones || []);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  async obtenerEleccionPorId(peticion, respuesta) {
    try {
      const eleccion = await serviciosElecciones.obtenerPorId(
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

  async obtenerPartidosEleccion(peticion, respuesta) {
    try {
      const partidos = await serviciosPartidos.obtenerPorEleccion(
        peticion.bd,
        peticion.params.idEleccion
      );
      respuesta.json(partidos || []);
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  async obtenerResultadosEleccion(peticion, respuesta) {
    try {
      const resultados = await serviciosResultados.obtenerResultadoEleccion(
        peticion.bd,
        peticion.params.idEleccion
      );
      if (!resultados) {
        return respuesta.status(404).json({ error: 'Resultados no encontrados' });
      }
      const partidos = await serviciosResultados.obtenerResultadosPartidos(
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

  async obtenerRegistroVotanteEleccion(peticion, respuesta) {
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

  async obtenerDetalleEleccion(peticion, respuesta) {
    try {
      const detalleEleccion = await serviciosElecciones.obtenerDetalle(
        peticion.bd,
        peticion.params.idEleccion,
        peticion.votante.dni
      );
      if (!detalleEleccion) {
        return respuesta.status(404).json({ error: 'Elección no encontrada' });
      }
      console.log('Detalle de elección:', detalleEleccion);
      respuesta.json(detalleEleccion);
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