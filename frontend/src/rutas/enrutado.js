import { contexto } from '../modelo/contexto.js';
import { vistaLogin } from '../vistas/vistaLogin.js';
import { vistaPanel } from '../vistas/vistaPanel.js';
import { vistaEleccion } from '../vistas/vistaEleccion.js';
import { extraerParametrosRuta } from '../utiles/utilesVistas.js';

export const RUTAS = {
  '/p': (contenedor) => vistaPanel(contenedor),
  '/e/:id': (contenedor, params) => vistaEleccion(contenedor, parseInt(params.id)),
};

export function obtenerVista(ruta) {

  if (!contexto.getNombreUsuario() && ruta === '/') {
    return (contenedor) => vistaLogin(contenedor);
  } 
  
  if (!contexto.getNombreUsuario()) {
    console.log('No hay usuario autenticado, redirigiendo a login');
    navegarA('/');
    return;
  }

  if (ruta === '/') {
    console.log('Redirigiendo a vista de panel ...');
    navegarA('/p');
    return;
  }

  // Usar extraerParametrosRuta de utilesVistas.js
  const [rutaBase, params] = extraerParametrosRuta(ruta, Object.keys(RUTAS));
  const vista = RUTAS[rutaBase];

  if (!vista) {
    throw new Error(`Ruta "${ruta}" no encontrada`);
  }

  // Devolver una función que recibe el contenedor y aplica los parámetros
  return (contenedor) => vista(contenedor, params);
}

export function vistaInicial(contenedor) {
  return vistaLogin(contenedor);
}

export function navegarA(ruta) {
  location.hash = '#' + ruta;
}