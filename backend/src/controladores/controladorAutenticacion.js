import { serviciosAutenticacion } from '../servicios/serviciosAutenticacion.js';

export const controladorAutenticacion = {
  async loginVotante(peticion, respuesta) {
    const { dni, contrasena } = peticion.body;
    try {
      const resultado = await serviciosAutenticacion.loginVotante(peticion.bd, dni, contrasena);
      respuesta.json(resultado);
    } catch (error) {
      respuesta.status(401).json({ error: error.message });
    }
  },

  async loginAdmin(peticion, respuesta) {
    const { correo, contrasena } = peticion.body;
    try {
      console.log('Intentando login admin con:', { correo, contrasena });
      const resultado = await serviciosAutenticacion.loginAdmin(peticion.bd, correo, contrasena);
      console.log('Login admin exitoso:', resultado);
      respuesta.json(resultado);
    } catch (error) {
      respuesta.status(401).json({ error: error.message });
    }
  },

  async perfilVotante(peticion, respuesta) {
    try {
      // Los datos del votante ya están en la petición gracias al middleware
      respuesta.json({ 
        votante: peticion.votante
      });
    } catch (error) {
      respuesta.status(403).json({ error: error.message });
    }
  },

  async perfilAdmin(peticion, respuesta) {
    try {
      // Los datos del admin ya están en la petición gracias al middleware
      respuesta.json({ 
        administrador: peticion.administrador
      });
    } catch (error) {
      respuesta.status(403).json({ error: error.message });
    }
  }
};