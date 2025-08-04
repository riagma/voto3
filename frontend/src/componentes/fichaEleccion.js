import { limpiarManejadores } from '../utiles/utilesVistas.js';
import { parsearFechaHora, formatearFechaWeb } from '../utiles/utilesFechas.js';
import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';

import { servicioAlgorand } from '../servicios/servicioAlgorand.js';

export function fichaEleccion(contenedor, eleccion, onAccion) {
  let manejadores = new Set();

  function renderizar() {
    console.debug('Renderizando fichaEleccion', eleccion);
    limpiarManejadores(manejadores);

    const status = eleccion.estado;

    const textBoton = {
      [ESTADO_ELECCION.FUTURA]: 'Ver detalles',
      [ESTADO_ELECCION.ACTUAL]: 'Ir a votar',
      [ESTADO_ELECCION.PASADA]: 'Ver resultados'
    }[status];

    // const appId = eleccion.contrato?.appId || '';
    // const algoLink = servicioAlgorand.urlApplication(appId);

    const fechaInicioRegistro = formatearFechaWeb(parsearFechaHora(eleccion.fechaInicioRegistro));
    const fechaFinRegistro = formatearFechaWeb(parsearFechaHora(eleccion.fechaFinRegistro));
    const fechaInicioVotacion = formatearFechaWeb(parsearFechaHora(eleccion.fechaInicioVotacion));
    const fechaFinVotacion = formatearFechaWeb(parsearFechaHora(eleccion.fechaFinVotacion));
    const fechaEscrutinio = formatearFechaWeb(parsearFechaHora(eleccion.fechaEscrutinio));

    contenedor.innerHTML = `
      <div class="col">
        <div class="card h-100">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${eleccion.nombre}</h5>
            <p class="card-text flex-grow-1">${eleccion.descripcion}</p>
            <ul class="list-unstyled small mb-3">
              <li><strong>Registro:</strong> Del ${fechaInicioRegistro} al ${fechaFinRegistro}</li>
              <li><strong>Votación:</strong> Del ${fechaInicioVotacion} al ${fechaFinVotacion}</li>
              <li><strong>Escrutinio:</strong> El ${fechaEscrutinio}</li>
            </ul>
            <button class="btn btn-primary mt-auto btn-accion" data-election-id="${eleccion.id}">
              ${textBoton}
            </button>
          </div>
        </div>
      </div>
    `;

    // <li><strong>Blockchain:</strong> <a href="${algoLink}" target="_blank">${appId}</a></li>

    // Registrar nuevos listeners
    const boton = contenedor.querySelector('.btn-accion');
    if (boton) {
      const handler = () => onAccion(eleccion.id, status);
      boton.addEventListener('click', handler);
      manejadores.add([boton, 'click', handler]);
    }
  }

  // Renderizado inicial

  renderizar();

  return () => {
    limpiarManejadores(manejadores);
  };
}
