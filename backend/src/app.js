import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PUERTO } from './utiles/constantes.js';
import { rutasApi } from './rutas/rutasApi.js';
import { iniciarIpfs, detenerIpfs } from './utiles/servicioIpfs.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rutaFrontend = path.join(__dirname, '../public');
const rutaDescargas = path.join(__dirname, '../circuits');

let servidor;

export async function iniciarServidor() {
  const app = express();

  // Middlewares globales
  app.use(cors());

  app.use('/api', express.json({ limit: '10mb' }));
  app.use('/api', rutasApi);

  app.use(express.static(rutaFrontend));

  app.use('/circuits', express.static(rutaDescargas));

  // Ruta catch-all para SPA (debe ir después de las rutas de la API y de los estáticos)
  app.get('*', (peticion, respuesta) => {
    if (peticion.path.startsWith('/circuits')) {
      return respuesta.status(404).send('Archivo no encontrado');
    }
    // Para cualquier otra petición GET que no sea de la API ni un archivo estático,
    // sirve el index.html principal. Esto permite que el enrutamiento del lado
    // del cliente (React, Vue, Angular) se encargue de la ruta.
    respuesta.sendFile(path.join(rutaFrontend, 'index.html'));
  });

  // Iniciar IPFS primero
  await iniciarIpfs();
  console.log('IPFS iniciado correctamente');

  // Iniciar servidor
  return new Promise((resolve) => {
    servidor = app.listen(PUERTO, () => {
      console.log(`Servidor iniciado en http://localhost:${PUERTO}`);
      resolve(app);
    });
  });
}

export async function cerrarServidor() {
  console.log('\nCerrando servidor...');

  if (servidor) {
    servidor.close(() => {
      console.log('Servidor HTTP cerrado');
    });
  }

  await detenerIpfs();
  process.exit(0);
}
