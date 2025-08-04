export class BaseDAO {
  constructor(nombreTabla) {
    this.nombreTabla = nombreTabla;
  }

  crearWhere(id) {
    if (typeof id === 'object' && id !== null) {
      const campos = Object.keys(id);
      if (campos.length === 0) {
        throw new Error('El objeto id debe tener al menos una clave');
      }
      const condiciones = campos.map(campo => `${campo} = ?`).join(' AND ');
      const valores = Object.values(id);
      return { condiciones, valores };
    } else {
      throw new Error('El parámetro id debe ser un objeto con los campos clave');
    }
  }

  obtenerTodos(bd, campos = null) {
    const seleccion = Array.isArray(campos) && campos.length > 0
      ? campos.map(c => `"${c}"`).join(', ')
      : '*';
    return bd.prepare(`SELECT ${seleccion} FROM ${this.nombreTabla}`).all();
  }

  obtenerPorId(bd, id, campos = null) {
    const seleccion = Array.isArray(campos) && campos.length > 0
      ? campos.map(c => `"${c}"`).join(', ')
      : '*';
    const { condiciones, valores } = this.crearWhere(id);
    return bd.prepare(`SELECT ${seleccion} FROM ${this.nombreTabla} WHERE ${condiciones}`).get(valores);
  }

  crear(bd, datos) {
    const campos = Object.keys(datos);
    const valores = Object.values(datos);
    const marcadores = campos.map(() => '?').join(',');
    const resultado = bd.prepare(`INSERT INTO ${this.nombreTabla} (${campos.join(',')}) VALUES (${marcadores})`).run(valores);
    return resultado.lastInsertRowid || resultado.changes;
  }

  actualizar(bd, id, datos) {
    const campos = Object.keys(datos);
    const valores = Object.values(datos);
    const actualizaciones = campos.map(campo => `${campo} = ?`).join(',');
    const { condiciones, valores: valoresId } = this.crearWhere(id);
    const resultado = bd.prepare(`UPDATE ${this.nombreTabla} SET ${actualizaciones} WHERE ${condiciones}`).run(...valores, ...valoresId);
    return resultado.changes;
  }

  eliminar(bd, id) {
    const { condiciones, valores } = this.crearWhere(id);
    const resultado = bd.prepare(`DELETE FROM ${this.nombreTabla} WHERE ${condiciones}`).run(valores);
    return resultado.changes;
  }
}