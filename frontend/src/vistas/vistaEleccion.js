import { contexto } from '../modelo/contexto.js';
import { servicioEleccion } from '../servicios/servicioEleccion.js';
import { servicioVotante } from '../servicios/servicioVotante.js';
import { servicioAlgorand } from '../servicios/servicioAlgorand.js';
import { formatearFecha, parsearFechaHora } from '../utiles/utilesFechas.js';
import { limpiarComponentes, limpiarManejadores } from '../utiles/utilesVistas.js';
import { fichaPartido } from '../componentes/fichaPartido.js';
import { fichaRegistro } from '../componentes/fichaRegistro.js';
import { fichaVotacion } from '../componentes/fichaVotacion.js';
import { fichaResultados } from '../componentes/fichaResultados.js';
import { navegarA } from '../rutas/enrutado.js';

import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';

export function vistaEleccion(container, idEleccion) {
  let destruida = false;
  const componentes = new Set();
  const manejadores = new Set();

  // 1) Esqueleto base con contenedor limitado
  container.innerHTML = `
    <div class="container py-4">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <button id="btnVolver" class="btn btn-link mb-3">&larr; Volver</button>
          <div id="electionHeader"></div>
          <ul class="nav nav-tabs" id="detalleTabs" role="tablist"></ul>
          <div class="tab-content mt-3" id="detallePanes"></div>
        </div>
      </div>
    </div>
  `;
  
  // Volver
  const btnVolver = container.querySelector('#btnVolver');
  btnVolver.addEventListener('click', () => navegarA('/p'));
  manejadores.add([btnVolver, 'click', null]);

  // 2) Carga de datos
  let eleccion, partidos, contrato, resultados, registro;

  async function cargarDatos() {
    try {
      eleccion = await servicioEleccion.cargarEleccion(idEleccion);
      partidos = await servicioEleccion.cargarPartidos(idEleccion);
      contrato = await servicioEleccion.cargarContrato(idEleccion);

      if (eleccion.estado === ESTADO_ELECCION.PASADA) {
        resultados = await servicioEleccion.cargarResultados(idEleccion);
      }

    } catch (err) {
      container.innerHTML = `
        <div class="container py-4">
          <div class="row justify-content-center">
            <div class="col-12 col-lg-10 col-xl-8">
              <div class="alert alert-danger">Error al cargar datos elección: ${err.message}</div>
            </div>
          </div>
        </div>`;
      return () => { };
    }

    if (!eleccion) {
      container.innerHTML = `
        <div class="container py-4">
          <div class="row justify-content-center">
            <div class="col-12 col-lg-10 col-xl-8">
              <div class="alert alert-warning">Elección no encontrada</div>
            </div>
          </div>
        </div>`;
      return () => { };
    }

    try {
      if (eleccion.estado !== ESTADO_ELECCION.FUTURA) {
        registro = await servicioVotante.cargarRegistroEleccion(idEleccion, eleccion, contrato);
      }
    } catch (err) {
      container.innerHTML = `
        <div class="container py-4">
          <div class="row justify-content-center">
            <div class="col-12 col-lg-10 col-xl-8">
              <div class="alert alert-danger">Error al cargar el registro de elección: ${err.message}</div>
            </div>
          </div>
        </div>`;
      return () => { };
    }

    if (destruida) return;
    renderizar();
  }

  //--------------
  cargarDatos();
  //--------------

  function actualizarRegistro(nuevoRegistro) {
    registro = nuevoRegistro;
  }

  function renderizar() {
    if (destruida) return;
    limpiarComponentes(componentes);

    const ahora = new Date();
    // fechas parseadas
    const inicioReg = formatearFecha(parsearFechaHora(eleccion.fechaInicioRegistro));
    const finReg = formatearFecha(parsearFechaHora(eleccion.fechaFinRegistro));
    const inicioVot = formatearFecha(parsearFechaHora(eleccion.fechaInicioVotacion));
    const finVot = formatearFecha(parsearFechaHora(eleccion.fechaFinVotacion));
    const escru = formatearFecha(parsearFechaHora(eleccion.fechaEscrutinio));
    const appId = contrato?.appId || '';
    const linkAlgo = servicioAlgorand.urlApplication(appId);

    // 3) Header con info básica mejorado
    const hdr = container.querySelector('#electionHeader');
    hdr.innerHTML = `
      <div class="card border-0 bg-light mb-4">
        <div class="card-body">
          <h2 class="card-title mb-3">${eleccion.nombre}</h2>
          <p class="card-text text-muted mb-3">${eleccion.descripcion}</p>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="d-flex flex-column gap-2 small">
                <div><strong>Registro:</strong> ${inicioReg} – ${finReg}</div>
                <div><strong>Votación:</strong> ${inicioVot} – ${finVot}</div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex flex-column gap-2 small">
                <div><strong>Escrutinio:</strong> ${escru}</div>
                <div><strong>Blockchain:</strong> 
                  <a href="${linkAlgo}" target="_blank" class="text-decoration-none">
                    ${appId} <i class="bi bi-box-arrow-up-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 4) Construcción dinámica de pestañas
    const tabs = [];
    const panes = [];

    let infoActivo = false;
    let registroActivo = false;
    let votacionActivo = false;
    let resultadosActivo = false;
    let presentarseActivo = false;

    let infoVisible = false;
    let votacionVisible = false;
    let registroVisible = false;
    let resultadosVisible = false;
    let presentarseVisible = false;

    if (eleccion.estado === ESTADO_ELECCION.FUTURA) {
      infoVisible = true;
      // presentarseVisible = contexto.estaIdentificado();
      infoActivo = true;
    }
    if (eleccion.estado === ESTADO_ELECCION.ACTUAL) {
      infoVisible = true;
      registroVisible = true;
      votacionVisible = true;
      registroActivo = eleccion.actual === ELECCION_ACTUAL.REGISTRO;
      votacionActivo = eleccion.actual === ELECCION_ACTUAL.VOTACION;
      infoActivo = !registroActivo && !votacionActivo;
    }
    if (eleccion.estado === ESTADO_ELECCION.PASADA) {
      registroVisible = true;
      votacionVisible = true;
      resultadosVisible = true;
      resultadosActivo = true;
    }

    if (infoVisible) {
      tabs.push({ id: 'info', label: 'Información', active: infoActivo });
      panes.push({ id: 'info', contenedor: document.createElement('div') });
    }
    if (registroVisible) {
      tabs.push({ id: 'registro', label: 'Registro', active: registroActivo });
      panes.push({ id: 'registro', contenedor: document.createElement('div') });
    }
    if (votacionVisible) {
      tabs.push({ id: 'votacion', label: 'Votación', active: votacionActivo });
      panes.push({ id: 'votacion', contenedor: document.createElement('div') });
    }
    if (resultadosVisible) {
      tabs.push({ id: 'resultados', label: 'Resultados', active: resultadosActivo });
      panes.push({ id: 'resultados', contenedor: document.createElement('div') });
    }
    if (presentarseVisible) {
      tabs.push({ id: 'presentarse', label: 'Presentarse', active: presentarseActivo });
      panes.push({ id: 'presentarse', contenedor: document.createElement('div') });
    }

    // Render pestañas y contenedores
    const ulTabs = container.querySelector('#detalleTabs');
    const divPanes = container.querySelector('#detallePanes');
    
    // Limpiar contenido anterior
    ulTabs.innerHTML = '';
    divPanes.innerHTML = '';
    
    // Determinar cuál tab debe estar activo
    const activeTab = tabs.find(t => t.active)?.id || tabs[0]?.id;
    
    tabs.forEach(({ id, label, active }) => {
      const li = document.createElement('li');
      li.className = 'nav-item';
      li.innerHTML = `<button class="nav-link ${active ? 'active' : ''}" 
                         id="tab-${id}" data-bs-toggle="tab" 
                         data-bs-target="#pane-${id}" type="button">
                     ${label}
                    </button>`;
      ulTabs.appendChild(li);
    });
    
    panes.forEach(({ id, contenedor }) => {
      contenedor.id = `pane-${id}`;
      contenedor.className = `tab-pane fade ${id === activeTab ? 'show active' : ''}`;
      divPanes.appendChild(contenedor);
    });

    // 5) Renderizado de cada pestaña
    // — Información (lista de partidos)
    const paneInfo = panes.find(p => p.id === 'info');
    if (paneInfo) {
      const rowPartidos = document.createElement('div');
      rowPartidos.className = 'row row-cols-1 row-cols-md-2 g-3';
      paneInfo.contenedor.appendChild(rowPartidos);
      partidos.forEach(partido => {
        const cont = document.createElement('div');
        const cleanup = fichaPartido(cont, partido);
        componentes.add(cleanup);
        rowPartidos.appendChild(cont);
      });
    }

    // — Registro
    const paneRegistro = panes.find(p => p.id === 'registro');
    if (paneRegistro) {
      const cleanup = fichaRegistro(paneRegistro.contenedor, eleccion, registro, actualizarRegistro);
      componentes.add(cleanup);
    }

    // — Votación
    const paneVotacion = panes.find(p => p.id === 'votacion');
    if (paneVotacion) {
      const cleanup = fichaVotacion(paneVotacion.contenedor, eleccion, partidos, registro, actualizarRegistro);
      componentes.add(cleanup);
    }

    // — Resultados
    const paneResultados = panes.find(p => p.id === 'resultados');
    if (paneResultados) {
      const cleanup = fichaResultados(paneResultados.contenedor, resultados, idEleccion);
      componentes.add(cleanup);
    }

    // — Presentarse
    const panePresentarse = panes.find(p => p.id === 'presentarse');
    if (panePresentarse) {
      panePresentarse.contenedor.innerHTML = '<p class="text-center text-muted">Funcionalidad de presentarse en desarrollo...</p>';
    }
  }

  // 7) Cleanup total
  return () => {
    destruida = true;
    limpiarComponentes(componentes);
    limpiarManejadores(manejadores);
  };
}
