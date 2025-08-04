import { limpiarManejadores } from '../utiles/utilesVistas.js';
import { servicioVotante } from '../servicios/servicioVotante.js';
import { servicioAlgorand } from '../servicios/servicioAlgorand.js';
import { parsearFechaHora } from '../utiles/utilesFechas.js';
import { ESTADO_ELECCION, ELECCION_ACTUAL } from '../utiles/constantes.js';


export function fichaVotacion(contenedor, eleccion, partidos, registro, actualizarRegistro) {
  let manejadores = new Set();
  let regFicha = registro;

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
          <button class="btn btn-sm btn-outline-secondary m-1 btn-votar" data-id="${p.siglas}">
            ${p.nombre}
          </button>
        `).join('');
        innerHTML += `<div>${lista}</div>`;
      } else {
        innerHTML += `<div class="alert alert-success">Su voto ha sido emitido el ${regFicha.votoDate}.</div>`;
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
        <ul class="list-unstyled">
          <li class="d-flex flex-wrap align-items-center gap-2">
            <div class="d-flex align-items-center">
              <strong>Cuenta Blockchain:</strong>
              <a href="${compromisoAddr}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary ms-2">Ver</a>
            </div>
            <span class="mx-2 d-none d-md-inline">|</span>
            <div class="d-flex align-items-center">
              <strong>Voto Registrado:</strong>
              <a href="${votoTxId}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary ms-2">Ver</a>
            </div>
          </li>
        </ul>`;
    }

    contenedor.innerHTML = innerHTML;

    if (eleccion.actual === ELECCION_ACTUAL.VOTACION)
      if (!regFicha.papeDate) {
        const btn = contenedor.querySelector('#btnSolicitar');
        const handler = async () => {
          try {
            regFicha = await servicioVotante.solicitarPapeletaEleccion(eleccion.id);
            actualizarRegistro(regFicha);
            alert('Papeleta recibida.');
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
              regFicha = await servicioVotante.emitirPapeletaEleccion(eleccion.id, partidoId);
              actualizarRegistro(regFicha);
              alert('Papeleta emitida.');
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


    // if (eleccion.actual === ELECCION_ACTUAL.VOTACION && regFicha.papeDate && !regFicha.votoDate) {
    //   // mostrar lista de partidos
    //   const lista = partidos.map(p => `
    //     <button class="btn btn-sm btn-outline-secondary m-1 btn-votar" data-id="${p.id}">
    //       ${p.nombre}
    //     </button>
    //   `).join('');
    //   contenedor.innerHTML = `<div>${lista}</div>`;
    //   contenedor.querySelectorAll('.btn-votar').forEach(btn => {
    //     const handler = async () => {
    //       const partidoId = btn.dataset.id;
    //       // await servicioEleccion.votar(eleccion.id, usuario, partidoId);
    //       // votoUsuario = await servicioEleccion.obtenerVotoUsuario(eleccion.id, usuario);
    //       render();
    //     };
    //     btn.addEventListener('click', handler);
    //     manejadores.add([btn, 'click', handler]);
    //   });
    // }

    // else {
    //   // mostrar datos de su voto
    //   if (!votoUsuario) {
    //     contenedor.innerHTML = `<div class="alert alert-warning">
    //       No has votado y el plazo ha terminado.</div>`;
    //   } else {
    //     contenedor.innerHTML = `
    //       <ul class="list-unstyled">
    //         <li><strong>Tu voto:</strong> ${votoUsuario.partido}</li>
    //         <li><strong>Anulador:</strong> ${votoUsuario.anulador}</li>
    //         <li><strong>Tx:</strong> ${votoUsuario.txId}</li>
    //       </ul>`;
    //   }
    // }
  }

  render();
  return () => limpiarManejadores(manejadores);
}

