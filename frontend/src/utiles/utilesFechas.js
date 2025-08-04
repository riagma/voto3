// Date a "YYYY-MM-DD" (local)
export function formatearFecha(date = null) {
  let d = date ? new Date(date) : new Date();
  const YY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  return `${YY}-${MM}-${DD}`;
}

export function formatearFechaWeb(date = null) {
  let d = date ? new Date(date) : new Date();
  const YY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  return `${DD}-${MM}-${YY}`;
}

// Date a "YYYY-MM-DD HH:MM:SS" (local)
export function formatearFechaHora(date = null) {
  let d = date ? new Date(date) : new Date();
  const YY = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const DD = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MI = String(d.getMinutes()).padStart(2, '0');
  const SS = String(d.getSeconds()).padStart(2, '0');
  return `${YY}-${MM}-${DD} ${HH}:${MI}:${SS}`;
}

// "YYYY-MM-DD" a Date (local)
export function parsearFecha(fecha) {
  const [YY, MM, DD] = fecha.split('-').map(Number);
  return new Date(YY, MM - 1, DD, 12, 0, 0);
}

// "YYYY-MM-DD HH:MM:SS" a Date (local)
export function parsearFechaHora(fechaHora) {
  const [fecha, hora] = fechaHora.split(' ');
  const [YY, MM, DD] = fecha.split('-').map(Number);
  const [HH, MI, SS] = hora.split(':').map(Number);
  return new Date(YY, MM - 1, DD, HH, MI, SS);
}

// "YYYY-MM-DD" a "YYYY-MM-DD" (local)
export function calcularFecha({ fechaHora = null, incYY = 0, incMM = 0, incDD = 0 }) {
  let d = fechaHora ? parsearFecha(fechaHora) : new Date();
  d.setFullYear(d.getFullYear() + incYY);
  d.setMonth(d.getMonth() + incMM);
  d.setDate(d.getDate() + incDD);
  d.setHours(12);
  d.setMinutes(0);
  d.setSeconds(0);
  return formatearFecha(d);
}

// "YYYY-MM-DD HH:MM:SS" a "YYYY-MM-DD HH:MM:SS" (local)
export function calcularFechaHora({ fechaHora = null, incYY = 0, incMM = 0, incDD = 0, incHH = 0, incMI = 0, incSS = 0 }) {
  let d = fechaHora ? parsearFechaHora(fechaHora) : new Date();
  d.setFullYear(d.getFullYear() + incYY);
  d.setMonth(d.getMonth() + incMM);
  d.setDate(d.getDate() + incDD);
  d.setHours(d.getHours() + incHH);
  d.setMinutes(d.getMinutes() + incMI);
  d.setSeconds(d.getSeconds() + incSS);
  return formatearFechaHora(d);
}
