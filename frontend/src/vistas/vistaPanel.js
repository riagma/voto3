import { servicioEleccion } from '../servicios/servicioEleccion.js';
import { parsearFechaHora } from '../utiles/utilesFechas.js';
import { fichaEleccion } from '../componentes/fichaEleccion.js';
import { limpiarComponentes, limpiarManejadores } from '../utiles/utilesVistas.js';
import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';

import { navegarA } from '../rutas/enrutado.js';

export function vistaPanel(contenedor) {

  let destruida = false;

  let componentes = new Set();
  let manejadores = new Set();

  let elecciones = [];
  // let contratos = [];

  function mostrarError(mensaje) {
    contenedor.innerHTML = `
      <div class="container mt-4">
        <div class="alert alert-danger" role="alert">
          ${mensaje}
        </div>
      </div>
    `;
  }

  async function cargarElecciones() {
    try {
      // console.log('Cargando elecciones...');
      elecciones = await servicioEleccion.cargarElecciones();
      // console.log('Elecciones cargadas:', elecciones);
      if (destruida) return;
      renderizar(ESTADO_ELECCION.ACTUAL);
      // renderizarUserName();
    } catch (error) {
      if (destruida) return;
      console.error('Error al cargar elecciones:', error);
      mostrarError('Error al cargar las elecciones');
    }
  }

  //--------------
  cargarElecciones();
  //--------------

  contenedor.innerHTML = `
    <h2 class="text-center mb-4 fw-semibold" style="letter-spacing:1px; color:#222; border-bottom:1px solid #dee2e6; padding-bottom:0.5rem;">
      Listado de Elecciones Disponibles
    </h2>
    <ul class="nav nav-tabs mb-3" id="electionTabs" role="tablist">
      <li class="nav-item" role="presentation">
        <button class="nav-link" data-status="${ESTADO_ELECCION.PASADA}" data-bs-toggle="tab" type="button">Pasadas</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link active" data-status="${ESTADO_ELECCION.ACTUAL}" data-bs-toggle="tab" type="button">En Curso</button>
      </li>
      <li class="nav-item" role="presentation">
        <button class="nav-link" data-status="${ESTADO_ELECCION.FUTURA}" data-bs-toggle="tab" type="button">Futuras</button>
      </li>
    </ul>
    <div class="tab-content" id="electionContent">
      <div class="tab-pane fade" data-status-container="${ESTADO_ELECCION.PASADA}">
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4"></div>
      </div>
      <div class="tab-pane fade show active" data-status-container="${ESTADO_ELECCION.ACTUAL}">
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4"></div>
      </div>
      <div class="tab-pane fade" data-status-container="${ESTADO_ELECCION.FUTURA}">
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4"></div>
      </div>
    </div>
  `;

  function renderizar(status) {
    const panel = contenedor.querySelector(`[data-status-container="${status}"] .row`);

    limpiarComponentes(componentes);

    panel.innerHTML = '';

    elecciones
      .filter(e => e.estado === status)
      // .forEach(async election => {
      //   if (!election.contrato) {
      //     election.contrato = await servicioEleccion.cargarContrato(election.id);
      //   }
      .forEach(election => {
        const fichaContainer = document.createElement('div');
        const limpiarFicha = fichaEleccion(fichaContainer, election, manejarAccionEleccion);
        componentes.add(limpiarFicha);
        panel.appendChild(fichaContainer.firstElementChild);
      });
  }

  // Manejar acciones de las fichas
  function manejarAccionEleccion(eleccionId, status) {
    const eleccion = elecciones.find(e => e.id === eleccionId);
    if (!eleccion) return;

    navegarA(`/e/${eleccionId}`);

    // switch(status) {
    //   case `${ESTADO_ELECCION.FUTURA}`:
    //     navegarA(`/e/${eleccionId}`);
    //     break;
    //   case `${ESTADO_ELECCION.ACTUAL}`:
    //     navegarA(`/e/${eleccionId}`);
    //     break;
    //   case `${ESTADO_ELECCION.PASADA}`:
    //     navegarA(`/e/${eleccionId}`);
    //     break;
    //   default:
    //     navegarA(`/e/${eleccionId}`);
    // }
  }

  const tabButtons = Array.from(contenedor.querySelectorAll('#electionTabs button'));
  tabButtons.forEach(btn => btn.addEventListener('click', onTabClick));
  tabButtons.forEach(btn => manejadores.add([btn, 'click', onTabClick]));

  function onTabClick(e) {
    const status = e.target.getAttribute('data-status');
    tabButtons.forEach(b => b.classList.toggle('active', b === e.target));
    contenedor.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('show', 'active'));
    const pane = contenedor.querySelector(`[data-status-container="${status}"]`);
    pane.classList.add('show', 'active');
    renderizar(status);
  }

  // Cleanup
  return () => {
    destruida = true;
    limpiarComponentes(componentes);
    limpiarManejadores(manejadores);
  };
}
