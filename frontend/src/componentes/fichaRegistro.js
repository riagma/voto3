// muestra o gestiona el registro del votante
import { contexto } from '../modelo/contexto.js';
import { servicioVotante } from '../servicios/servicioVotante.js';
import { servicioAlgorand } from '../servicios/servicioAlgorand.js';
import { limpiarManejadores } from '../utiles/utilesVistas.js';
import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';

export function fichaRegistro(contenedor, eleccion, registro, actualizarRegistro) {
  let manejadores = new Set();
  let regFicha = registro;

  function render() {
    limpiarManejadores(manejadores);
    let innerHTML = '';

    if (eleccion.estado === ESTADO_ELECCION.FUTURA) {
      innerHTML += `<div class="alert alert-secondary">
        <i class="bi bi-clock me-2"></i>El periodo de registro todavía no se ha abierto.
      </div>`;

    } else if (eleccion.estado === ESTADO_ELECCION.PASADA) {
      if (regFicha.compromiso) {
        innerHTML += `<div class="alert alert-info">
          <i class="bi bi-check-circle-fill me-2"></i>Se registró para la votación el ${regFicha.compromisoFecha}.
        </div>`;
      } else {
        innerHTML += `<div class="alert alert-secondary">
          <i class="bi bi-x-circle me-2"></i>No se registró para la votación en esta elección.
        </div>`;
      }
    } else if (eleccion.actual === ELECCION_ACTUAL.REGISTRO) {
      if (regFicha.compromiso) {
        innerHTML += `<div class="alert alert-success">
          <i class="bi bi-check-circle-fill me-2"></i>Se ha registrado para la votación el ${regFicha.compromisoFecha}.
        </div>`;
      } else {
        innerHTML += `<div class="alert alert-info">
          <i class="bi bi-info-circle-fill me-2"></i>Puede registrarse para la votación en esta elección.
        </div>`;
      }
    } else {
      if (regFicha.compromiso) {
        innerHTML += `<div class="alert alert-info">
          <i class="bi bi-check-circle-fill me-2"></i>Se ha registrado para la votación el ${regFicha.compromisoFecha}.
        </div>`;
      } else {
        innerHTML += `<div class="alert alert-secondary">
          <i class="bi bi-x-circle me-2"></i>No se ha registrado para la votación en esta elección.
        </div>`;
      }
    }

    if (regFicha.compromiso) {
      const compromisoAddr = servicioAlgorand.urlAccount(regFicha.compromisoAddr);
      const compromisoTxId = servicioAlgorand.urlTransaction(regFicha.compromisoTxId);

      innerHTML += `
        <div class="card border-success bg-success bg-opacity-10 mt-3">
          <div class="card-body p-3">
            <h6 class="card-title text-success mb-3">
              <i class="bi bi-shield-check me-2"></i>Verificación Blockchain
            </h6>
            <div class="d-flex flex-wrap gap-3">
              <div class="d-flex align-items-center">
                <strong class="me-2">Cuenta:</strong>
                <a href="${compromisoAddr}" target="_blank" rel="noopener noreferrer" 
                   class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Ver
                </a>
              </div>
              <div class="d-flex align-items-center">
                <strong class="me-2">Compromiso:</strong>
                <a href="${compromisoTxId}" target="_blank" rel="noopener noreferrer" 
                   class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Ver
                </a>
              </div>
            </div>
          </div>
        </div>`;
    }

    if (eleccion.actual === ELECCION_ACTUAL.REGISTRO && !regFicha.compromiso) {
      if (!contexto.estaIdentificado()) {
        innerHTML += `
          <div class="mt-3">
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Debe estar identificado como votante para poder registrarse.
            </div>
          </div>`;
      } else {
        innerHTML += `
          <div class="mt-3">
            <button id="btnRegistrar" class="btn btn-primary">
              <i class="bi bi-person-plus me-2"></i>Registrarse para votar
            </button>
          </div>`;
      }
    }

    contenedor.innerHTML = innerHTML;

    if (eleccion.actual === ELECCION_ACTUAL.REGISTRO && !regFicha.compromiso && contexto.estaIdentificado()) {
      const btn = contenedor.querySelector('#btnRegistrar');
      if (btn) {
        const handler = async () => {
          try {
            regFicha = await servicioVotante.registrarVotanteEleccion(eleccion.id);
            actualizarRegistro(regFicha);
            
            // Modal de éxito
            mostrarExitoRegistro();
            
          } catch (error) {
            // Si el usuario cancela o hay error, mostrar mensaje apropiado
            if (error?.message?.includes('cancel') || error?.message?.includes('abort')) {
              mostrarRegistroCancelado();
            } else {
              alert('Error al registrar: ' + (error?.message || error));
            }
          } finally {
            render();
          }
        };
        btn.addEventListener('click', handler);
        manejadores.add([btn, 'click', handler]);
      }
    }
  }

  function mostrarRegistroCancelado() {
    const modalCancelado = document.createElement('div');
    modalCancelado.className = 'modal fade';
    modalCancelado.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-3">
            <div class="text-warning mb-2">
              <i class="bi bi-x-circle-fill" style="font-size: 2rem;"></i>
            </div>
            <h6 class="text-warning mb-2 fw-bold">Registro Cancelado</h6>
            <p class="mb-3 small">El registro para esta elección ha sido cancelado.</p>
            <button type="button" class="btn btn-secondary btn-sm px-4" data-bs-dismiss="modal">Continuar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalCancelado);
    const bsModalCancelado = new bootstrap.Modal(modalCancelado);
    modalCancelado.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modalCancelado);
    });
    bsModalCancelado.show();
  }

  function mostrarExitoRegistro() {
    const modalExito = document.createElement('div');
    modalExito.className = 'modal fade';
    modalExito.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-0 shadow">
          <div class="modal-body text-center p-3">
            <div class="text-success mb-2">
              <i class="bi bi-check-circle-fill" style="font-size: 2rem;"></i>
            </div>
            <h6 class="text-success mb-2 fw-bold">¡Registro Exitoso!</h6>
            <p class="mb-3 small">Se ha registrado correctamente para esta elección.</p>
            <button type="button" class="btn btn-success btn-sm px-4" data-bs-dismiss="modal">Continuar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalExito);
    const bsModalExito = new bootstrap.Modal(modalExito);
    modalExito.addEventListener('hidden.bs.modal', () => {
      document.body.removeChild(modalExito);
    });
    bsModalExito.show();
  }

  render();
  return () => limpiarManejadores(manejadores);
}
