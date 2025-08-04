class Contexto {
  constructor() {
    this._observadores = new Set();
    this._estado = {
      idSesion: null, 
      nombreUsuario: null,
      nombreVotante: null,
      datosUsuario: null,
      datosVotante: null,
    };
  }

  // Getters
  getEstado() {
    return { ...this._estado };
  }
  getIdSesion() {
    return this._estado.idSesion;
  }
  getNombreUsuario() {
    return this._estado.nombreUsuario;
  }
  getNombreVotante() {
    return this._estado.nombreVotante;
  }
  getDatosUsuario() {
    return this._estado.datosUsuario ? { ...this._estado.datosUsuario } : null;
  }
  getDatosVotante() {
    return this._estado.datosVotante ? { ...this._estado.datosVotante } : null;
  }

  estaIdentificado() {
    return !!this._estado.nombreVotante;
  }

  _generarIdSesion() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
    );
  }

  actualizarContexto(nuevoEstado) {
    const estadoAnterior = { ...this._estado };

    if (nuevoEstado.nombreUsuario && this._estado.nombreUsuario !== nuevoEstado.nombreUsuario) {
      nuevoEstado.idSesion = this._generarIdSesion();
    }

    Object.assign(this._estado, nuevoEstado);

    if (JSON.stringify(estadoAnterior) !== JSON.stringify(this._estado)) {
      this._notificarCambios();
    }
  }

  limpiarContexto() {
    this.actualizarContexto({
      idSesion: null, 
      nombreUsuario: null,
      nombreVotante: null,
      datosUsuario: null,
      datosVotante: null,
    });
  }

  // Observadores
  observarContexto(callback) {
    this._observadores.add(callback);
    return () => this._observadores.delete(callback);
  }

  _notificarCambios() {
    const estadoInmutable = this.getEstado();
    this._observadores.forEach(callback => callback(estadoInmutable));
  }
}

// Exporta una única instancia (singleton)
export const contexto = new Contexto();
