import { contexto } from '../modelo/contexto.js';
import { voto3IDB as idb } from '../modelo/voto3IDB.js';
import { servicioLogin } from '../servicios/servicioLogin.js';
import { encriptarJSON, desencriptarJSON } from '../utiles/utilesCrypto.js';

export async function notificarAccesoIdentificado(titulo = 'Acceso al servidor de Voto3') {
  const nombreUsuario = contexto.getNombreUsuario();
  if (!nombreUsuario) {
    throw new Error('No hay usuario autenticado');
  }
  const usuario = await idb.obtenerUsuario(nombreUsuario);
  if (!usuario) {
    throw new Error('Usuario no encontrado en la base de datos');
  }
  let credenciales = null;
  if (usuario.credenciales) {
    credenciales = await desencriptarJSON(usuario.credenciales, servicioLogin.getClaveDerivada());
  }

  console.log('Notificando acceso al servidor Voto3 para:', nombreUsuario);

  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal fade'; modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-sm" style="max-width: 400px;">
        <div class="modal-content">
          <div class="modal-header" style="cursor: move; padding: 1rem;">
            <div>
              <h5 class="modal-title mb-1">${titulo}</h5>
              <small class="text-muted">Este es un disclaimer de relleno mientras se me ocurre que poner</small>
            </div>
          </div>
          <div class="modal-body" style="padding: 1rem;">
            <div class="form-group mb-3">
              <input type="text" class="form-control form-control-sm" id="dniInput" placeholder="DNI del censo" required>
            </div>
            <div class="form-group mb-3">
              <div class="input-group input-group-sm">
                <input type="password" class="form-control" id="passInput" placeholder="Contraseña de Voto3" required>
                <span class="input-group-text bg-transparent" role="button" id="btnMostrarContrasena" style="cursor: pointer">
                  <i class="bi bi-eye"></i>
                </span>
              </div>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="rememberCheckbox">
              <label class="form-check-label" for="rememberCheckbox">Guardar credenciales</label>
            </div>
            <div id="errorCenso" class="alert alert-danger alert-sm" style="display:none; padding: 0.5rem; font-size: 0.875rem;"></div>
          </div>
          <div class="modal-footer justify-content-between" style="padding: 1rem;">
            <button type="button" class="btn btn-secondary btn-sm" id="cancelCenso">Cancelar</button>
            <button type="button" class="btn btn-primary btn-sm" id="acceptCenso">Aceptar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal, { backdrop: 'static', keyboard: false });
    bsModal.show();

    const dniInput = modal.querySelector('#dniInput');
    const passInput = modal.querySelector('#passInput');
    const rememberCheckbox = modal.querySelector('#rememberCheckbox');
    const errorDiv = modal.querySelector('#errorCenso');
    const btnAccept = modal.querySelector('#acceptCenso');
    const btnCancel = modal.querySelector('#cancelCenso');
    const btnMostrarContrasena = modal.querySelector('#btnMostrarContrasena');

    // Funcionalidad para mostrar/ocultar contraseña
    btnMostrarContrasena.addEventListener('click', () => {
      const tipo = passInput.type === 'password' ? 'text' : 'password';
      passInput.type = tipo;
      btnMostrarContrasena.innerHTML = `<i class="bi bi-eye${tipo==='password'?'':'-slash'}"></i>`;
    });

    // Hacer el modal movible (solo en pantallas grandes)
    if (window.innerWidth > 768) {
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 0;
      let yOffset = 0;

      const modalDialog = modal.querySelector('.modal-dialog');
      const modalHeader = modal.querySelector('.modal-header');

      modalHeader.addEventListener('mousedown', dragStart);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);

      function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === modalHeader || modalHeader.contains(e.target)) {
          isDragging = true;
        }
      }

      function drag(e) {
        if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          
          // Limitar el movimiento para que no se salga de la pantalla
          const maxX = window.innerWidth - modalDialog.offsetWidth;
          const maxY = window.innerHeight - modalDialog.offsetHeight;
          
          currentX = Math.max(0, Math.min(currentX, maxX));
          currentY = Math.max(0, Math.min(currentY, maxY));
          
          xOffset = currentX;
          yOffset = currentY;
          modalDialog.style.transform = `translate(${currentX}px, ${currentY}px)`;
          modalDialog.style.margin = '0';
          modalDialog.style.position = 'fixed';
          modalDialog.style.top = '0';
          modalDialog.style.left = '0';
        }
      }

      function dragEnd() {
        isDragging = false;
      }

      // Limpiar event listeners al cerrar el modal
      modal.addEventListener('hidden.bs.modal', () => {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
      });
    }

    if (credenciales) {
      dniInput.value = credenciales.dni;
      passInput.value = credenciales.contrasena;
      rememberCheckbox.checked = true;
    }

    btnAccept.addEventListener('click', async () => {
      const dni = dniInput.value.trim();
      const contrasena = passInput.value;
      if (!dni || !contrasena) {
        errorDiv.textContent = 'DNI y contraseña son obligatorios.';
        errorDiv.style.display = 'block';
        return;
      }
      try {
        if (rememberCheckbox.checked) {
          const credenciales = await encriptarJSON({ dni, contrasena }, servicioLogin.getClaveDerivada());
          console.log('Guardando credenciales en IDB:', nombreUsuario, credenciales);
          await idb.actualizarUsuario(nombreUsuario, { credenciales });
        }
        bsModal.hide(); modal.remove();
        resolve({ dni, contrasena, recordar: rememberCheckbox.checked });
      } catch (err) {
        errorDiv.textContent = err.message || 'Error al recuperar datos.';
        errorDiv.style.display = 'block';
      }
    });

    btnCancel.addEventListener('click', () => {
      bsModal.hide(); modal.remove();
      resolve(null);
    });
  });
}

/**
 * Envuelve una llamada al servidor Voto3 para notificar acceso primero.
 * @param {Function} peticion - async function({dni,contrasena}, ...args)
 * @returns {Function} async wrapper(...args)
 */
export function wrapAccesoIdentificado(titulo, peticion) {
  return async function(...args) {
    const credenciales = await notificarAccesoIdentificado(titulo);
    // if (!credenciales) throw new Error('Operación cancelada por el usuario');
    return peticion(credenciales, ...args);
  }
}
