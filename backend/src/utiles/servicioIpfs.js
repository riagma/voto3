import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHelia } from 'helia';
import { unixfs } from '@helia/unixfs';
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rutaBlockstore = path.join(__dirname, '../../ipfs_data/blocks');
const rutaDatastore = path.join(__dirname, '../../ipfs_data/datastore');

let helia = null;
let fsUnix = null;
let manejadoresRegistrados = false;

function registrarManejadoresSignal() {
  if (manejadoresRegistrados) return;

  // Manejar excepciones no capturadas
  process.on('uncaughtException', async (error) => {
    console.error('Excepción no capturada:', error);
    await detenerIpfs();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Promesa rechazada no manejada:', reason);
    await detenerIpfs();
    process.exit(1);
  });

  manejadoresRegistrados = true;
  console.log('Manejadores de señal registrados para IPFS');
}

export async function iniciarIpfs() {
  if (!helia) {
    console.log('Iniciando nodo Helia IPFS...');

    // Registrar manejadores antes de crear Helia
    registrarManejadoresSignal();

    const blockstore = new LevelBlockstore(rutaBlockstore)
    const datastore = new LevelDatastore(rutaDatastore)

    let puertoPorDefecto = 4001

    try {
      helia = await createHelia({
        blockstore,
        datastore,
        libp2p: { addresses: { listen: [`/ip4/0.0.0.0/tcp/${puertoPorDefecto}`] } }
      })
    } catch (err) {
      console.warn(`Puerto ${puertoPorDefecto} ocupado, usando aleatorio`)
      helia = await createHelia({
        blockstore,
        datastore,
        libp2p: { addresses: { listen: ['/ip4/0.0.0.0/tcp/0'] } }
      })
    }

    if (!helia) {
      throw new Error('No se pudo iniciar el nodo Helia');
    }

    fsUnix = unixfs(helia);

    console.log('Nodo Helia iniciado correctamente');
    helia.libp2p.getMultiaddrs().forEach(a => {
      console.log(a.toString())
    })
  }
  return { helia, fsUnix };
}

export async function detenerIpfs() {
  if (helia) {
    console.log('Deteniendo nodo Helia...');
    try {
      await helia.stop();
      console.log('Nodo Helia detenido correctamente');
    } catch (error) {
      console.error('Error al detener Helia:', error);
    } finally {
      helia = null;
      fsUnix = null;
    }
  }
}

export async function subirArchivo(rutaArchivo) {
  await iniciarIpfs();

  const contenido = fs.readFileSync(rutaArchivo);
  const cid = await fsUnix.addBytes(contenido);

  console.log(`Archivo subido: ${rutaArchivo} -> CID: ${cid}`);
  return cid.toString();
}

export async function descargarArchivo(cid) {
  await iniciarIpfs();

  const bytes = [];
  for await (const chunk of fsUnix.cat(cid)) {
    bytes.push(chunk);
  }

  // Manera más eficiente de concatenar arrays
  const totalLength = bytes.reduce((acc, chunk) => acc + chunk.length, 0);
  const contenido = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of bytes) {
    contenido.set(chunk, offset);
    offset += chunk.length;
  }

  console.log(`Archivo descargado: CID ${cid} (${contenido.length} bytes)`);
  return contenido;
}

export function estaActivo() {
  return helia !== null;
}