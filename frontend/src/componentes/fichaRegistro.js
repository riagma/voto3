// muestra o gestiona el registro del votante
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
      innerHTML += `<div class="alert alert-secondary">El periodo de registro todavía no se ha abierto.</div>`;

    } else if (eleccion.estado === ESTADO_ELECCION.PASADA) {
      if (regFicha.compromiso) {
        innerHTML += `<div class="alert alert-info">Se registró para la votación en esta elección el ${regFicha.compromisoFecha}.</div>`;
      } else {
        innerHTML += `<div class="alert alert-secondary">No se registró para la votación en esta elección.</div>`;
      }
    } else if (eleccion.actual === ELECCION_ACTUAL.REGISTRO) {
      if (regFicha.compromiso) {
        innerHTML += `<div class="alert alert-info">Se ha registrado para la votación en esta elección el ${regFicha.compromisoFecha}.</div>`;
      } else {
        innerHTML += `<div class="alert alert-info">Puede registrarse para la votación en esta elección.</div>`;
      }
    } else {
      if (regFicha.compromiso) {
        innerHTML += `<div class="alert alert-info">Se ha registrado para la votación en esta elección el ${regFicha.compromisoFecha}.</div>`;
      } else {
        innerHTML += `<div class="alert alert-secondary">No se ha registrado para la votación en esta elección.</div>`;
      }
    }

    if (regFicha.compromiso) {
      const compromisoAddr = servicioAlgorand.urlAccount(regFicha.compromisoAddr);
      const compromisoTxId = servicioAlgorand.urlTransaction(regFicha.compromisoTxId);

      innerHTML += `
        <ul class="list-unstyled">
          <li class="d-flex flex-wrap align-items-center gap-2">
            <div class="d-flex align-items-center">
              <strong>Cuenta Blockchain:</strong>
              <a href="${compromisoAddr}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary ms-2">Ver</a>
            </div>
            <span class="mx-2 d-none d-md-inline">|</span>
            <div class="d-flex align-items-center">
              <strong>Compromiso Registrado:</strong>
              <a href="${compromisoTxId}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary ms-2">Ver</a>
            </div>
          </li>
        </ul>`;
    }
    // <li><strong>Fecha de registro:</strong> ${registro.compromisoFecha}</li>

    if (eleccion.actual === ELECCION_ACTUAL.REGISTRO && !regFicha.compromiso) {
      innerHTML += `<button id="btnRegistrar" class="btn btn-outline-primary">Registrarse</button>`;
    }

    contenedor.innerHTML = innerHTML;

    if (eleccion.actual === ELECCION_ACTUAL.REGISTRO && !regFicha.compromiso) {
      const btn = contenedor.querySelector('#btnRegistrar');
      const handler = async () => {
        try {
          regFicha = await servicioVotante.registrarVotanteEleccion(eleccion.id);
          actualizarRegistro(regFicha);
          alert('Registro exitoso.');
        } catch (error) {
          alert('Error al registrar: ' + (error?.message || error));
        } finally {
          render();
        }
      };
      btn.addEventListener('click', handler);
      manejadores.add([btn, 'click', handler]);
    }
  }

  render();
  return () => limpiarManejadores(manejadores);
}
