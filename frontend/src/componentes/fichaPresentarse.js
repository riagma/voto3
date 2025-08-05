// permite “presentarse” si no se ha hecho aún
import { servicioEleccion } from '../servicios/servicioEleccion.js';

export function fichaPresentarse(contenedor, idEleccion, usuario) {
  let manejadores = new Set();

  async function render() {
    const yaCandidato = await servicioEleccion.estaCandidato(idEleccion, usuario);
    contenedor.innerHTML = yaCandidato
      ? `<div class="alert alert-info">Ya estás presentado como candidato.</div>`
      : `<button id="btnPresentarse" class="btn btn-primary">Presentarse</button>`;
    if (!yaCandidato) {
      const btn = contenedor.querySelector('#btnPresentarse');
      const handler = async () => {
        await servicioEleccion.presentarse(idEleccion, usuario);
        render();
      };
      btn.addEventListener('click', handler);
      manejadores.add([btn, 'click', handler]);
    }
  }

  render();
  return () => limpiarManejadores(manejadores);
}
