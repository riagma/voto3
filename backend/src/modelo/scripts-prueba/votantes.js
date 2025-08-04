import { faker } from '@faker-js/faker/locale/es';

// Función para normalizar texto (quitar tildes y caracteres especiales)
function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_');
}

export function cargarVotantes(bd, hashContrasena, cantidad = 100) {
  console.log(`Iniciando carga de ${cantidad} votantes...`);

  try {

    const stmt = bd.prepare(`
      INSERT INTO Votante (dni, nombre, primerApellido, segundoApellido, correoElectronico, hashContrasena)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    bd.prepare('DELETE FROM Votante').run();

    bd.exec('BEGIN');

    for (let i = 0; i < cantidad; i++) {
      const nombre = faker.person.firstName();
      const apellidos = faker.person.lastName().split(' ');
      const primerApellido = apellidos[0];
      const segundoApellido = apellidos[1] || faker.person.lastName();

      // const nombreEmail = normalizarTexto(nombre);
      // const apellidosEmail = `${normalizarTexto(primerApellido)}.${normalizarTexto(segundoApellido)}`;
      // const correoElectronico = `${nombreEmail}.${apellidosEmail}@ejemplo.com`;

      // const numeroDNI = faker.number.int({ min: 0, max: 99999999 }).toString().padStart(8, '0');
      const numeroDNI = (90000000 + i).toString(); // Generar un número incremental
      const letrasDNI = 'TRWAGMYFPDXBNJZSQVHLCKE';
      const letraDNI = 'Z'; // letrasDNI[numeroDNI % 23];
      const dni = `${numeroDNI}${letraDNI}`;

      const correoElectronico = `${dni}@ejemplo.com`;

      // Insertar votante
      stmt.run(
        dni,
        nombre,
        primerApellido,
        segundoApellido,
        correoElectronico,
        hashContrasena
      );

      if (i % 100 === 0) {
        bd.exec('COMMIT');
        bd.exec('BEGIN');
        process.stdout.write('.');
      }
    }

    if (bd.inTransaction) {
      bd.exec('COMMIT');
    }

    console.log('\nVotantes creados exitosamente.');

    const ejemplos = bd.prepare('SELECT * FROM Votante LIMIT 5').all();
    console.log('\nEjemplos de votantes creados:');
    ejemplos.forEach(v => {
      console.log(`- ${v.nombre} ${v.primerApellido} (${v.dni}) - ${v.correoElectronico}`);
    });

  } catch (error) {
    if (bd.inTransaction) {
      bd.exec('ROLLBACK');
    }
    console.error('Error al cargar votantes:', error);
    throw error;
  }
}