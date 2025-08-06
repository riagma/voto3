import { limpiarManejadores } from '../utiles/utilesVistas.js';
import { servicioVotante } from '../servicios/servicioVotante.js';
import { servicioAlgorand } from '../servicios/servicioAlgorand.js';
import { parsearFechaHora } from '../utiles/utilesFechas.js';
import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';

export function fichaVotacion(contenedor, eleccion, partidos, registro, actualizarRegistro) {
  let manejadores = new Set();
  let regFicha = registro;

  function mostrarConfirmacionVoto(nombrePartido, siglas) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-sm">
          <div class="modal-content border-0 shadow">
            <div class="modal-header bg-primary text-white border-0 p-3">
              <div class="d-flex align-items-center w-100">
                <i class="bi bi-check-circle-fill me-2 flex-shrink-0" style="font-size: 1.25rem;"></i>
                <div class="flex-grow-1">
                  <h6 class="modal-title mb-0 fw-bold">Confirmar Voto</h6>
                  <small class="opacity-75 d-block">Esta acción no se puede deshacer</small>
                </div>
              </div>
            </div>
            <div class="modal-body p-3 text-center">
              <!-- Card del partido -->
              <div class="alert alert-primary bg-primary bg-opacity-10 border-primary border-opacity-25 mb-3 py-2">
                <div class="fw-bold text-primary">${nombrePartido}</div>
                <small class="text-muted">${siglas}</small>
              </div>
            </div>
            <div class="modal-footer border-0 pt-0 pb-3 px-3">
              <div class="d-grid gap-2 w-100">
                <div class="row g-2">
                  <div class="col-6">
                    <button type="button" class="btn btn-outline-secondary w-100 btn-sm" id="cancelarVoto">
                      <i class="bi bi-x-circle me-1 d-none d-md-inline"></i>Cancelar
                    </button>
                  </div>
                  <div class="col-6">
                    <button type="button" class="btn btn-primary w-100 btn-sm" id="confirmarVoto">
                      <i class="bi bi-check-circle me-1 d-none d-md-inline"></i>Confirmar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      
      const bsModal = new bootstrap.Modal(modal, {
        backdrop: 'static',
        keyboard: false
      });

      const btnCancelar = modal.querySelector('#cancelarVoto');
      const btnConfirmar = modal.querySelector('#confirmarVoto');

      btnCancelar.addEventListener('click', () => {
        bsModal.hide();
        resolve(false);
      });

      btnConfirmar.addEventListener('click', () => {
        bsModal.hide();
        resolve(true);
      });

      modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
      });

      bsModal.show();
    });
  }

  function render() {
    limpiarManejadores(manejadores);
    let innerHTML = '';

    if (eleccion.estado === ESTADO_ELECCION.PASADA) {
      if (!regFicha.compromiso) {
        innerHTML += `<div class="alert alert-secondary">No se registró para la votación en esta elección.</div>`;
      } else if (!regFicha.papeDate) {
        innerHTML += `<div class="alert alert-secondary">No se recibió la papeleta para esta elección.</div>`;
      } else {
        innerHTML += `<div class="alert alert-info">Recibió la papeleta el ${regFicha.papeDate}.</div>`;
        if (regFicha.votoDate) {
          innerHTML += `<div class="alert alert-info">Su voto fue emitido el ${regFicha.votoDate}.</div>`;
        } else {
          innerHTML += `<div class="alert alert-warning">Pero su voto no fue emitido.</div>`;
        }
      }
    } else if (eleccion.actual === ELECCION_ACTUAL.VOTACION) {
      if (!regFicha.papeDate) {
        innerHTML += `<div class="alert alert-info">Debe solicitar la papeleta que le da acceso a la votación.</div>`;
        innerHTML += `<button id="btnSolicitar" class="btn btn-outline-primary">Solicitar Papeleta</button>`;
      } else if (!regFicha.votoDate) {
        innerHTML += `<div class="alert alert-info">Se ha recibido la papeleta para esta elección el ${regFicha.papeDate}.</div>`;
        innerHTML += `<div class="alert alert-warning">Debe votar antes del ${eleccion.fechaFinVotacion}.</div>`;
        const lista = partidos.map(p => `
          <button class="btn btn-sm btn-outline-secondary m-1 btn-votar" data-id="${p.siglas}" data-nombre="${p.nombre}">
            <i class="bi bi-vote-fill me-2"></i>${p.nombre}
          </button>
        `).join('');
        innerHTML += `<div class="mb-3"><h6>Seleccione su opción:</h6>${lista}</div>`;
      } else {
        innerHTML += `<div class="alert alert-success">
          <i class="bi bi-check-circle-fill me-2"></i>Su voto ha sido emitido el ${regFicha.votoDate}.
        </div>`;
      }
    } else if (eleccion.estado === ESTADO_ELECCION.ACTUAL) {
      const ahora = new Date();
      const inicioVoto = parsearFechaHora(eleccion.fechaInicioVotacion);
      const finVoto = parsearFechaHora(eleccion.fechaFinVotacion);
      if (ahora < inicioVoto) {
        innerHTML += `<div class="alert alert-info">Todavía no se ha abierto el periodo de votación.</div>`;
        if (!regFicha.compromiso) {
          innerHTML += `<div class="alert alert-secondary">Es necesario registrarse para votar en esta elección.</div>`;
        }
      } else if (ahora > finVoto) {
        innerHTML += `<div class="alert alert-info">Se está realizando el escrutinio.</div>`;
      }
    }

    if (regFicha.papeDate && regFicha.votoDate) {
      const compromisoAddr = servicioAlgorand.urlAccount(regFicha.compromisoAddr);
      const votoTxId = servicioAlgorand.urlTransaction(regFicha.votoTxId);
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
                <strong class="me-2">Transacción:</strong>
                <a href="${votoTxId}" target="_blank" rel="noopener noreferrer" 
                   class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Ver
                </a>
              </div>
            </div>
          </div>
        </div>`;
    }

    contenedor.innerHTML = innerHTML;

    if (eleccion.actual === ELECCION_ACTUAL.VOTACION) {
      if (!regFicha.papeDate) {
        const btn = contenedor.querySelector('#btnSolicitar');
        const handler = async () => {
          try {
            regFicha = await servicioVotante.solicitarPapeletaEleccion(eleccion.id);
            actualizarRegistro(regFicha);
            
            // Modal de éxito para papeleta
            const modalExitoPapeleta = document.createElement('div');
            modalExitoPapeleta.className = 'modal fade';
            modalExitoPapeleta.innerHTML = `
              <div class="modal-dialog modal-dialog-centered modal-sm">
                <div class="modal-content border-0 shadow">
                  <div class="modal-body text-center p-3 p-md-4">
                    <div class="text-primary mb-2 mb-md-3">
                      <i class="bi bi-file-earmark-check-fill" style="font-size: 2rem;"></i>
                    </div>
                    <h6 class="text-primary mb-2 fw-bold">¡Papeleta Recibida!</h6>
                    <p class="mb-3 small">Ya puede proceder a emitir su voto en esta elección.</p>
                    <button type="button" class="btn btn-primary btn-sm px-4" data-bs-dismiss="modal">Continuar</button>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(modalExitoPapeleta);
            const bsModalExitoPapeleta = new bootstrap.Modal(modalExitoPapeleta);
            modalExitoPapeleta.addEventListener('hidden.bs.modal', () => {
              document.body.removeChild(modalExitoPapeleta);
            });
            bsModalExitoPapeleta.show();
            
          } catch (error) {
            alert('Error al solicitar la papeleta: ' + (error?.message || error));
          } finally {
            render();
          }
        };
        btn.addEventListener('click', handler);
        manejadores.add([btn, 'click', handler]);
      } else if (!regFicha.votoDate) {
        contenedor.querySelectorAll('.btn-votar').forEach(btn => {
          const handler = async () => {
            try {
              const partidoId = btn.dataset.id;
              const nombrePartido = btn.dataset.nombre;
              
              // Mostrar modal de confirmación estiloso
              const confirmacion = await mostrarConfirmacionVoto(nombrePartido, partidoId);
              
              if (!confirmacion) {
                return; // Usuario canceló
              }
              
              regFicha = await servicioVotante.emitirPapeletaEleccion(eleccion.id, partidoId);
              actualizarRegistro(regFicha);
              
              // Modal de éxito más compacto
              const modalExito = document.createElement('div');
              modalExito.className = 'modal fade';
              modalExito.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-sm">
                  <div class="modal-content border-0 shadow">
                    <div class="modal-body text-center p-3 p-md-4">
                      <div class="text-success mb-2 mb-md-3">
                        <i class="bi bi-check-circle-fill" style="font-size: 2rem;"></i>
                      </div>
                      <h6 class="text-success mb-2 fw-bold">¡Voto Emitido!</h6>
                      <p class="mb-3 small">Su voto por <strong>${nombrePartido}</strong> ha sido registrado.</p>
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
              
            } catch (error) {
              alert('Error al emitir la papeleta: ' + (error?.message || error));
            } finally {
              render();
            }
          };
          btn.addEventListener('click', handler);
          manejadores.add([btn, 'click', handler]);
        });
      }
    }
  }

  render();
  return () => limpiarManejadores(manejadores);
}

