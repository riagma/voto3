import { api } from '../servicios/api.js';
import { formatearFecha } from '../utiles/formateo.js';

export function vistaAdmin(contenedor) {
  let elecciones = [];
  let destruida = false;
  let limpiezaComponentes = new Set();

  async function cargarElecciones() {
    try {
      if (destruida) return;
      elecciones = await api.get('/api/admin/elecciones');
      renderizar();
    } catch (error) {
      if (destruida) return;
      console.error('Error al cargar elecciones:', error);
      mostrarError('Error al cargar las elecciones');
    }
  }

  function mostrarError(mensaje) {
    contenedor.innerHTML = `
      <div class="container mt-4">
        <div class="alert alert-danger" role="alert">
          ${mensaje}
        </div>
      </div>
    `;
  }

  function renderizar() {
    limpiezaComponentes.forEach(fn => fn());
    limpiezaComponentes.clear();

    contenedor.innerHTML = `
      <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Panel de Administración</h2>
          <button id="botonNuevaEleccion" class="btn btn-primary">
            Nueva Elección
          </button>
        </div>

        <div id="alertaError" class="alert alert-danger" style="display: none"></div>

        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Inicio Registro</th>
                <th>Fin Registro</th>
                <th>Inicio Votación</th>
                <th>Fin Votación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${elecciones.map(eleccion => `
                <tr data-id="${eleccion.id}">
                  <td>${eleccion.nombre}</td>
                  <td>
                    <span class="badge bg-${obtenerColorEstado(eleccion.estado)}">
                      ${eleccion.estado}
                    </span>
                  </td>
                  <td>${formatearFecha(eleccion.fechaInicioRegistro)}</td>
                  <td>${formatearFecha(eleccion.fechaFinRegistro)}</td>
                  <td>${formatearFecha(eleccion.fechaInicioVotacion)}</td>
                  <td>${formatearFecha(eleccion.fechaFinVotacion)}</td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-primary boton-editar">
                        Editar
                      </button>
                      <button class="btn btn-outline-danger boton-eliminar">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    inicializarManejadores();
  }

  function inicializarManejadores() {
    const botonNuevaEleccion = document.getElementById('botonNuevaEleccion');
    const botonesEditar = document.querySelectorAll('.boton-editar');
    const botonesEliminar = document.querySelectorAll('.boton-eliminar');

    const manejarNuevaEleccion = () => {
      // TODO: Implementar creación
      console.log('Crear elección');
    };

    const manejarEditar = (evento) => {
      const id = evento.target.closest('tr').dataset.id;
      // TODO: Implementar edición
      console.log('Editar elección:', id);
    };

    const manejarEliminar = async (evento) => {
      const id = evento.target.closest('tr').dataset.id;
      if (confirm('¿Está seguro de eliminar esta elección?')) {
        try {
          await api.del(`/api/admin/elecciones/${id}`);
          await cargarElecciones();
        } catch (error) {
          mostrarError('Error al eliminar la elección');
        }
      }
    };

    botonNuevaEleccion.addEventListener('click', manejarNuevaEleccion);
    limpiezaComponentes.add([botonNuevaEleccion, 'click', manejarNuevaEleccion]);

    botonesEditar.forEach(boton => {
      boton.addEventListener('click', manejarEditar);
      limpiezaComponentes.add([boton, 'click', manejarEditar]);
    });

    botonesEliminar.forEach(boton => {
      boton.addEventListener('click', manejarEliminar);
      limpiezaComponentes.add([boton, 'click', manejarEliminar]);
    });
  }

  function obtenerColorEstado(estado) {
    const colores = {
      'PENDIENTE': 'secondary',
      'REGISTRO': 'primary',
      'VOTACION': 'success',
      'CERRADA': 'danger'
    };
    return colores[estado] || 'secondary';
  }

  // Renderizado inicial y carga de datos
  renderizar();
  cargarElecciones();

  // Retornar función de limpieza
  return () => {
    destruida = true;
    limpiezaComponentes.forEach(([elemento, evento, manejador]) => {
      elemento.removeEventListener(evento, manejador);
    });
    limpiezaComponentes.clear();
  };
}