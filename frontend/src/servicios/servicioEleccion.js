import { api } from './api.js';
import {
  validarDatos,
  esquemaEleccion,
  esquemaElecciones,
  esquemaDetalleEleccion
} from '../modelo/esquemas.js';

import { parsearFechaHora } from '../utiles/utilesFechas.js';
import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';

export const servicioEleccion = {
  async cargarElecciones() {
    try {
      const eleccionesApi = await api.get('/api/eleccion/disponibles');
      const elecciones = validarDatos(eleccionesApi, esquemaElecciones);
      for (const eleccion of elecciones) {
        this.establecerEstado(eleccion); }
      return elecciones;
    } catch (error) {
      throw new Error('Error al cargar elecciones: ' + error.message);
    }
  },

  async cargarEleccion(idEleccion) {
    try {
      const eleccionApi = await api.get(`/api/eleccion/${idEleccion}`);
      const eleccion = validarDatos(eleccionApi, esquemaEleccion);
      this.establecerEstado(eleccion);
      return eleccion;
    } catch (error) {
      throw new Error('Error al cargar el detalle de la elección: ' + error.message);
    }
  },

  async cargarPartidos(idEleccion) {
    try {
      const partidos = await api.get(`/api/eleccion/${idEleccion}/partidos`);
      // return validarDatos(partidos, esquemaDetalleEleccion);
      return partidos; // No hay esquema específico para partidos
    } catch (error) {
      throw new Error('Error al cargar los partidos de la elección: ' + error.message);
    }
  },

  async cargarContrato(idEleccion) {
    try {
      const contrato = await api.get(`/api/eleccion/${idEleccion}/contrato`);
      // return validarDatos(partidos, esquemaDetalleEleccion);
      // console.log('Contrato cargado:', contrato);
      return contrato; // No hay esquema específico para partidos
    } catch (error) {
      throw new Error('Error al cargar el contrato de la elección: ' + error.message);
    }
  },

  async cargarResultados(idEleccion) {
    try {
      const contrato = await api.get(`/api/eleccion/${idEleccion}/resultados`);
      // return validarDatos(partidos, esquemaDetalleEleccion);
      return contrato; // No hay esquema específico para partidos
    } catch (error) {
      throw new Error('Error al cargar el contrato de la elección: ' + error.message);
    }
  },

  establecerEstado(eleccion) {
    const ahora = new Date();
    const inicioRegistro = parsearFechaHora(eleccion.fechaInicioRegistro);
    const finRegistro = parsearFechaHora(eleccion.fechaFinRegistro);
    const inicioVoto = parsearFechaHora(eleccion.fechaInicioVotacion);
    const finVoto = parsearFechaHora(eleccion.fechaFinVotacion);
    const escrutinio = parsearFechaHora(eleccion.fechaEscrutinio);

    eleccion.estado = '';
    eleccion.actual = '';

    if (ahora < inicioRegistro) {
      eleccion.estado = ESTADO_ELECCION.FUTURA;

    } else if (ahora <= escrutinio) {
      eleccion.estado = ESTADO_ELECCION.ACTUAL;

      if(ahora >= inicioRegistro && ahora <= finRegistro) {
        eleccion.actual = ELECCION_ACTUAL.REGISTRO;
      }
      else if(ahora >= inicioVoto && ahora <= finVoto) {
        eleccion.actual = ELECCION_ACTUAL.VOTACION;
      }
      else if(ahora > finVoto && ahora <= escrutinio) {
        eleccion.actual = ELECCION_ACTUAL.RECUENTO;
      }

    } else {
      eleccion.estado = ESTADO_ELECCION.PASADA;
    }
  },
};