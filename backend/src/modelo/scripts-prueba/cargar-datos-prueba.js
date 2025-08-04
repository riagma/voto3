import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

import { RUTA_BD } from '../../utiles/constantes.js';
import { cargarVotantes } from './votantes.js';
import { cargarElecciones } from './elecciones.js';
import { cargarPartidos } from './partidos.js';

async function cargarDatosPrueba() {
  const args = process.argv.slice(2);
  const cantidad = args[0] ? parseInt(args[0], 10) : 100;

  if (isNaN(cantidad) || cantidad <= 0) {
    console.error(`Cantidad inválida: ${args[0]}`);
    process.exit(1);
  }

  console.log('Iniciando carga de datos de prueba...');
  console.log(RUTA_BD);
  const bd = new Database(RUTA_BD, { fileMustExist: true });

  try {
    const hashContrasena = await bcrypt.hash('Password123!', 10);

    // Cargar datos en orden por dependencias
    cargarVotantes(bd, hashContrasena, cantidad);
    await cargarElecciones(bd);
    cargarPartidos(bd);

    // Actualizar resumen final para incluir partidos
    const stats = bd.prepare(`
      SELECT 'Votantes' as tabla, COUNT(*) as total FROM Votante
      UNION ALL
      SELECT 'Elecciones', COUNT(*) FROM Eleccion
      UNION ALL
      SELECT 'Partidos', COUNT(*) FROM Partido
      UNION ALL
      SELECT 'Asignaciones', COUNT(*) FROM PartidoEleccion
    `).get();

    console.log('Datos de prueba cargados exitosamente.', stats);
  } catch (error) {
    console.error('Error al cargar datos de prueba:', error);
    process.exit(1);
  } finally {
    bd.close();
  }
}

cargarDatosPrueba();