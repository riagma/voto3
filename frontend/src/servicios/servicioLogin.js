import { contexto } from '../modelo/contexto.js';
import { voto3IDB } from '../modelo/voto3IDB.js';
import {
  generarSaltSemilla,
  derivarClave,
  hashPassword,
  desencriptarJSON
} from '../utiles/utilesCrypto.js';

import { servicioVotante } from './servicioVotante.js';

// Variable de módulo: clave derivada en memoria (solo durante la sesión)
let claveDerivadaSesion = null;

export const servicioLogin = {
  getClaveDerivada() {
    return claveDerivadaSesion;
  },

  logout() {
    claveDerivadaSesion = null;
    contexto.limpiarContexto();
  },

  // Registro de nuevo votante
  async crearUsuario(nombreUsuario, contrasena, repetirContrasena) {
    if (!nombreUsuario || !contrasena || !repetirContrasena) {
      throw new Error('Todos los campos son obligatorios.');
    }
    if (contrasena !== repetirContrasena) {
      throw new Error('Las contraseñas no coinciden.');
    }
    const existente = await voto3IDB.obtenerUsuario(nombreUsuario);
    if (existente) {
      throw new Error('Ya existe un usuario con ese nombreUsuario.');
    }

    const claveSalt = await generarSaltSemilla(nombreUsuario);
    const claveDerivada = await derivarClave(contrasena, claveSalt);
    const contrasenaHash = await hashPassword(contrasena);
    const usuario = { nombreUsuario, contrasenaHash, claveSalt };
    console.log('Registrando votante:', usuario);
    await voto3IDB.crearUsuario(usuario);

    claveDerivadaSesion = claveDerivada;

    contexto.limpiarContexto();
    contexto.actualizarContexto({ nombreUsuario });
    console.log('Usuario creado exitosamente:', nombreUsuario);

    await servicioVotante.cargarVotante();
  },

  // Login de votante existente
  async loginUsuario(nombreUsuario, contrasena) {
    if (!nombreUsuario || !contrasena) {
      throw new Error('Nombre y contraseña obligatorios.');
    }
    const usuario = await voto3IDB.obtenerUsuario(nombreUsuario);
    if (!usuario) {
      throw new Error('Usuario no encontrado.');
    }
    const contrasenaHash = await hashPassword(contrasena);
    if (usuario.contrasenaHash !== contrasenaHash) {
      throw new Error('Contraseña incorrecta.');
    }

    claveDerivadaSesion = await derivarClave(contrasena, usuario.claveSalt);

    contexto.limpiarContexto();
    contexto.actualizarContexto({ nombreUsuario });
    console.log('Login exitoso para:', nombreUsuario);

    await servicioVotante.cargarVotante();
  }
};