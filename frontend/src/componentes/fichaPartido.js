export function fichaPartido(contenedor, partido) {
  contenedor.innerHTML = `
    <div class="card h-100">
      <div class="card-body">
        <h6>${partido.nombre}</h6>
        <p>${partido.descripcion}</p>
      </div>
    </div>`;
  return () => {}; // si no hay listeners, basta con no hacer nada
}
