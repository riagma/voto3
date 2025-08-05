import fs from 'node:fs'; // para streams y métodos sync
import fsp from 'node:fs/promises'; // para métodos async/promesa
import zlib from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Noir } from '@noir-lang/noir_js';
import { UltraHonkBackend } from '@aztec/bb.js';
import { ArbolMerkle } from './ArbolMerkle.js'
import { calcularPoseidon2, calcularSha256, bigInt2HexStr } from './utilesCrypto.js';

import { PROOFS_DIR } from './constantes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PROFUNDIDAD = 11;

const MAX_NUM_HOJAS = 2 ** (PROFUNDIDAD);
const MIN_NUM_HOJAS = 2 ** (PROFUNDIDAD - 1) + 1;

const HOJA_POR_DEFECTO = 666n;

let ficheroMerkle11Cargado = '';
let ficheroCompromisosCargado = '';

let noirGlobal = null;
let honkGlobal = null;

let compromisosCargados = null;

//----------------------------------------------------------------------------

export async function cargarFicheroMerkle11(ficheroMerkle11) {
  if (ficheroMerkle11Cargado !== ficheroMerkle11) {
    const merkle11Texto = await fsp.readFile(path.join(__dirname, "../../", ficheroMerkle11), 'utf8');
    const merkle11Json = JSON.parse(merkle11Texto);
    noirGlobal = new Noir(merkle11Json);
    honkGlobal = new UltraHonkBackend(merkle11Json.bytecode, { threads: 8 });
    ficheroMerkle11Cargado = ficheroMerkle11;
    console.log(`Fichero Merkle11 cargado: ${ficheroMerkle11}`);
  } else {
    console.log(`Fichero Merkle11 ya cargado: ${ficheroMerkle11}`);
  }
  return { noir: noirGlobal, honk: honkGlobal };
}

//----------------------------------------------------------------------------

export async function cargarFicheroCompromisos(ficheroCompromisos) {
  if (ficheroCompromisosCargado !== ficheroCompromisos) {
    const rutaFichero = path.join(__dirname, "../../", ficheroCompromisos);
    if (esArchivoGzip(rutaFichero)) {
      const compromisosTexto = await descomprimirArchivoMemo(rutaFichero);
      compromisosCargados = JSON.parse(compromisosTexto);

    } else {
      const compromisosTexto = await fsp.readFile(rutaFichero);
      compromisosCargados = JSON.parse(compromisosTexto);
    }
    ficheroCompromisosCargado = ficheroCompromisos;
    console.log(`Fichero de compromisos cargado: ${ficheroCompromisos}`);
  } else {
    console.log(`Fichero de compromisos ya cargado: ${ficheroCompromisos}`);
  }
  return compromisosCargados;
}

//----------------------------------------------------------------------------

export async function calcularPruebaDatosPublicos({
  clave,
  anulador,
  bloqueIdx,
  ficheroMerkle11,
  ficheroCompromisos }) {

  console.log('Clave:', clave, bigInt2HexStr(BigInt(clave)));
  console.log('Anulador:', anulador, bigInt2HexStr(BigInt(anulador)));
  console.log('BloqueIdx:', bloqueIdx);
  console.log('Merkle11:', ficheroMerkle11);
  console.log('Compromisos:', ficheroCompromisos);

  const { noir, honk } = await cargarFicheroMerkle11(ficheroMerkle11);
  const compromisos = await cargarFicheroCompromisos(ficheroCompromisos);

  const arbolMerkle = construirArbolMerkle(compromisos);

  const { path, idxs } = arbolMerkle.generarPrueba(bloqueIdx);
  const anulador_hash = calcularPoseidon2([BigInt(anulador)]).toString();

  const inputs = {
    clave, anulador,
    path: path.map(x => x.toString()),
    idxs: idxs.map(x => x.toString()),
    raiz: arbolMerkle.raiz.toString(),
    anulador_hash,
  };

  console.log('Inputs:', inputs);

  const { witness } = await noir.execute(inputs);
  const { proof, publicInputs } = await honk.generateProof(witness);

  // guardarProofEnFichero(proof, `proof_${anulador_hash}.bin`);

  const proofHash = calcularSha256(proof);
  const datosPublicos = publicInputs.map(pi => BigInt(pi).toString());
  console.log('Datos públicos:', datosPublicos);
  console.log('Proof Hash:', proofHash);

  return { proof, proofHash, publicInputs };
}

//----------------------------------------------------------------------------

export function calcularDatosArbol(totalHojas) {

  const numBloques = Math.ceil(totalHojas / MAX_NUM_HOJAS);
  const tamBloque = Math.floor(totalHojas / numBloques);
  const tamResto = totalHojas % numBloques;

  return { numBloques, tamBloque, tamResto };
}

//----------------------------------------------------------------------------

