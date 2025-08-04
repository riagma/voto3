import { Noir } from "@noir-lang/noir_js";

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaJson = path.join(__dirname, '../noir/poseidon2/target', 'poseidon2.json');
const contenido = await fs.readFile(rutaJson, 'utf8');
const circuito = JSON.parse(contenido);
const noir = new Noir(circuito);

export async function calcularPoseidon2Circuito(claves) {

  const inputs = Array(2).fill('0');

  for (let i = 0; i < Math.min(claves.length, 2); i++) {
    
    inputs[i] = claves[i];
  }

  const { returnValue } = await noir.execute({ clave1: inputs[0], clave2: inputs[1] });

  return returnValue;
}
