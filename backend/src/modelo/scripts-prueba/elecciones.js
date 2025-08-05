import { encriptar, generarParClavesRSA } from '../../utiles/utilesCrypto.js';
import { CLAVE_MAESTRA } from '../../utiles/constantes.js'; 
import { formatearFechaHora, calcularFechaHora } from '../../utiles/utilesFechas.js';

const ahora = new Date();
const fechaHora = formatearFechaHora(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0));

export async function cargarElecciones(bd) {
  console.log('\nIniciando carga de elecciones...');

  try {
    bd.prepare('DELETE FROM Eleccion').run();
    
    const { clavePublica, clavePrivada } = await generarParClavesRSA();
    
    const elecciones = [
      {
        nombre: "Elecciones Municipales 2025",
        descripcion: "Elecciones a los Ayuntamientos",
        fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: -62 }),
        fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: -42 }),
        fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: -41 }),
        fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: -31 }),
        fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: -30 }),
        claveVotoPublica: clavePublica,
        claveVotoPrivadaEncriptada: await encriptar(clavePrivada, CLAVE_MAESTRA),
        claveVotoPrivada: null,
      },
      {
        nombre: "Elecciones Autonómicas 2025",
        descripcion: "Elecciones al Parlamento Autonómico",
        fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: -22 }),
        fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: -2 }),
        fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: -1 }),
        fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: 9 }),
        fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: 10 }),
        claveVotoPublica: clavePublica,
        claveVotoPrivadaEncriptada: await encriptar(clavePrivada, CLAVE_MAESTRA),
        claveVotoPrivada: null,
      },
      {
        nombre: "Elecciones Generales 2025",
        descripcion: "Elecciones al Congreso y Senado",
        fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: -1 }),
        fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: 21 }),
        fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: 22 }),
        fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: 32 }),
        fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: 33 }),
        claveVotoPublica: clavePublica,
        claveVotoPrivadaEncriptada: await encriptar(clavePrivada, CLAVE_MAESTRA),
        claveVotoPrivada: null,
      },
      {
        nombre: "Referendum Constitucional 2025",
        descripcion: "Consulta sobre la reforma constitucional",
        fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: 30 }),
        fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: 50 }),
        fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: 51 }),
        fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: 61 }),
        fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: 62 }),
        claveVotoPublica: clavePublica,
        claveVotoPrivadaEncriptada: await encriptar(clavePrivada, CLAVE_MAESTRA),
        claveVotoPrivada: null,
      },
    ];

    // Preparar statement para mejor rendimiento
    const stmt = bd.prepare(`
      INSERT INTO Eleccion (
        nombre, descripcion,
        fechaInicioRegistro, fechaFinRegistro,
        fechaInicioVotacion, fechaFinVotacion, fechaEscrutinio, 
        claveVotoPublica, claveVotoPrivadaEncriptada, claveVotoPrivada
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    bd.exec('BEGIN');

    for (const eleccion of elecciones) {
      stmt.run(
        eleccion.nombre,
        eleccion.descripcion,
        eleccion.fechaInicioRegistro,
        eleccion.fechaFinRegistro,
        eleccion.fechaInicioVotacion,
        eleccion.fechaFinVotacion,
        eleccion.fechaEscrutinio,
        eleccion.claveVotoPublica, 
        eleccion.claveVotoPrivadaEncriptada, 
        null
      );
      console.log(`Creada elección: ${eleccion.nombre}`);
    }

    bd.exec('COMMIT');

    const total = bd.prepare('SELECT COUNT(*) as count FROM Eleccion').get();
    console.log(`\nTotal elecciones cargadas: ${total.count}`);

    // const porEstado = bd.prepare(`
    //   SELECT estado, COUNT(*) as count 
    //   FROM Eleccion 
    //   GROUP BY estado
    // `).all();
    
    // console.log('\nDistribución por estado:');
    // porEstado.forEach(({estado, count}) => {
    //   console.log(`- ${estado}: ${count}`);
    // });

  } catch (error) {
    if (bd.inTransaction) {
      bd.exec('ROLLBACK');
    }
    console.error('\nError al cargar elecciones:', error);
    throw error;
  }
}