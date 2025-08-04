export function cargarPartidos(bd) {
  console.log('\nIniciando carga de partidos políticos...');

  try {
    bd.prepare('DELETE FROM PartidoEleccion').run;
    bd.prepare('DELETE FROM Partido').run;
    
    const partidos = [
      {
        nombre: 'Partido Progreso Democrático',
        siglas: 'PPD',
        descripcion: 'Partido centrado en el desarrollo sostenible y la innovación social'
      },
      {
        nombre: 'Unión Liberal Reformista',
        siglas: 'ULR',
        descripcion: 'Partido enfocado en reformas económicas y libertades individuales'
      },
      {
        nombre: 'Alianza Verde Ciudadana',
        siglas: 'AVC',
        descripcion: 'Partido comprometido con la protección del medio ambiente'
      },
      {
        nombre: 'Movimiento Solidario Nacional',
        siglas: 'MSN',
        descripcion: 'Partido centrado en políticas sociales y bienestar comunitario'
      }
    ];

    const stmtPartido = bd.prepare(
      'INSERT INTO Partido (siglas, nombre, descripcion) VALUES (?, ?, ?)'
    );

    bd.exec('BEGIN');

    for (const partido of partidos) {
      stmtPartido.run(partido.siglas, partido.nombre, partido.descripcion);
      console.log(`Creado partido: ${partido.siglas}`);
    }

    const elecciones = bd.prepare('SELECT id FROM Eleccion').all();
    console.log(`\nAsignando partidos a ${elecciones.length} elecciones...`);

    // Asignar partidos a elecciones
    const stmtAsignacion = bd.prepare(
      'INSERT INTO PartidoEleccion (partidoId, eleccionId) VALUES (?, ?)'
    );

    for (const eleccion of elecciones) {
      for (const partido of partidos) {
        stmtAsignacion.run(partido.siglas, eleccion.id);
      }
    }

    bd.exec('COMMIT');

    // Mostrar resumen
    const stats = bd.prepare('SELECT COUNT(*) as count FROM PartidoEleccion').get();
    console.log(`\nResumen:`);
    console.log(`- Partidos creados: ${partidos.length}`);
    console.log(`- Asignaciones a elecciones: ${stats.count}`);

    // Mostrar detalle de partidos
    const partidosDetalle = bd.prepare(`
      SELECT p.siglas, p.nombre, COUNT(pe.eleccionId) as numElecciones
      FROM Partido p
      LEFT JOIN PartidoEleccion pe ON p.siglas = pe.partidoId
      GROUP BY p.siglas
      ORDER BY p.siglas
    `).all();

    console.log('\nDetalle de partidos:');
    partidosDetalle.forEach(p => {
      console.log(`- ${p.siglas}: presente en ${p.numElecciones} elecciones`);
    });

  } catch (error) {
    bd.exec('ROLLBACK');
    console.error('\nError al cargar partidos:', error);
    throw error;
  }
}