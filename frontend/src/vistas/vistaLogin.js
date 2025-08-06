import { servicioLogin } from '../servicios/servicioLogin.js';
import { navegarA } from '../rutas/enrutado.js';
import { limpiarManejadores } from '../utiles/utilesVistas.js';

export function vistaLogin(container) {
  let manejadores = new Set();
  let modoRegistro = false;

  function renderizar() {
    container.innerHTML = `
      <div class="container py-4">
        <div class="row justify-content-center">
          <div class="col-12 col-sm-8 col-md-6 col-lg-5 col-xl-4">
            <div class="card border-0 shadow">
              <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                  <h3 class="card-title mb-0">Acceso Usuario Voto3</h3>
                  <button id="btnToggleRegistro" class="btn btn-outline-secondary btn-sm">
                    ${modoRegistro ? 'Cancelar' : 'Nuevo'}
                  </button>
                </div>
                ${modoRegistro ? `
                  <div class="alert alert-warning mb-3" role="alert">
                    <div class="d-flex">
                      <i class="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" style="color: #856404;"></i>
                      <div class="small">
                        <strong>Importante:</strong>
                        <ul class="mb-0 mt-1">
                          <li>Use credenciales <strong>diferentes</strong> a las del censo electoral</li>
                          <li>Si se registra en una elección, <strong>recuerde bien</strong> este usuario y contraseña</li>
                          <li>Si los olvida, <strong>no podrá votar</strong> - no hay recuperación posible</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <form id="formRegistro">
                    <div class="form-group mb-3">
                      <label class="form-label small text-muted">Nombre de usuario</label>
                      <input name="nombreUsuario" type="text" class="form-control" placeholder="Nombre de usuario único" required />
                    </div>
                    <div class="form-group mb-3">
                      <label class="form-label small text-muted">Contraseña</label>
                      <div class="input-group">
                        <input name="contrasena" type="password" class="form-control" placeholder="Contraseña" required />
                        <span class="input-group-text bg-transparent" role="button" id="btnMostrarContrasena1" style="cursor: pointer">
                          <i class="bi bi-eye"></i>
                        </span>
                      </div>
                    </div>
                    <div class="form-group mb-4">
                      <label class="form-label small text-muted">Repetir contraseña</label>
                      <div class="input-group">
                        <input name="repetirContrasena" type="password" class="form-control" placeholder="Repetir contraseña" required />
                        <span class="input-group-text bg-transparent" role="button" id="btnMostrarContrasena2" style="cursor: pointer">
                          <i class="bi bi-eye"></i>
                        </span>
                      </div>
                    </div>
                    <div class="d-grid gap-2">
                      <button type="submit" class="btn btn-success">
                        <i class="bi bi-person-plus me-2"></i>Crear Usuario
                      </button>
                    </div>
                  </form>
                ` : `
                  <form id="formLogin">
                    <div class="form-group mb-3">
                      <label class="form-label small text-muted">Nombre de usuario</label>
                      <input name="nombreUsuario" type="text" class="form-control" placeholder="Nombre de usuario" required />
                    </div>
                    <div class="form-group mb-4">
                      <label class="form-label small text-muted">Contraseña</label>
                      <div class="input-group">
                        <input name="contrasena" type="password" class="form-control" placeholder="Contraseña" required />
                        <span class="input-group-text bg-transparent" role="button" id="btnMostrarContrasena" style="cursor: pointer">
                          <i class="bi bi-eye"></i>
                        </span>
                      </div>
                    </div>
                    <div class="d-grid">
                      <button type="submit" class="btn btn-primary">
                        <i class="bi bi-box-arrow-in-right me-2"></i>Entrar
                      </button>
                    </div>
                  </form>
                `}
                <div id="mensajeError" class="alert alert-danger mt-3" style="display:none"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function inicializarManejadores() {
    limpiarManejadores(manejadores);

    const btnToggle = container.querySelector('#btnToggleRegistro');
    const divError = container.querySelector('#mensajeError');

    const onToggle = () => {
      modoRegistro = !modoRegistro;
      renderizar();
      inicializarManejadores();
    };
    btnToggle.addEventListener('click', onToggle);
    manejadores.add([btnToggle, 'click', onToggle]);

    // Función para manejar mostrar/ocultar contraseña
    function configurarMostrarContrasena(btnId, inputName) {
      const btnShow = container.querySelector(`#${btnId}`);
      const inputPass = container.querySelector(`input[name="${inputName}"]`);
      
      if (btnShow && inputPass) {
        const onTogglePass = () => {
          const tipo = inputPass.type === 'password' ? 'text' : 'password';
          inputPass.type = tipo;
          btnShow.innerHTML = `<i class="bi bi-eye${tipo==='password'?'':'-slash'}"></i>`;
        };
        btnShow.addEventListener('click', onTogglePass);
        manejadores.add([btnShow, 'click', onTogglePass]);
      }
    }

    if (modoRegistro) {
      const formReg = container.querySelector('#formRegistro');
      
      // Configurar botones de mostrar contraseña para registro
      configurarMostrarContrasena('btnMostrarContrasena1', 'contrasena');
      configurarMostrarContrasena('btnMostrarContrasena2', 'repetirContrasena');
      
      const onCrear = async e => {
        e.preventDefault();
        divError.style.display = 'none';
        const data = new FormData(formReg);
        const nombreUsuario = data.get('nombreUsuario');
        const contrasena = data.get('contrasena');
        const repetirContrasena = data.get('repetirContrasena');
        try {
          await servicioLogin.crearUsuario(nombreUsuario, contrasena, repetirContrasena);
          navegarA('/p');
        } catch (err) {
          divError.textContent = err.message || 'Error al crear usuario.';
          divError.style.display = 'block';
        }
      };
      formReg.addEventListener('submit', onCrear);
      manejadores.add([formReg, 'submit', onCrear]);

    } else {
      const formLog = container.querySelector('#formLogin');
      
      // Configurar botón de mostrar contraseña para login
      configurarMostrarContrasena('btnMostrarContrasena', 'contrasena');

      const onLogin = async e => {
        e.preventDefault();
        divError.style.display = 'none';
        const data = new FormData(formLog);
        const nombreUsuario = data.get('nombreUsuario');
        const contrasena = data.get('contrasena');
        try {
          await servicioLogin.loginUsuario(nombreUsuario, contrasena);
          navegarA('/p');
        } catch (err) {
          divError.textContent = err.message || 'Error de autenticación.';
          divError.style.display = 'block';
        }
      };
      formLog.addEventListener('submit', onLogin);
      manejadores.add([formLog, 'submit', onLogin]);
    }
  }

  renderizar();
  inicializarManejadores();

  return () => limpiarManejadores(manejadores);
}
