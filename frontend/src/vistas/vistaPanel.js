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
      <div class="container py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-lg-10 col-xl-8">
            <div class="alert alert-danger" role="alert">
              ${mensaje}
            </div>
          </div>
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
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <div class="card border-0 bg-light mb-4">
            <div class="card-body text-center">
              <h2 class="card-title mb-0">Elecciones Disponibles</h2>
              <p class="card-text text-muted mb-0">Seleccione una elección para participar</p>
            </div>
          </div>
          
          <ul class="nav nav-tabs mb-4" id="electionTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link" data-status="${ESTADO_ELECCION.PASADA}" data-bs-toggle="tab" type="button">
                <i class="bi bi-archive me-2"></i>Pasadas
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link active" data-status="${ESTADO_ELECCION.ACTUAL}" data-bs-toggle="tab" type="button">
                <i class="bi bi-play-circle me-2"></i>En Curso
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" data-status="${ESTADO_ELECCION.FUTURA}" data-bs-toggle="tab" type="button">
                <i class="bi bi-calendar-event me-2"></i>Futuras
              </button>
            </li>
          </ul>
          
          <div class="tab-content" id="electionContent">
            <div class="tab-pane fade" data-status-container="${ESTADO_ELECCION.PASADA}">
              <div class="row row-cols-1 row-cols-md-2 g-4"></div>
            </div>
            <div class="tab-pane fade show active" data-status-container="${ESTADO_ELECCION.ACTUAL}">
              <div class="row row-cols-1 row-cols-md-2 g-4"></div>
            </div>
            <div class="tab-pane fade" data-status-container="${ESTADO_ELECCION.FUTURA}">
              <div class="row row-cols-1 row-cols-md-2 g-4"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  function renderizar(status) {
    const panel = contenedor.querySelector(`[data-status-container="${status}"] .row`);

    limpiarComponentes(componentes);

    panel.innerHTML = '';

    const eleccionesFiltradas = elecciones.filter(e => e.estado === status);

    if (eleccionesFiltradas.length === 0) {
      panel.innerHTML = `
        <div class="col-12">
          <div class="text-center py-5">
            <i class="bi bi-inbox text-muted" style="font-size: 3rem;"></i>
            <h5 class="text-muted mt-3">No hay elecciones ${getStatusLabel(status).toLowerCase()}</h5>
            <p class="text-muted">Las elecciones aparecerán aquí cuando estén disponibles.</p>
          </div>
        </div>
      `;
      return;
    }

    eleccionesFiltradas
      .forEach(election => {
        const fichaContainer = document.createElement('div');
        const limpiarFicha = fichaEleccion(fichaContainer, election, manejarAccionEleccion);
        componentes.add(limpiarFicha);
        panel.appendChild(fichaContainer.firstElementChild);
      });
  }

  function getStatusLabel(status) {
    switch(status) {
      case ESTADO_ELECCION.PASADA: return 'Pasadas';
      case ESTADO_ELECCION.ACTUAL: return 'En Curso';
      case ESTADO_ELECCION.FUTURA: return 'Futuras';
      default: return '';
    }
  }

  // Manejar acciones de las fichas
  function manejarAccionEleccion(eleccionId, status) {
    const eleccion = elecciones.find(e => e.id === eleccionId);
    if (!eleccion) return;

    navegarA(`/e/${eleccionId}`);
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