export function calcularBloqueIndice(tamBloque, tamResto, indice) {

  let bloque;
  let bloqueIdx;

  if (tamResto === 0) {

    bloque = Math.floor(indice / tamBloque);
    bloqueIdx = indice - (bloque * tamBloque);

  } else {

    const limiteResto = (tamBloque + 1) * tamResto;
    // console.log(`Limite resto: ${limiteResto}`);

    if (indice < limiteResto) {
      bloque = Math.floor(indice / (tamBloque + 1));
      bloqueIdx = indice - (bloque * (tamBloque + 1));

    } else {
      bloque = Math.floor((indice - limiteResto) / tamBloque);
      bloqueIdx = (indice - limiteResto) - (bloque * tamBloque);
      bloque += tamResto;
    }
  }

  console.log(`Calculando para ${indice}:${tamBloque}:${tamResto} => ${bloque}:${bloqueIdx}`);

  return { bloque, bloqueIdx };
}

//----------------------------------------------------------------------------

export function construirArbolMerkle(compromisos) {

  if (!Array.isArray(compromisos) || compromisos.length === 0 || compromisos.length > MAX_NUM_HOJAS) {
    throw new Error(`El número de compromisos debe ser un array no vacío y con un máximo de ${MAX_NUM_HOJAS} elementos.`);
  }

  const hojas = compromisos.map(c => BigInt(c));

  if (hojas.length < MIN_NUM_HOJAS) {
    while (hojas.length < MIN_NUM_HOJAS) {
      hojas.push(HOJA_POR_DEFECTO);
    }
    console.log(`Se añaden ${MIN_NUM_HOJAS - hojas.length} hojas extras`);
  }

  const arbolMerkle = new ArbolMerkle(hojas);

  console.log(`Raíz del árbol Poseidon: ${arbolMerkle.raiz.toString()}`);
  console.log(`Número de hojas: ${arbolMerkle.numHojas}`);

  return arbolMerkle;
}

//----------------------------------------------------------------------------

export async function comprimirArchivo(origen, destinoGz) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(origen);
    const output = fs.createWriteStream(destinoGz);
    const gzip = zlib.createGzip();

    input.pipe(gzip).pipe(output);

    output.on('finish', () => {
      console.log(`Archivo comprimido: ${destinoGz}`);
      resolve();
    });
    output.on('error', reject);
    input.on('error', reject);
    gzip.on('error', reject);
  });
}

//----------------------------------------------------------------------------

export function esArchivoGzip(rutaFichero) {
  const fd = fs.openSync(rutaFichero, 'r');
  const buffer = Buffer.alloc(2);
  fs.readSync(fd, buffer, 0, 2, 0);
  fs.closeSync(fd);
  // Gzip: 0x1f 0x8b
  return buffer[0] === 0x1f && buffer[1] === 0x8b;
}

//----------------------------------------------------------------------------

export async function descomprimirArchivo(origenGz, destino) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(origenGz);
    const output = fs.createWriteStream(destino);
    const gunzip = zlib.createGunzip();

    input.pipe(gunzip).pipe(output);

    output.on('finish', () => {
      console.log(`Archivo descomprimido: ${destino}`);
      resolve();
    });
    output.on('error', reject);
    input.on('error', reject);
    gunzip.on('error', reject);
  });
}

//----------------------------------------------------------------------------

export async function descomprimirArchivoMemo(archivoGz) {
  const bufferGz = await fsp.readFile(archivoGz);
  return new Promise((resolve, reject) => {
    zlib.gunzip(bufferGz, (err, bufferDescomprimido) => {
      if (err) return reject(err);
      const texto = bufferDescomprimido.toString('utf8');
      resolve(texto);
    });
  });
}

//----------------------------------------------------------------------------

// Guarda el árbol Merkle (objeto) en un fichero JSON
export function guardarArbolEnFichero(arbol, rutaFichero) {
  fs.writeFileSync(rutaFichero, JSON.stringify(arbol, null, 2));
  console.log(`Árbol Merkle guardado en ${rutaFichero}`);
}

// Lee un árbol Merkle desde un fichero JSON y lo devuelve como objeto
export function cargarArbolDeFichero(rutaFichero) {
  const contenido = fs.readFileSync(rutaFichero, 'utf8');
  return JSON.parse(contenido);
}

//----------------------------------------------------------------------------

export async function guardarProofEnFichero(proof, nombreFichero) {
  try {
    const rutaFichero = path.join(__dirname, '../../', PROOFS_DIR, nombreFichero);
    const directorio = path.dirname(rutaFichero);
    
    // Crear el directorio si no existe
    await fsp.mkdir(directorio, { recursive: true });
    
    await fsp.writeFile(rutaFichero, proof);
    console.log(`Proof guardado en ${rutaFichero}`);
  } catch (error) {
    console.error(`Error al guardar el proof en ${rutaFichero}:`, error);
    throw error;
  }
}

//----------------------------------------------------------------------------

