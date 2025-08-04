import { serviciosElecciones } from '../servicios/serviciosElecciones.js';
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

  // async obtenerDetalleEleccion(peticion, respuesta) {
  //   try {
  //     const detalleEleccion = serviciosElecciones.obtenerDetalle(
  //       peticion.bd,
  //       peticion.params.idEleccion,
  //       peticion.votante.dni
  //     );
  //     if (!detalleEleccion) {
  //       return respuesta.status(404).json({ error: 'Elección no encontrada' });
  //     }
  //     console.log('Detalle de elección:', detalleEleccion);
  //     respuesta.json(detalleEleccion);
  //   } catch (error) {
  //     respuesta.status(500).json({ error: error.message });
  //   }
  // },

  //----------------------------------------------------------------------------

  // async anularRegistroEnEleccion(peticion, respuesta) {
  //   try {
  //     await serviciosRegistros.eliminar(
  //       peticion.bd,
  //       peticion.votante.dni,
  //       peticion.params.idEleccion
  //     );
  //     respuesta.sendStatus(204);
  //   } catch (error) {
  //     respuesta.status(400).json({ error: error.message });
  //   }
  // },

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
};