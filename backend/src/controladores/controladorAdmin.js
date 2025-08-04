import { serviciosElecciones } from '../servicios/serviciosElecciones.js';

export const controladorAdmin = {
  async obtenerDatos(peticion, respuesta) {
    try {
      respuesta.json({ 
        administrador: peticion.administrador 
      });
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  async listarElecciones(peticion, respuesta) {
    try {
      const elecciones = await serviciosElecciones.listarTodas(peticion.bd);
      respuesta.json({ elecciones });
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  async obtenerEleccion(peticion, respuesta) {
    try {
      const eleccion = await serviciosElecciones.obtenerPorId(
        peticion.bd,
        peticion.params.id
      );
      respuesta.json({ eleccion });
    } catch (error) {
      respuesta.status(404).json({ error: error.message });
    }
  },

  async crearEleccion(peticion, respuesta) {
    try {
      const id = await serviciosElecciones.crear(
        peticion.bd,
        peticion.body
      );
      respuesta.status(201).json({ id });
    } catch (error) {
      respuesta.status(400).json({ error: error.message });
    }
  },

  async actualizarEleccion(peticion, respuesta) {
    try {
      await serviciosElecciones.actualizar(
        peticion.bd,
        peticion.params.id,
        peticion.body
      );
      respuesta.sendStatus(204);
    } catch (error) {
      respuesta.status(400).json({ error: error.message });
    }
  },

  async eliminarEleccion(peticion, respuesta) {
    try {
      await serviciosElecciones.eliminar(
        peticion.bd,
        peticion.params.id
      );
      respuesta.sendStatus(204);
    } catch (error) {
      respuesta.status(400).json({ error: error.message });
    }
  }
};