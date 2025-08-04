import { Buffer } from 'node:buffer';
import { TextDecoder, TextEncoder } from 'node:util';

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

export function toNote(json) {
  const str = JSON.stringify(json);
  return codificador.encode(str);
}

export function fromNote(base64) {
  const bytes = Uint8Array.from(Buffer.from(base64, 'base64'));
  const str = decodificador.decode(bytes);
  return JSON.parse(str);
}

export async function consultarSaldo(cuentaAddr) {
  const cuentaInfo = await algodClient.accountInformation(address).do();
  console.log("Saldo:", cuentaInfo.amount); // El saldo está en microAlgos
  return cuentaInfo.amount; 
}