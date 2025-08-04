export function mostrarSpinnerOverlay(mensaje = 'Procesando, por favor espere...') {
  const overlay = document.createElement('div');
  overlay.id = 'spinner-overlay-voto3';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.3)';
  overlay.style.zIndex = 2000;
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.innerHTML = `
    <div class="d-flex flex-column align-items-center">
      <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
        <span class="visually-hidden">${mensaje}</span>
      </div>
      <div class="mt-3 text-white fs-5">${mensaje}</div>
    </div>
  `;
  document.body.appendChild(overlay);
}

export function ocultarSpinnerOverlay() {
  const overlay = document.getElementById('spinner-overlay-voto3');
  if (overlay) document.body.removeChild(overlay);
}