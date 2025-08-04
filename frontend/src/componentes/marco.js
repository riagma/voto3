import { contexto } from '../modelo/contexto.js';
import { navegarA } from '../rutas/enrutado.js';
import { servicioLogin } from '../servicios/servicioLogin.js';
import { limpiarManejadores } from '../utiles/utilesVistas.js';

export function crearMarco(contenedor) {
  let manejadores = new Set();

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

    let estiloTitulo = '';

    if (nombreVotante) {
      estiloTitulo = `
        style="display:inline-block; font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
                font-weight: 900; font-size: 2em; color: #28a745; /* verde */
                text-shadow: 0 1px 6px #28a74555; letter-spacing: 2px;"
      `;
    } else if (nombreUsuario) {
      estiloTitulo = `
        style="display:inline-block; font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
                font-weight: 900; font-size: 2em; color: #007bff; /* azul */
                text-shadow: 0 1px 6px #007bff55; letter-spacing: 2px;"
      `;
    } else {
      estiloTitulo = `
        style="display:inline-block; font-family: 'Fira Mono', 'Consolas', 'Menlo', monospace;
                font-weight: 900; font-size: 2em; color: #fff;
                text-shadow: 0 1px 6px #007bff55; letter-spacing: 2px;"
      `;
    }

    cabeceraVariable.innerHTML = `
      <div class="d-flex flex-column align-items-center justify-content-center">
        <h1 class="h4 mb-0 text-center">Sistema de Votación</h1>
        <div class="mt-1 mb-2 w-100 d-flex justify-content-center">
          <span id="tituloVoto3" ${estiloTitulo}>Voto3</span>
        </div>
        <div class="w-100">
          ${nombre ? `<div class="d-flex justify-content-between align-items-center px-3 py-2 bg-dark bg-opacity-75 rounded border border-2 border-secondary mt-2"
              style="box-shadow: 0 2px 8px #0001;">
            <div class="user-info">
              <h5 id="nombreUsuario" class="mb-0 text-white">${nombre}</h5>
              <small id="estadoUsuario" class="text-light">Votante registrado</small>
            </div>
            <button id="botonCerrarSesion" class="btn btn-outline-light ms-3">Cerrar sesión</button>
          </div>` : ''}
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
      <div class="d-flex flex-column min-vh-100">
        <!-- Cabecera fija -->
        <header class="bg-dark text-white py-3">
          <div id="cabeceraVariable" class="container">
          </div>
        </header>

        <!-- Contenido dinámico -->
        <main class="flex-grow-1">
          <div id="contenedorMarco" class="container py-4">
            <!-- Aquí se renderizará el contenido específico -->
          </div>
        </main>

        <!-- Pie fijo -->
        <footer class="bg-light py-3 mt-auto">
          <div class="container text-center">
            <p class="text-muted mb-0">© ${new Date().getFullYear()} Sistema de Votación Voto3</p>
          </div>
        </footer>
      </div>
    `;

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
      cancelarSuscripcion();
      limpiarManejadores(manejadores);
    }
  };
}