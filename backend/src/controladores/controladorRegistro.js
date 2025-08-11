import { serviciosRegistros } from '../servicios/serviciosRegistros.js';
import { registrarVotanteEleccion } from '../algorand/registrarCompromisos.js';

export const controladorRegistro = {

  //----------------------------------------------------------------------------

  obtenerRegistroVotanteEleccion(peticion, respuesta) {
    try {
      const registro = serviciosRegistros.obtenerRegistroVotanteEleccion(
        peticion.bd,
        peticion.votante.dni,
        parseInt(peticion.params.idEleccion)
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

  async crearRegistroVotanteEleccion(peticion, respuesta, siguiente) {
    try {
      const { compromiso, datosPrivados } = peticion.body;
      if (!compromiso || !datosPrivados) {
        return respuesta.status(400).json({ error: 'Compromiso y datos privados son requeridos' });
      }

      await registrarVotanteEleccion(peticion.bd, {
        votanteId: peticion.votante.dni,
        eleccionId: parseInt(peticion.params.idEleccion),
        compromiso,
        datosPrivados
      });

      const registro = serviciosRegistros.obtenerRegistroVotanteEleccion(
        peticion.bd,
        peticion.votante.dni,
        parseInt(peticion.params.idEleccion)
      );

      respuesta.status(201).json(registro);
    } catch (error) {
      respuesta.status(400).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
};