import jwt from 'jsonwebtoken';
import { SECRETO } from '../utiles/constantes.js';
import { daos } from '../modelo/DAOs.js';
import bcrypt from 'bcrypt';

export const serviciosAutenticacion = {
  async loginVotante(bd, dni, clave) {
    console.log('Intentando login votante con:', { dni, clave });
    const votante = await daos.votante.obtenerPorDNI(bd, dni);
    console.log('Datos del votante:', votante);
    if (!votante) {
      throw new Error('Credenciales inválidas');
    }

    const claveCorrecta = await bcrypt.compare(clave, votante.hashContrasena);
    if (!claveCorrecta) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token con datos mínimos
    const token = jwt.sign({ 
      dni: votante.dni,
      tipo: 'votante' 
    }, SECRETO, { expiresIn: '1h' });

    // Eliminar datos sensibles antes de enviar
    const votanteSeguro = { ...votante };
    delete votanteSeguro.hashContrasena;

    return { token, votante: votanteSeguro };
  },

  async loginAdmin(bd, correo, clave) {
    console.log('Intentando login admin con:', { correo, clave });
    const admin = await daos.administrador.obtenerPorCorreo(bd, { correo });
    console.log('Datos del administrador:', admin);
    if (!admin) {
      throw new Error('Credenciales inválidas');
    }

    console.log('Verificando contraseña para el administrador:', { clave, hash: admin.hashContrasena });
    const claveCorrecta = await bcrypt.compare(clave, admin.hashContrasena);
    if (!claveCorrecta) {
      throw new Error('Credenciales inválidas');
    }

    // Generar token con datos mínimos
    const token = jwt.sign({ 
      correo: admin.correo,
      tipo: 'admin' 
    }, SECRETO, { expiresIn: '1h' });

    // Eliminar datos sensibles antes de enviar
    const adminSeguro = { ...admin };
    delete adminSeguro.hashContrasena;

    return { token, administrador: adminSeguro };
  }
};