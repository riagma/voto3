const BASE = '';

async function llamarApi(ruta, opciones = {}) {
  const headers = opciones.headers || {};

  // Si se pasan credenciales, usa Basic Auth
  if (opciones.credenciales) {
    headers['Authorization'] = 
      `Basic ${btoa(opciones.credenciales.dni + ':' + opciones.credenciales.contrasena)}`;
  }

  // Si se pasa token, usa Bearer Auth
  if (opciones.token) {
    headers['Authorization'] = `Bearer ${opciones.token}`;
  }

  if (opciones.body && !(opciones.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    opciones.body = JSON.stringify(opciones.body);
  }

  const res = await fetch(BASE + ruta, {
    method: opciones.method || 'GET',
    headers,
    body: opciones.body || null
  });

  if (!res.ok && res.status === 404) {
    return null; // Si no se encuentra el recurso, retornar null
  
  } else if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || res.statusText);
  }

  return res.json();
}

export const api = {
  get: (ruta, opciones = {}) => llamarApi(ruta, opciones),
  post: (ruta, body, opciones = {}) => llamarApi(ruta, { ...opciones, method: 'POST', body }),
  put: (ruta, body, opciones = {}) => llamarApi(ruta, { ...opciones, method: 'PUT', body }),
  del: (ruta, opciones = {}) => llamarApi(ruta, { ...opciones, method: 'DELETE' })
};
