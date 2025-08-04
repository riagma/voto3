import { daos, eleccionDAO } from '../modelo/DAOs.js';

export const serviciosElecciones = {

  obtenerTodas(bd) {
    const campos = [
      'id', 
      'nombre',
      'descripcion',
      'fechaInicioRegistro',
      'fechaFinRegistro',
      'fechaInicioVotacion', 
      'fechaFinVotacion',
      'fechaEscrutinio',
    ];
    return eleccionDAO.obtenerTodos(bd, campos);
  },

  obtenerPorId(bd, id) {
    const eleccion = daos.eleccion.obtenerPorId(bd, { id });
    if (!eleccion) return null;

    const partidos = daos.partidoEleccion.obtenerPartidosEleccion(bd, id);

    return {
      ...eleccion,
      partidos
    };
  },

  obtenerContratoEleccion(bd, id) {
    const eleccion = daos.contratoBlockchain.obtenerPorId(bd, { id });
    if (!eleccion) return null;

    const partidos = daos.partidoEleccion.obtenerPartidosEleccion(bd, id);

    return {
      ...eleccion,
      partidos
    };
  },

  obtenerDetalle(bd, id, dni) {
    const eleccion = daos.eleccion.obtenerPorId(bd, id);
    if (!eleccion) throw new Error('Elección no encontrada');

    const partidos = daos.partidoEleccion.obtenerPartidosEleccion(bd, id);
    const registroVotante = daos.registroVotanteEleccion.obtenerPorId(bd, dni, id);
    const resultadosEleccion = daos.resultadoEleccion.obtenerPorEleccionId(bd, id);
    const resultadosPorPartido = daos.resultadoPartido.obtenerPorEleccion(bd, id);

    const resultadosCompletos = resultadosEleccion ? {
      ...resultadosEleccion,
      porPartido: resultadosPorPartido || []
    } : null;

    return {
      eleccion,
      partidos,
      resultados: resultadosCompletos || null,
      registro: registroVotante || null,
    };
  },

  crear(bd, datosEleccion) {
    const fechas = validarFechasEleccion(datosEleccion);

    const eleccionACrear = {
      ...datosEleccion,
      ...fechas,
      estado: 'PENDIENTE'
    };

    return daos.eleccion.crear(bd, eleccionACrear);
  },

  actualizar(bd, id, datosEleccion) {
    const eleccionExistente = daos.eleccion.obtenerPorId(bd, id);
    if (!eleccionExistente) {
      throw new Error('Elección no encontrada');
    }

    if (algunaFechaCambia(datosEleccion, eleccionExistente)) {
      validarFechasEleccion(datosEleccion);
    }

    return daos.eleccion.actualizar(bd, id, datosEleccion);
  },

  eliminar(bd, id) {
    const eleccionExistente = daos.eleccion.obtenerPorId(bd, id);
    if (!eleccionExistente) {
      throw new Error('Elección no encontrada');
    }

    if (eleccionExistente.estado !== 'PENDIENTE') {
      throw new Error('Solo se pueden eliminar elecciones pendientes');
    }

    return daos.eleccion.eliminar(bd, id);
  },
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

// Funciones auxiliares
function validarFechasEleccion(datosEleccion) {
  const {
    fechaInicioRegistro,
    fechaFinRegistro,
    fechaInicioVotacion,
    fechaFinVotacion,
    fechaEscrutinio
  } = datosEleccion;

  const fechas = {
    fechaInicioRegistro: new Date(fechaInicioRegistro),
    fechaFinRegistro: new Date(fechaFinRegistro),
    fechaInicioVotacion: new Date(fechaInicioVotacion),
    fechaFinVotacion: new Date(fechaFinVotacion),
    fechaEscrutinio: new Date(fechaEscrutinio)
  };

  if (fechas.fechaInicioRegistro >= fechas.fechaFinRegistro) {
    throw new Error('La fecha de inicio de registro debe ser anterior a la de fin');
  }
  if (fechas.fechaFinRegistro >= fechas.fechaInicioVotacion) {
    throw new Error('La fecha de fin de registro debe ser anterior al inicio de votación');
  }
  if (fechas.fechaInicioVotacion >= fechas.fechaFinVotacion) {
    throw new Error('La fecha de inicio de votación debe ser anterior a la de fin');
  }
  if (fechas.fechaFinVotacion >= fechas.fechaEscrutinio) {
    throw new Error('La fecha de fin de votación debe ser anterior a la celebración');
  }

  return fechas;
}

function algunaFechaCambia(nuevos, existentes) {
  const camposFecha = [
    'fechaInicioRegistro',
    'fechaFinRegistro',
    'fechaInicioVotacion',
    'fechaFinVotacion',
    'fechaEscrutinio'
  ];

  return camposFecha.some(campo =>
    nuevos[campo] && nuevos[campo] !== existentes[campo]
  );
}