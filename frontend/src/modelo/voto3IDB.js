const DB_NAME = 'Voto3';
const DB_VERSION = 3;
const DB_PRESERVE = false; // true = mantener datos, false = borrar y recrear

class Voto3IDB {
  constructor() {
    this.db = null;
  }

  // Inicializar la base de datos
  async inicializar() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        console.log(`Actualizando base de datos de versión ${oldVersion} a ${newVersion}`);
        console.log(`Preservar datos: ${DB_PRESERVE}`);

        if (!DB_PRESERVE) {
          // Borrar todas las tablas existentes
          console.log('Borrando todas las tablas existentes...');
          const storeNames = Array.from(db.objectStoreNames);
          storeNames.forEach(storeName => {
            console.log(`Eliminando tabla: ${storeName}`);
            db.deleteObjectStore(storeName);
          });
        }

        // Crear tabla usuarios con clave primaria simple 'nombreUsuario'
        if (!db.objectStoreNames.contains('usuarios')) {
          console.log('Creando tabla usuarios');
          db.createObjectStore('usuarios', { keyPath: 'nombreUsuario' });
        }

        // Crear tabla registro con clave primaria compuesta [nombreUsuario, eleccionId]
        if (!db.objectStoreNames.contains('registro')) {
          console.log('Creando tabla registro');
          db.createObjectStore('registro', { keyPath: ['nombreUsuario', 'eleccionId'] });
        }
      };
    });
  }

  //------------------------------------------------------------------------------

  async crearUsuario(usuario) {
    const transaction = this.db.transaction(['usuarios'], 'readwrite');
    const store = transaction.objectStore('usuarios');

    return new Promise((resolve, reject) => {
      const request = store.add(usuario);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerUsuario(nombreUsuario) {
    const transaction = this.db.transaction(['usuarios'], 'readonly');
    const store = transaction.objectStore('usuarios');

    return new Promise((resolve, reject) => {
      const request = store.get(nombreUsuario);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async actualizarUsuario(nombreUsuario, usuario) {
    console.log(`Actualizando usuario: ${nombreUsuario}`);
    const usuarioNuevo = { ...usuario, nombreUsuario };
    const usuarioAnterior = await this.obtenerUsuario(nombreUsuario);
    const usuarioActualizado = usuarioAnterior ? { ...usuarioAnterior, ...usuarioNuevo } : usuarioNuevo;
    const transaction = this.db.transaction(['usuarios'], 'readwrite');
    const store = transaction.objectStore('usuarios');
    console.log('Votante actualizado:', usuarioActualizado);
    return new Promise((resolve, reject) => {
      const request = store.put(usuarioActualizado);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async eliminarUsuario(nombreUsuario) {
    const transaction = this.db.transaction(['usuarios'], 'readwrite');
    const store = transaction.objectStore('usuarios');

    return new Promise((resolve, reject) => {
      const request = store.delete(nombreUsuario);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listarUsuarios() {
    const transaction = this.db.transaction(['usuarios'], 'readonly');
    const store = transaction.objectStore('usuarios');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  //------------------------------------------------------------------------------

  async crearRegistro(eleccion) {
    const transaction = this.db.transaction(['registro'], 'readwrite');
    const store = transaction.objectStore('registro');

    return new Promise((resolve, reject) => {
      const request = store.add(eleccion);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerRegistro(nombreUsuario, eleccionId) {
    const transaction = this.db.transaction(['registro'], 'readonly');
    const store = transaction.objectStore('registro');

    return new Promise((resolve, reject) => {
      const request = store.get([nombreUsuario, eleccionId]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async actualizarRegistro(nombreUsuario, eleccionId, eleccion) {
    console.log(`Actualizando eleccion: ${nombreUsuario} - ${eleccionId}`);
    const eleccionNueva = { ...eleccion, nombreUsuario, eleccionId };
    const eleccionAnterior = await this.obtenerRegistro(nombreUsuario, eleccionId);
    const eleccionActualizada = eleccionAnterior ? { ...eleccionAnterior, ...eleccionNueva } : eleccionNueva;
    const transaction = this.db.transaction(['registro'], 'readwrite');
    const store = transaction.objectStore('registro');
    console.log('Elección actualizada:', eleccionActualizada);
    return new Promise((resolve, reject) => {
      const request = store.put(eleccionActualizada);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async eliminarRegistro(nombreUsuario, eleccionId) {
    const transaction = this.db.transaction(['registro'], 'readwrite');
    const store = transaction.objectStore('registro');

    return new Promise((resolve, reject) => {
      const request = store.delete([nombreUsuario, eleccionId]);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async listarRegistros() {
    const transaction = this.db.transaction(['registro'], 'readonly');
    const store = transaction.objectStore('registro');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async obtenerRegistrosPorUsuario(nombreUsuario) {
    const transaction = this.db.transaction(['registro'], 'readonly');
    const store = transaction.objectStore('registro');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const todasElecciones = request.result;
        const eleccionesVotante = todasElecciones.filter(e => e.nombreUsuario === nombreUsuario);
        resolve(eleccionesVotante);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

//------------------------------------------------------------------------------
export const voto3IDB = new Voto3IDB();
//------------------------------------------------------------------------------
