import jwt from 'jsonwebtoken';
import { SECRETO } from '../utiles/constantes.js';
import { votanteDAO, administradorDAO } from '../modelo/DAOs.js';

export const verificarTokenVotante = async (peticion, respuesta, siguiente) => {
  try {
    const token = extraerToken(peticion);
    const payload = jwt.verify(token, SECRETO);
    
    if (payload.tipo !== 'votante') {
      return respuesta.status(403).json({ error: 'Token de tipo incorrecto' });
    }

    // Cargar datos del votante desde DB
    const votante = await votanteDAO.obtenerPorDNI(peticion.bd, payload.dni);
    if (!votante) {
      return respuesta.status(403).json({ error: 'Votante no encontrado' });
    }

    // Añadir datos a la petición
    peticion.votante = votante;
    siguiente();
  } catch (error) {
    respuesta.status(403).json({ error: 'Token inválido' });
  }
};

export const verificarTokenAdmin = async (peticion, respuesta, siguiente) => {
  try {
    const token = extraerToken(peticion);
    const payload = jwt.verify(token, SECRETO);
    
    if (payload.tipo !== 'admin') {
      return respuesta.status(403).json({ error: 'Token de tipo incorrecto' });
    }

    // Cargar datos del admin desde DB
    const admin = await administradorDAO.obtenerPorCorreo(peticion.bd, payload.correo);
    if (!admin) {
      return respuesta.status(403).json({ error: 'Administrador no encontrado' });
    }

    // Añadir datos a la petición
    peticion.administrador = admin;
    siguiente();
  } catch (error) {
    respuesta.status(403).json({ error: 'Token inválido' });
  }
};

const extraerToken = (peticion) => {
  const autorizacion = peticion.headers.authorization;
  if (!autorizacion) {
    throw new Error('No hay token');
  }
  return autorizacion.split(' ')[1];
};