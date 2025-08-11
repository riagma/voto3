import { randomBytes, createHash, webcrypto } from 'node:crypto';
import { Buffer } from 'node:buffer';

import { poseidon2Hash, poseidon2HashAsync } from "@zkpassport/poseidon2"

//----------------------------------------------------------------------------

export function calcularPoseidon2ZkpSync(datos) {

  const inputs = Array.isArray(datos) ? datos : [datos];

  for (const x of inputs) {
    if (typeof x !== 'bigint') {
      throw new Error('Todos los elementos de entrada deben ser BigInt');
    }
  }

  return poseidon2Hash(inputs);
}

//----------------------------------------------------------------------------

export async function calcularPoseidon2ZkpAsync(datos) {

  const inputs = Array.isArray(datos) ? datos : [datos];

  for (const x of inputs) {
    if (typeof x !== 'bigint') {
      throw new Error('Todos los elementos de entrada deben ser BigInt');
    }
  }

  return await poseidon2HashAsync(inputs);
}

//----------------------------------------------------------------------------

export function calcularPoseidon2(datos) {
  return calcularPoseidon2ZkpSync(datos);
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export function calcularSha256(datos) {
  return createHash('sha256').update(datos).digest('hex');
}

export function randomSha256(bytes = 32) {
  const aleatorio = randomBytes(bytes);
  return calcularSha256(aleatorio);
}

//------------
// const p = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;
//------------

export function randomBigInt(bytes = 24) {
  const buf = randomBytes(bytes);
  return BigInt('0x' + buf.toString('hex')); // % p; // para 32 bytes
}

export function hexStr2BigInt(hexStr) {
  return BigInt(hexStr.startsWith("0x") ? hexStr : "0x" + hexStr);
}

export function bigInt2HexStr(bigIntValue) {
  let hex = bigIntValue.toString(16);
  return hex.length % 2 ? "0x0" + hex : "0x" + hex;
}

export function concatenarBigInts(a, b) {

  // 1. Convertir a hex (sin 0x)
  let hexA = a.toString(16);
  let hexB = b.toString(16);

  // 2. Rellenar si longitud impar
  if (hexA.length % 2) hexA = '0' + hexA;
  if (hexB.length % 2) hexB = '0' + hexB;

  // 3. Convertir a Buffer
  const bufA = Buffer.from(hexA, 'hex');
  const bufB = Buffer.from(hexB, 'hex');

  // 4. Concatenar
  return Buffer.concat([bufA, bufB]);
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

async function derivarClave(claveTexto, sal) {
  const claveBase = await webcrypto.subtle.importKey(
    'raw', codificador.encode(claveTexto), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: sal,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    claveBase,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

//----------------------------------------------------------------------------

export async function encriptar(cadena, claveTexto) {
  const vectorInicial = webcrypto.getRandomValues(new Uint8Array(12));
  const sal = webcrypto.getRandomValues(new Uint8Array(16));
  const clave = await derivarClave(claveTexto, sal);
  const datos = codificador.encode(cadena);
  const cifrado = new Uint8Array(await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv: vectorInicial }, clave, datos
  ));
  // Formato: sal(16) + vectorInicial(12) + cifrado(n)
  const resultado = new Uint8Array(16 + 12 + cifrado.length);
  resultado.set(sal, 0);
  resultado.set(vectorInicial, 16);
  resultado.set(cifrado, 28);
  return Buffer.from(resultado).toString('base64');
}

//----------------------------------------------------------------------------

export async function desencriptar(cifradoBase64, claveTexto) {
  const binario = Uint8Array.from(Buffer.from(cifradoBase64, 'base64'));
  const sal = binario.slice(0, 16);
  const vectorInicial = binario.slice(16, 28);
  const cifrado = binario.slice(28);
  const clave = await derivarClave(claveTexto, sal);
  const plano = await webcrypto.subtle.decrypt(
    { name: 'AES-GCM', iv: vectorInicial }, clave, cifrado
  );
  return decodificador.decode(plano);
}

//----------------------------------------------------------------------------

export async function encriptarJSON(objeto, claveTexto) {
  return await encriptar(JSON.stringify(objeto), claveTexto);
}

export async function desencriptarJSON(cifradoBase64, claveTexto) {
  const cadena = await desencriptar(cifradoBase64, claveTexto);
  return JSON.parse(cadena);
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

// Utilidades para PEM <-> Uint8Array

function pemToUint8Array(pem) {
  const pemBody = pem.replace(/-----.*?-----|\s/g, '');
  return new Uint8Array(Buffer.from(pemBody, 'base64'));
}
function uint8ArrayToPem(uint8, type) {
  const b64 = Buffer.from(uint8).toString('base64');
  const lines = b64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${type}-----\n${lines}\n-----END ${type}-----`;
}

//----------------------------------------------------------------------------

// Generar par de claves asimétricas (RSA-OAEP)
export async function generarParClavesRSA() {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Exportar a formato PEM (texto base64)
  const pubKey = new Uint8Array(await webcrypto.subtle.exportKey("spki", keyPair.publicKey));
  const privKey = new Uint8Array(await webcrypto.subtle.exportKey("pkcs8", keyPair.privateKey));

  const pubPem = uint8ArrayToPem(pubKey, "PUBLIC KEY");
  const privPem = uint8ArrayToPem(privKey, "PRIVATE KEY");

  return { clavePublica: pubPem, clavePrivada: privPem };
}

// Encriptar con clave pública
export async function encriptarConClavePublica(texto, clavePublicaPem) {
  const pubKeyDer = pemToUint8Array(clavePublicaPem);
  const pubKey = await webcrypto.subtle.importKey(
    "spki",
    pubKeyDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const datos = codificador.encode(texto);
  const cifrado = await webcrypto.subtle.encrypt({ name: "RSA-OAEP" }, pubKey, datos);
  return Buffer.from(new Uint8Array(cifrado)).toString('base64');
}

// Desencriptar con clave privada
export async function desencriptarConClavePrivada(cifradoBase64, clavePrivadaPem) {
  const privKeyDer = pemToUint8Array(clavePrivadaPem);
  const privKey = await webcrypto.subtle.importKey(
    "pkcs8",
    privKeyDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );
  const cifrado = Buffer.from(cifradoBase64, 'base64');
  const plano = await webcrypto.subtle.decrypt({ name: "RSA-OAEP" }, privKey, cifrado);
  return decodificador.decode(plano);
}

