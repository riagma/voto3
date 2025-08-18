import { limpiarManejadores } from '../utiles/utilesVistas.js';
import { servicioVotante } from '../servicios/servicioVotante.js';

export function fichaResultados(contenedor, resultados, idEleccion) {
  let manejadores = new Set();

  function render() {
    limpiarManejadores(manejadores);

    if (!resultados || Object.keys(resultados).length === 0) {
      contenedor.innerHTML = `<div class="alert alert-secondary">No hay resultados para esta elección</div>`;
      return;
    }

    // Fecha formateada
    const fechaRecuento = new Date(resultados.fechaRecuento);
    const fechaFormateada = fechaRecuento.toLocaleString();

    // Paleta de colores predefinida para asignar dinámicamente
    const paleta = [
      '#3498db', // azul
      '#2ecc71', // verde
      '#e74c3c', // rojo
      '#f39c12', // naranja
      '#9b59b6', // morado
      '#1abc9c', // turquesa
      '#e67e22', // naranja oscuro
      '#34495e', // azul oscuro
      '#16a085', // verde azulado
      '#8e44ad', // morado oscuro
      '#27ae60', // verde esmeralda
      '#d35400'  // naranja rojizo
    ];
    
    // Asignar colores dinámicamente
    const partidosConColor = {};
    resultados.partidos.forEach((p, index) => {
      partidosConColor[p.partidoId] = paleta[index % paleta.length];
    });

    // Barras de resultados con colores y porcentajes
    const barrasResultados = resultados.partidos.map((p, index) => {
      const color = partidosConColor[p.partidoId];
      
      return `
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            <strong>${p.nombrePartido} (${p.partidoId})</strong>
            <span>${p.votos} votos (${p.porcentaje.toFixed(2)}%)</span>
          </div>
          <div class="progress" style="height: 25px;">
            <div class="progress-bar" role="progressbar" 
                 style="width: ${p.porcentaje}%; background-color: ${color};" 
                 aria-valuenow="${p.porcentaje}" aria-valuemin="0" aria-valuemax="100">
              ${p.porcentaje.toFixed(1)}%
            </div>
          </div>
        </div>
      `;
    }).join('');

    contenedor.innerHTML = `
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">Resultados electorales</h5>
          <p class="card-text text-muted small">Recuento: ${fechaFormateada}</p>
          
          <div class="row mb-4">
            <div class="col-md-3 col-6">
              <div class="border rounded p-2 text-center mb-2">
                <h6>Participación</h6>
                <h4>${resultados.votantes}</h4>
                <small class="text-muted">votantes</small>
              </div>
            </div>
            <div class="col-md-3 col-6">
              <div class="border rounded p-2 text-center mb-2">
                <h6>Blancos</h6>
                <h4>${resultados.votosBlancos || 0}</h4>
                <small class="text-muted">votos</small>
              </div>
            </div>
            <div class="col-md-3 col-6">
              <div class="border rounded p-2 text-center mb-2">
                <h6>Nulos</h6>
                <h4>${resultados.votosNulos || 0}</h4>
                <small class="text-muted">votos</small>
              </div>
            </div>
            <div class="col-md-3 col-6">
              <div class="border rounded p-2 text-center mb-2">
                <h6>Abstención</h6>
                <h4>${resultados.abstenciones || 0}</h4>
                <small class="text-muted">votantes</small>
              </div>
            </div>
          </div>
          
          <h5 class="mb-3">Resultados por partido</h5>
          ${barrasResultados}
        </div>
      </div>
      
      <button id="btnVerificar" class="btn btn-outline-info">Verificar mi voto</button>
    `;
    
    // Añadir manejador para verificar voto
    const btnVerificar = contenedor.querySelector('#btnVerificar');
    const handler = async () => {
      try {
        const siglas = await servicioVotante.comprobarVotoEmitido(idEleccion);
        
        // Buscar el nombre del partido por las siglas
        const partido = resultados.partidos.find(p => p.partidoId === siglas);
        const nombrePartido = partido ? partido.nombrePartido : siglas;
        
        // Crear alerta flotante de éxito
        mostrarAlertaFlotante(
          'success',
          'bi-check-circle-fill',
          'Verificación exitosa',
          `Su voto fue emitido para <strong>${nombrePartido} (${siglas})</strong>`
        );
        
      } catch (error) {
        console.error('Error verificando el voto:', error);
        
        // Crear alerta flotante de error
        mostrarAlertaFlotante(
          'warning',
          'bi-exclamation-triangle-fill',
          'No se pudo verificar el voto',
          error.message
        );
      }
    };
    btnVerificar.addEventListener('click', handler);
    manejadores.add([btnVerificar, 'click', handler]);
  }
  
  render();
  return () => limpiarManejadores(manejadores);
}

// Función para mostrar alertas flotantes y responsivas
function mostrarAlertaFlotante(tipo, icono, titulo, mensaje) {
  // Crear el contenedor de alertas si no existe
  let contenedorAlertas = document.getElementById('alertas-flotantes');
  if (!contenedorAlertas) {
    contenedorAlertas = document.createElement('div');
    contenedorAlertas.id = 'alertas-flotantes';
    contenedorAlertas.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1055;
      max-width: 90vw;
      width: 100%;
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(contenedorAlertas);
  }

  // Crear la alerta
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} alert-dismissible fade show mb-3 shadow-sm`;
  alerta.style.cssText = `
    pointer-events: auto;
    animation: slideInRight 0.3s ease-out;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    line-height: 1.4;
  `;

  alerta.innerHTML = `
    <div class="d-flex align-items-start">
      <i class="bi ${icono} me-2 mt-1 flex-shrink-0"></i>
      <div class="flex-grow-1">
        <div class="fw-bold mb-1">${titulo}</div>
        <div>${mensaje}</div>
      </div>
      <button type="button" class="btn-close btn-close-white ms-2 flex-shrink-0" aria-label="Cerrar"></button>
    </div>
  `;

  // Agregar estilos de animación si no existen
  if (!document.getElementById('alertas-flotantes-styles')) {
    const estilos = document.createElement('style');
    estilos.id = 'alertas-flotantes-styles';
    estilos.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      @media (max-width: 576px) {
        #alertas-flotantes {
          top: 10px !important;
          right: 10px !important;
          left: 10px !important;
          max-width: none !important;
          width: auto !important;
        }
      }
    `;
    document.head.appendChild(estilos);
  }

  // Agregar la alerta al contenedor
  contenedorAlertas.appendChild(alerta);

  // Función para cerrar la alerta
  const cerrarAlerta = () => {
    alerta.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      if (alerta.parentNode) {
        alerta.remove();
      }
      // Limpiar el contenedor si no hay más alertas
      if (contenedorAlertas.children.length === 0) {
        contenedorAlertas.remove();
      }
    }, 300);
  };

  // Evento para el botón de cerrar
  const btnCerrar = alerta.querySelector('.btn-close');
  btnCerrar.addEventListener('click', cerrarAlerta);

  // Auto-cerrar después de 8 segundos
  setTimeout(cerrarAlerta, 8000);
}
