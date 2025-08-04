//------------------------------------------------------------------------------

/**
 * Añade un manejador de eventos y lo registra en el Set para su posterior limpieza
 * @param {Set<[HTMLElement, string, Function]>} manejadores Set donde registrar el manejador
 * @param {HTMLElement} elemento Elemento DOM al que añadir el evento
 * @param {string} evento Nombre del evento (click, change, etc.)
 * @param {Function} manejador Función manejadora del evento
 */
export function ayadirManejador(manejadores, elemento, evento, manejador) {
  if (!manejadores || !elemento || !evento || !manejador) return;

  elemento.addEventListener(evento, manejador);
  manejadores.add([elemento, evento, manejador]);
}

//------------------------------------------------------------------------------

/**
 * Limpia los manejadores de eventos registrados
 * @param {Set<[HTMLElement, string, Function]>} manejadores Set de arrays con [elemento, evento, función]
 */
export function limpiarManejadores(manejadores) {
  if (!manejadores) return;
  manejadores.forEach(([elemento, evento, manejador]) => {
    elemento?.removeEventListener(evento, manejador); });
  manejadores.clear();
}

export function limpiarComponentes(componentes) {
  if (!componentes) return;
  componentes.forEach(limpiar => limpiar());
  componentes.clear();
}

//------------------------------------------------------------------------------

/**
 * Reemplaza en la ruta definida cada segmento ":param" por "([^/]+)"
 * y construye un array con los nombres de los parámetros en orden.
 *
 * @param {string} rutaDefinida - Ejemplo: "/users/:id/posts/:postId"
 * @returns {{ regexp: RegExp, keys: string[] }}
 */
export function compilarRuta(rutaDefinida) {
  const keys = [];
  // Escapamos caracteres especiales de regex, excepto ":" y "/"
  let pattern = rutaDefinida.replace(/([.+?^=!:${}()|[\]/\\])/g, '\\$1');

  // Ahora buscamos los ":param" y los transformamos en "([^/]+)"
  pattern = pattern.replace(/\\:([A-Za-z0-9_]+)/g, (_, nombre) => {
    keys.push(nombre);
    return '([^/]+)';
  });

  // Queremos que coincida toda la cadena: inicio ^ y fin $
  const regexp = new RegExp(`^${pattern}$`);
  return { regexp, keys };
}

//------------------------------------------------------------------------------

/**
 * Recorre cada ruta “definida” y trata de hacer corresponder la ruta real.
 * Si encuentra coincidencia, devuelve [rutaDefinida, paramsExtraídos].
 * Si no hay match, devuelve [ruta, null].
 *
 * @param {string} ruta - La ruta real, p. ej. "/users/42/posts/99"
 * @param {string[]} rutasDefinidas - Array de patrones, p. ej. ["/users/:id", "/users/:id/posts/:postId", ...]
 * @returns {[string, Object<string,string>]|[string, null]}
 */
export function extraerParametrosRuta(ruta, rutasDefinidas) {
  for (const rutaDefinida of rutasDefinidas) {
    // 1. Compilamos rutaDefinida en un RegExp y recogemos los nombres de los params
    const { regexp, keys } = compilarRuta(rutaDefinida);

    // 2. Probamos coincidencia
    const resultado = regexp.exec(ruta);
    if (!resultado) continue;

    // 3. Si matchea, extraemos valores en orden y los asignamos a sus nombres
    const params = {};
    keys.forEach((nombre, i) => {
      // resultado[0] es la cadena completa; los grupos comienzan en índice 1
      params[nombre] = resultado[i + 1];
    });

    return [rutaDefinida, params];
  }

  // Si ninguna coincidencia, devolvemos la ruta “tal cual” y null
  return [ruta, null];
}

//------------------------------------------------------------------------------
/**
 * Une múltiples partes de una URL, eliminando barras iniciales y finales innecesarias.
 * @param {...string} partes - Partes de la URL a unir
 * @returns {string} URL unida
 */
export function unirUrl(...partes) {
  return partes
    .map(parte => parte.replace(/(^\/+|\/+$)/g, '')) // Elimina barras iniciales y finales
    .join('/');
}
//------------------------------------------------------------------------------
