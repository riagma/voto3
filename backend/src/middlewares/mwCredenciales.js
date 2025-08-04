import bcrypt from 'bcrypt';
import { votanteDAO } from '../modelo/DAOs.js';

export const verificarCredencialesVotante = async (peticion, respuesta, siguiente) => {
  // Espera cabecera: authorization: Basic base64(usuario:contraseña)
  const auth = peticion.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    return respuesta.status(401).json({ error: 'Credenciales requeridas' });
  }
  const base64 = auth.split(' ')[1];
  const [usuario, password] = Buffer.from(base64, 'base64').toString().split(':');

  // Busca el votante y verifica la contraseña
  const votante = votanteDAO.obtenerPorDNI(peticion.bd, usuario);
  if (!votante ) {
    return respuesta.status(403).json({ error: 'Credenciales incorrectas' });
  }

  const claveCorrecta = await bcrypt.compare(password, votante.hashContrasena);
  if (!claveCorrecta) {
    return respuesta.status(403).json({ error: 'Credenciales incorrectas' });
  }

  peticion.votante = votante;
  siguiente();
};