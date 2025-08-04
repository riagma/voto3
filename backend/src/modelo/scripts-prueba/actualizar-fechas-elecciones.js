#!/usr/bin/env node
import { abrirConexionBD, cerrarConexionBD } from '../BD.js';
import { eleccionDAO } from '../DAOs.js';
import { preguntarUsuario } from '../../utiles/utilesScripts.js';
import { formatearFechaHora, calcularFechaHora } from '../../utiles/utilesFechas.js';

//--------------

const ahora = new Date();
const fechaHora = formatearFechaHora(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0));

//----------------------------------------------------------------------------

try {

  const bd = abrirConexionBD();

  let modificarElecciones = await preguntarUsuario(
    'Si van a modificar las fechas de la elecciones, ¿está seguro? (s/n): '
  );

  if (modificarElecciones) {

    eleccionDAO.actualizar(bd, { id: 1 }, {
      fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: -62 }),
      fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: -42 }),
      fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: -41 }),
      fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: -31 }),
      fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: -30 }),
    });

    eleccionDAO.actualizar(bd, { id: 2 }, {
      fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: -22 }),
      fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: -2 }),
      fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: -1 }),
      fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: 9 }),
      fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: 10 }),
    });

    eleccionDAO.actualizar(bd, { id: 3 }, {
      fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: -1 }),
      fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: 21 }),
      fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: 22 }),
      fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: 32 }),
      fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: 33 }),
    });

    eleccionDAO.actualizar(bd, { id: 4 }, {
      fechaInicioRegistro: calcularFechaHora({ fechaHora, incDD: 30 }),
      fechaFinRegistro: calcularFechaHora({ fechaHora, incDD: 50 }),
      fechaInicioVotacion: calcularFechaHora({ fechaHora, incDD: 51 }),
      fechaFinVotacion: calcularFechaHora({ fechaHora, incDD: 61 }),
      fechaEscrutinio: calcularFechaHora({ fechaHora, incDD: 62 }),
    });

    console.log('Fechas de elecciones actualizadas correctamente.');

    for (let id = 1; id <= 4; id++) {
      const fechasEleccion = eleccionDAO.obtenerPorId(bd, { id }, [
        'nombre',
        'fechaInicioRegistro',
        'fechaFinRegistro',
        'fechaInicioVotacion',
        'fechaFinVotacion',
        'fechaEscrutinio'
      ]);
      console.log(fechasEleccion);
    }


  } else {
    console.log('Operación cancelada.');
    process.exit(0);
  }

} catch (err) {
  console.error('Error en el test de votaciones:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}



