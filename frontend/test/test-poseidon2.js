import { poseidon2Hash } from "@zkpassport/poseidon2"
import { UltraHonkBackend } from "@aztec/bb.js";

const backend = new UltraHonkBackend();


const [,, clave, anulador] = process.argv;

if (!clave || !anulador) {
  console.error('Uso: node ${process.argv[1]} <clave> <anulador>');
  process.exit(1);
}

console.log(`Compromiso: ${poseidon2Hash([BigInt(clave), BigInt(anulador)])}`);

const hash = await backend.hash([BigInt(clave), BigInt(anulador)]);
console.log("Compromiso:", hash.toString());