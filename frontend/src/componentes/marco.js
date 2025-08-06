import { contexto } from '../modelo/contexto.js';
import { navegarA } from '../rutas/enrutado.js';
import { servicioLogin } from '../servicios/servicioLogin.js';
import { limpiarManejadores } from '../utiles/utilesVistas.js';

export function crearMarco(contenedor) {
  let manejadores = new Set();
  let handleResize; // Definir en el scope superior

  let nombreVotante = contexto.getNombreVotante() || '';
  let nombreUsuario = contexto.getNombreUsuario() || '';

  let nombre = nombreVotante || nombreUsuario || '';

  function renderizarCabecera() {
    limpiarManejadores(manejadores);

    const cabeceraVariable = document.getElementById('cabeceraVariable');
    if (!cabeceraVariable) {
      console.error('No se encontró el contenedor variable de la cabecera');
      return;
    }

    // Estilo más sobrio y profesional
    let estadoUsuario = '';
    let colorIndicador = '';
    let colorVoto3 = '#fff'; // Color por defecto
    
    if (nombreVotante) {
      estadoUsuario = 'Votante Verificado';
      colorIndicador = 'success';
      colorVoto3 = '#28a745'; // Verde para votante
    } else if (nombreUsuario) {
      estadoUsuario = 'Usuario Autenticado';
      colorIndicador = 'primary';
      colorVoto3 = '#007bff'; // Azul para usuario
    }

    cabeceraVariable.innerHTML = `
      <div class="row justify-content-center">
        <div class="col-12 col-lg-10 col-xl-8">
          <div class="d-flex flex-column">
            <!-- Título principal -->
            <div class="text-center mb-3">
              <h1 class="h3 mb-2 text-white fw-normal">Sistema de Votación</h1>
              <div class="d-flex align-items-center justify-content-center">
                <span class="badge bg-light text-dark px-3 py-2 fs-6 fw-bold"
                      style="color: ${colorVoto3} !important; background-color: rgba(255,255,255,0.9) !important; letter-spacing: 2px;">
                  VOTO3
                </span>
              </div>
            </div>
            
            <!-- Información del usuario -->
            ${nombre ? `
              <div class="bg-dark bg-opacity-50 rounded border border-secondary border-opacity-50 p-3">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center">
                    <div class="bg-${colorIndicador} bg-opacity-25 rounded-circle p-2 me-3">
                      <i class="bi bi-person-check text-${colorIndicador}" style="font-size: 1.1rem;"></i>
                    </div>
                    <div>
                      <h6 class="mb-0 text-white fw-normal">${nombre}</h6>
                      <small class="text-${colorIndicador} opacity-75">
                        <i class="bi bi-shield-check me-1"></i>${estadoUsuario}
                      </small>
                    </div>
                  </div>
                  <button id="botonCerrarSesion" class="btn btn-outline-light btn-sm">
                    <i class="bi bi-box-arrow-right me-1"></i>Salir
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    const botonCerrarSesion = document.getElementById('botonCerrarSesion');
    if (botonCerrarSesion) {
      const manejarCierreSesion = () => {
        servicioLogin.logout();
        navegarA('/');
      };
      botonCerrarSesion.addEventListener('click', manejarCierreSesion);
      manejadores.add([botonCerrarSesion, 'click', manejarCierreSesion]);
    }
  }

  function renderizar() {
    contenedor.innerHTML = `
      <div class="d-flex flex-column min-vh-100" style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
        
        <!-- Marcos laterales decorativos (siempre visibles en desktop) -->
        <div class="position-fixed start-0 top-0 h-100" 
             style="width: 200px; 
                    background: linear-gradient(45deg, #007bff25, #28a74525); 
                    border-right: 2px solid #dee2e6; z-index: 0;
                    display: none;"
             id="marcoIzquierdo">
          <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center px-3">
            <div class="mb-4">
              <i class="bi bi-shield-check text-primary" style="font-size: 2.5rem; opacity: 0.4;"></i>
              <p class="text-muted small mt-2 mb-0">Votación</p>
              <p class="text-muted small">Segura</p>
            </div>
            <div class="mb-4">
              <i class="bi bi-lock text-success" style="font-size: 2rem; opacity: 0.4;"></i>
              <p class="text-muted small mt-2 mb-0">Datos</p>
              <p class="text-muted small">Protegidos</p>
            </div>
            <div>
              <i class="bi bi-check-circle text-info" style="font-size: 2rem; opacity: 0.4;"></i>
              <p class="text-muted small mt-2 mb-0">Resultados</p>
              <p class="text-muted small">Verificables</p>
            </div>
          </div>
        </div>
        
        <div class="position-fixed end-0 top-0 h-100" 
             style="width: 200px; 
                    background: linear-gradient(225deg, #007bff25, #28a74525); 
                    border-left: 2px solid #dee2e6; z-index: 0;
                    display: none;"
             id="marcoDerecho">
          <div class="h-100 d-flex flex-column align-items-center justify-content-center text-center px-3">
            <div class="mb-4">
              <i class="bi bi-graph-up text-primary" style="font-size: 2.5rem; opacity: 0.4;"></i>
              <p class="text-muted small mt-2 mb-0">Transparencia</p>
              <p class="text-muted small">Total</p>
            </div>
            <div class="mb-4">
              <i class="bi bi-people text-success" style="font-size: 2rem; opacity: 0.4;"></i>
              <p class="text-muted small mt-2 mb-0">Participación</p>
              <p class="text-muted small">Democrática</p>
            </div>
            <div>
              <i class="bi bi-clock text-info" style="font-size: 2rem; opacity: 0.4;"></i>
              <p class="text-muted small mt-2 mb-0">Resultados</p>
              <p class="text-muted small">Inmediatos</p>
            </div>
          </div>
        </div>

        <!-- Cabecera fija -->
        <header class="bg-dark text-white py-3 position-relative" style="z-index: 10;">
          <div id="cabeceraVariable" class="container">
          </div>
        </header>

        <!-- Contenido dinámico -->
        <main class="flex-grow-1 position-relative" style="z-index: 10;">
          <div id="contenedorMarco">
            <!-- Aquí se renderizará el contenido específico -->
          </div>
        </main>

        <!-- Pie fijo -->
        <footer class="bg-light py-3 mt-auto position-relative border-top" style="z-index: 10;">
          <div class="container">
            <div class="row justify-content-center">
              <div class="col-12 col-lg-10 col-xl-8 text-center">
                <p class="text-muted mb-0">© ${new Date().getFullYear()} Sistema de Votación Voto3</p>
                <small class="text-muted">Blockchain • Transparencia • Democracia</small>
              </div>
            </div>
          </div>
        </footer>
      </div>
    `;

    // Función para mostrar marcos laterales
    function mostrarMarcosLaterales() {
      console.log('Ancho de ventana:', window.innerWidth);
      const marcoIzq = document.getElementById('marcoIzquierdo');
      const marcoDer = document.getElementById('marcoDerecho');
      
      console.log('Marco izquierdo encontrado:', !!marcoIzq);
      console.log('Marco derecho encontrado:', !!marcoDer);
      
      if (window.innerWidth >= 1200) { // Reducido para Full HD
        if (marcoIzq) {
          marcoIzq.style.display = 'block';
          // console.log('Mostrando marco izquierdo');
        }
        if (marcoDer) {
          marcoDer.style.display = 'block';
          // console.log('Mostrando marco derecho');
        }
      } else {
        if (marcoIzq) {
          marcoIzq.style.display = 'none';
          // console.log('Ocultando marco izquierdo');
        }
        if (marcoDer) {
          marcoDer.style.display = 'none';
          // console.log('Ocultando marco derecho');
        }
      }
    }

    // Usar setTimeout para asegurar que el DOM esté listo
    setTimeout(() => {
      mostrarMarcosLaterales();
    }, 100);

    // Agregar event listener para resize
    handleResize = () => {
      mostrarMarcosLaterales();
    };
    
    window.addEventListener('resize', handleResize);
    // Nota: No agregamos window a manejadores porque se limpia globalmente

    renderizarCabecera();
  }

  const cancelarSuscripcion = contexto.observarContexto((estado) => {
    const nombreVotanteNuevo = contexto.getNombreVotante() || '';
    const nombreUsuarioNuevo = contexto.getNombreUsuario() || '';
    if (nombreUsuarioNuevo !== nombreUsuario || nombreVotanteNuevo !== nombreVotante) {
      nombreVotante = contexto.getNombreVotante() || '';
      nombreUsuario = contexto.getNombreUsuario() || '';
      nombre = nombreVotante || nombreUsuario || '';
      renderizarCabecera();
    }
  });

  renderizar();

  return {
    contenedorMarco: document.getElementById('contenedorMarco'),
    limpiarMarco: () => {
      // Remover event listener de resize
      window.removeEventListener('resize', handleResize);
      cancelarSuscripcion();
      limpiarManejadores(manejadores);
    }
  };
}