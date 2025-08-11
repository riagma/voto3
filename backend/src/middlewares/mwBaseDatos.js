import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';

export async function mwBaseDatos(peticion, respuesta, siguiente) {
  let bd;
  try {
    bd = await abrirConexionBD();
    if (!bd) {
      throw new Error('No se pudo obtener conexión a la base de datos');
    }
    peticion.bd = bd;

    // console.log('Conexión a base de datos establecida');
    siguiente();
    // console.log('Middleware de base de datos ejecutado correctamente');
  } catch (error) {
    cerrarConexionBD();
    respuesta.status(500).json({
      error: 'Error de conexión a base de datos',
      mensaje: error.message
    });
  }
}