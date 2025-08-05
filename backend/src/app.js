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


// Ejemplo de cómo lo usarías en tu SPA
// async function cargarFicheroCircuito(nombreFichero) {
//   try {
//     // La URL coincide con la ruta que acabas de configurar en Express
//     const respuesta = await fetch(`/circuitos/${nombreFichero}`);

//     if (!respuesta.ok) {
//       throw new Error(`Error al cargar el fichero: ${respuesta.statusText}`);
//     }

//     // .arrayBuffer() es ideal para datos binarios (como ficheros .gz o .wasm)
//     const datosBinarios = await respuesta.arrayBuffer();

//     console.log(`Fichero '${nombreFichero}' cargado en memoria.`);
//     // Ahora puedes usar 'datosBinarios' para tus cálculos
//     return datosBinarios;

//   } catch (error) {
//     console.error('No se pudo cargar el fichero del circuito:', error);
//   }
// }

// --- Uso ---
// Llama a esta función cuando necesites el fichero
// const miCircuito = await cargarFicheroCircuito('merkle11.json.gz');
