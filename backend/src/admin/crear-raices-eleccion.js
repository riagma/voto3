#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'readline';

import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { eleccionDAO, pruebaZKDAO, raizZKDAO, registroVotanteEleccionDAO } from '../modelo/DAOs.js';
import { comprimirArchivo, calcularDatosArbol, construirArbolMerkle } from '../utiles/utilesArbol.js';
import { CIRCUIT_DIR, MERKLE11_JSON } from '../utiles/constantes.js';
import { subirArchivoRemoto, verificarEstado } from '../utiles/clienteIpfs.js';

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id>`);
  process.exit(1);
}

try {
  // Verificar que el backend IPFS está activo
  console.log('Verificando estado del servicio IPFS...');
  const activo = await verificarEstado();

  if (!activo) {
    console.error('El servicio IPFS no está activo en el backend. Inicia el servidor primero.');
    process.exit(1);
  }

  const bd = abrirConexionBD();

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });

  if (!eleccion) {
    console.error(`No se encontró la elección con ID ${eleccionId}`);
    process.exit(1);
  }

  const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: eleccionId });

  if (pruebaZK) {
    const reemplazarla = await preguntarUsuario(
      `La prueba ZK de la elección con ID ${eleccionId} ya ha sido creadas.\n` +
      '¿Deseas reemplazarla? (s/n): '
    );

    if (reemplazarla) {
      console.log(`Reemplazando la prueba ZK de la elección con ID ${eleccionId}`);
      raizZKDAO.eliminarPorPruebaId(bd, eleccionId);
      pruebaZKDAO.eliminar(bd, { pruebaId: eleccionId });
    } else {
      console.log('Operación cancelada.');
      process.exit(0);
    }
  }

  const numHojas = registroVotanteEleccionDAO.obtenerSiguienteIdx(bd, eleccionId);
  console.log(`Número de hojas para la elección con ID ${eleccionId}: ${numHojas}`);

  const datosArbol = calcularDatosArbol(numHojas);
  console.log(`Datos del árbol: Bloques=${datosArbol.numBloques}, Bloque=${datosArbol.tamBloque}, Resto=${datosArbol.tamResto}`);

  // const indiceArbol = calcularBloqueIndice(datosArbol.tamBloque, datosArbol.tamResto, indice);
  // console.log(`Índice del árbol: Bloque=${indiceArbol.bloque}, Índice en bloque=${indiceArbol.bloqueIdx}`);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));

  const relPruebaZK = path.join(CIRCUIT_DIR, `E-${eleccionId.toString().padStart(3, '0')}`);
  const dirPruebaZK = path.join(__dirname, '../../', relPruebaZK);
  console.log(`Directorio de prueba ZK: ${dirPruebaZK}`);

  if (!fs.existsSync(dirPruebaZK)) {
    fs.mkdirSync(dirPruebaZK, { recursive: true });
  }

  const merkle11JsonOrigen = path.join(__dirname, '../../', MERKLE11_JSON);
  const merkle11JsonDestino = path.join(dirPruebaZK, path.basename(merkle11JsonOrigen));
  fs.copyFileSync(merkle11JsonOrigen, merkle11JsonDestino);

  console.log(`Subiendo ${merkle11JsonDestino} a IPFS...`);
  const cidMerkle11Json = await subirArchivoRemoto(`${merkle11JsonDestino}`);
  console.log(`CID de Merkle11 JSON: ${cidMerkle11Json}`);

  // pruebaId INTEGER PRIMARY KEY,
  // numBloques INTEGER NOT NULL,
  // tamBloque INTEGER NOT NULL,
  // tamResto INTEGER NOT NULL,
  // txIdRaizInicial TEXT NOT NULL,
  // urlCircuito TEXT NOT NULL,
  // ipfsCircuito TEXT NOT NULL,
  // claveVotoPublica TEXT,
  // claveVotoPrivada TEXT,

  const nuevaPruebaZK = {
    pruebaId: eleccionId,
    tamBloque: datosArbol.tamBloque,
    tamResto: datosArbol.tamResto,
    numBloques: datosArbol.numBloques,
    txIdRaizInicial: 'TEMPORAL',
    urlCircuito: path.join(relPruebaZK, path.basename(merkle11JsonDestino)),
    ipfsCircuito: cidMerkle11Json,
  };

  const resultadoPruebaZK = pruebaZKDAO.crear(bd, nuevaPruebaZK);
  console.log(`Prueba ZK creada con ID: ${resultadoPruebaZK.pruebaId}`);

  for (let bloque = 0, compromisoIdx = 0; bloque < datosArbol.numBloques; bloque++) {
    const tamBloque = (bloque < datosArbol.tamResto) ? datosArbol.tamBloque + 1 : datosArbol.tamBloque;

    console.log(`Procesando bloque ${bloque} con tamaño ${tamBloque} índice ${compromisoIdx}`);

    const registros = registroVotanteEleccionDAO.obtenerCompromisosEleccion(bd, {
      eleccionId,
      compromisoIdx,
      max: tamBloque
    });

    compromisoIdx += tamBloque;

    const compromisos = registros.map(r => r.compromiso);
    const nombreFichero = `compromisos-B-${bloque}.json`;
    const archivoCompromisos = path.join(dirPruebaZK, nombreFichero);

    fs.writeFileSync(archivoCompromisos, JSON.stringify(compromisos, null, 2), 'utf8');
    await comprimirArchivo(archivoCompromisos, `${archivoCompromisos}.gz`);

    console.log(`Subiendo ${archivoCompromisos} a IPFS...`);
    const cidCompromisos = await subirArchivoRemoto(`${archivoCompromisos}`);
    console.log(`CID de compromisos: ${cidCompromisos}`);

    const arbolMerkle = construirArbolMerkle(compromisos);

    const nuevaRaizZK = {
      pruebaId: eleccionId,
      bloqueIdx: bloque,
      urlCompromisos: path.join(relPruebaZK, path.basename(nombreFichero)),
      ipfsCompromisos: cidCompromisos, // CID real de IPFS
      raiz: arbolMerkle.raiz.toString(),
      txIdRaiz: 'TEMPORAL',
    };

    const resultadoRaizZK = raizZKDAO.crear(bd, nuevaRaizZK);
    console.log(`Raíz ZK creada para el bloque ${bloque} con CID: ${cidCompromisos}`);
  }

} catch (err) {
  console.error('Error creando raíces de elección:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

//-------------

async function preguntarUsuario(pregunta) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolver => {
    rl.question(pregunta, (respuesta) => {
      rl.close();
      resolver(respuesta.toLowerCase().startsWith('s'));
    });
  });
}


