// muestra estadísticas globales y por partido
import { limpiarManejadores } from '../utiles/utilesVistas.js';

export function fichaResultados(contenedor, resultados) {
  let manejadores = new Set();

  function render() {
    limpiarManejadores(manejadores);

    if (!resultados) {
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
    const handler = () => {
      alert('Funcionalidad de verificación no implementada');
      // Aquí iría la lógica de verificación del voto
    };
    btnVerificar.addEventListener('click', handler);
    manejadores.add([btnVerificar, 'click', handler]);
  }
  
  render();
  return () => limpiarManejadores(manejadores);
}
