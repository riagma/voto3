import { poseidon2Hash, poseidon2HashAsync } from "@zkpassport/poseidon2"

const codificador = new TextEncoder('utf-8');
const decodificador = new TextDecoder('utf-8');

//----------------------------------------------------------------------------

export function calcularPoseidon2(datos) {

  const inputs = Array.isArray(datos) ? datos : [datos];

  for (const x of inputs) {
    if (typeof x !== 'bigint') {
      throw new Error('Todos los elementos de entrada deben ser BigInt');
    }
  }

  return poseidon2Hash(inputs);
}

//----------------------------------------------------------------------------

export async function calcularPoseidon2Async(datos) {

  const inputs = Array.isArray(datos) ? datos : [datos];

  for (const x of inputs) {
    if (typeof x !== 'bigint') {
      throw new Error('Todos los elementos de entrada deben ser BigInt');
    }
  }

  return await poseidon2HashAsync(inputs);
}

//----------------------------------------------------------------------------

export async function calcularSha256(datos) {
  let buffer;
  if (typeof datos === 'string') {
    buffer = codificador.encode(datos);
  } else if (datos instanceof Uint8Array) {
    buffer = datos;
  } else if (datos instanceof ArrayBuffer) {
    buffer = new Uint8Array(datos);
  } else {
    throw new Error('Datos deben ser un string, Uint8Array o ArrayBuffer');
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function randomBigInt(bytes = 24) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return BigInt('0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''));
}

export async function hashPassword(password) {
  const data = codificador.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

//----------------------------------------------------------------------------

export function hexToBytes(hex) {
  if (hex.length % 2 !== 0) throw new Error('Hex inválido');
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return arr;
}

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexStr2BigInt(hexStr) {
  return BigInt(hexStr.startsWith("0x") ? hexStr : "0x" + hexStr);
}

export function bigInt2HexStr(bigIntValue) {
  let hex = bigIntValue.toString(16);
  return hex.length % 2 ? "0x0" + hex : "0x" + hex;
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export function generarSalt(longitud = 16) {
  const array = new Uint8Array(longitud);
  crypto.getRandomValues(array);
  return bytesToHex(array);
}

export async function generarSaltSemilla(semilla) {
  const data = codificador.encode(semilla);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const array = new Uint8Array(hashBuffer).slice(0, 16);
  return bytesToHex(array);
}

export async function derivarClave(claveTexto, saltHex) {
  const claveBase = await crypto.subtle.importKey(
    'raw', codificador.encode(claveTexto), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex),
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

export async function encriptar(cadena, claveDerivada) {
  const vectorInicial = crypto.getRandomValues(new Uint8Array(12));
  const datos = codificador.encode(cadena);
  const cifrado = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: vectorInicial }, claveDerivada, datos
  ));
  // Formato: sal(16) + vectorInicial(12) + cifrado(n)
  const resultado = new Uint8Array(16 + 12 + cifrado.length);
  resultado.set(crypto.getRandomValues(new Uint8Array(16)), 0);
  resultado.set(vectorInicial, 16);
  resultado.set(cifrado, 28);
  // Conversión a base64 (navegador puro, sin Buffer)
  return btoa(String.fromCharCode(...resultado));
}

//----------------------------------------------------------------------------

export async function desencriptar(cifradoBase64, claveDerivada) {
  try {
    const binario = Uint8Array.from(atob(cifradoBase64), c => c.charCodeAt(0));
    const vectorInicial = binario.slice(16, 28);
    const cifrado = binario.slice(28);
    const plano = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: vectorInicial }, claveDerivada, cifrado
    );
    return decodificador.decode(plano);
  } catch (e) {
    console.error("Error al desencriptar:", e);
    throw e;
  }
}

//----------------------------------------------------------------------------

export async function encriptarJSON(objeto, claveDerivada) {
  return await encriptar(JSON.stringify(objeto), claveDerivada);
}

export async function desencriptarJSON(cifradoBase64, claveDerivada) {
  try {
    const cadena = await desencriptar(cifradoBase64, claveDerivada);
    return JSON.parse(cadena);
  } catch (e) {
    throw e; // Reenvía la excepción
  }
}

//----------------------------------------------------------------------------

export async function desencriptarNode(cifradoBase64, claveTexto) {
  try {
    const binario = Uint8Array.from(atob(cifradoBase64), c => c.charCodeAt(0));
    const salt = binario.slice(0, 16);
    const vectorInicial = binario.slice(16, 28);
    const cifrado = binario.slice(28);
    const clave = await derivarClave(claveTexto, bytesToHex(salt));
    const plano = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: vectorInicial }, clave, cifrado
    );
    return decodificador.decode(plano);
  } catch (e) {
    console.error("Error al desencriptar:", e);
    throw e;
  }
}

//----------------------------------------------------------------------------


export async function desencriptarNodeJSON(cifradoBase64, claveDerivada) {
  try {
    const cadena = await desencriptarNode(cifradoBase64, claveDerivada);
    return JSON.parse(cadena);
  } catch (e) {
    throw e; // Reenvía la excepción
  }
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

function pemToUint8Array(pem) {
  // Quita encabezados y saltos de línea, igual que antes
  const pemBody = pem.replace(/-----.*?-----|\s/g, '');
  // Decodifica base64 → string binario
  const binary = atob(pemBody);
  // Convierte string binario a Uint8Array
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Convertir el ArrayBuffer a base64 (sin Buffer, solo JS puro)
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Función auxiliar para convertir de base64 a ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generarNonceHex(numBytes = 16) {
  const buffer = new Uint8Array(numBytes);
  window.crypto.getRandomValues(buffer);
  const nonceHex = Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
  return nonceHex;
}

//----------------------------------------------------------------------------

export async function encriptarConClavePublica(texto, clavePublicaPem) {

  // Convertir la clave PEM a Uint8Array DER
  const pubKeyDer = pemToUint8Array(clavePublicaPem);

  // Importar la clave pública
  const pubKey = await window.crypto.subtle.importKey(
    "spki",
    pubKeyDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  // Codificar el texto
  const datos = codificador.encode(texto);

  // Cifrar los datos
  const cifrado = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    datos
  );

  return arrayBufferToBase64(cifrado);
}

//----------------------------------------------------------------------------

export async function desencriptarConClavePrivada(cifradoBase64, clavePrivadaPem) {
  // Convertir la clave PEM a Uint8Array (formato DER)
  const privKeyDer = pemToUint8Array(clavePrivadaPem);

  // Importar la clave privada
  const privKey = await window.crypto.subtle.importKey(
    "pkcs8", // Formato estándar para claves privadas
    privKeyDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  // Convertir el texto cifrado de base64 a ArrayBuffer
  const cifrado = base64ToArrayBuffer(cifradoBase64);

  // Descifrar los datos
  const datosPlano = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privKey,
    cifrado
  );

  // Decodificar el resultado a texto
  return decodificador.decode(datosPlano);
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
