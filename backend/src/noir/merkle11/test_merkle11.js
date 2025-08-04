import { UltraHonkBackend } from '@aztec/bb.js';
import { Noir } from '@noir-lang/noir_js';
import fs from 'node:fs/promises';

import { ArbolMerkle } from '../../utiles/ArbolMerkle.js';

import { 
  calcularPoseidon2, 
  randomBigInt,
  bigInt2HexStr 
} from '../../utiles/utilesCrypto.js';

const contenido = await fs.readFile('./target/merkle11.json', 'utf8');
const merkle11 = JSON.parse(contenido);

async function main() {
  // Instancia Noir y el backend
  const noir = new Noir(merkle11);
  const honk = new UltraHonkBackend(merkle11.bytecode, { threads: 8 });

  // // --- Prepara los inputs de forma consistente ---
  // const DEPTH = 11;
  // const clave = 123n;
  // const anulador = 456n;
  // const path = Array(DEPTH).fill(0n);
  // const path_indices = Array(DEPTH).fill(0n);

  // // 1. Calcula la hoja (leaf) como en Noir
  // const leaf = calcularPoseidon2([clave, anulador]);
  // console.log('Leaf:', bigInt2HexStr(leaf));

  // // 2. Calcula la raiz (root) subiendo por el arbol, como en Noir
  // let current_hash = leaf;
  // for (let i = 0; i < DEPTH; i++) {
  //   const path_element = path[i];
  //   const is_right = path_indices[i];

  //   const left = is_right === 0n ? current_hash : path_element;
  //   const right = is_right === 0n ? path_element : current_hash;

  //   current_hash = calcularPoseidon2([left, right]);
  //   console.log('Hash:', bigInt2HexStr(current_hash));
  // }
  // const root = current_hash; // Esta es la raiz correcta
  // console.log('Root:', bigInt2HexStr(root));

  // // 3. Calcula el nullifier_hash como en Noir
  // const nullifier_hash = calcularPoseidon2([anulador]);

  const hojas = Array(2000).fill(randomBigInt());

  const clave = randomBigInt();
  const anulador = randomBigInt();

  console.log('Clave:', bigInt2HexStr(clave));
  console.log('Anulador:', bigInt2HexStr(anulador));

  hojas[666] = calcularPoseidon2([clave, anulador]);

  const arbolMerkle = new ArbolMerkle(hojas);

  const { path, idxs } = arbolMerkle.generarPrueba(666);

  const inputs = {
    clave: clave.toString(),
    anulador: anulador.toString(),
    path: path.map(x => x.toString()),
    idxs: idxs.map(x => x.toString()),
    raiz: arbolMerkle.raiz.toString(),
    anulador_hash: calcularPoseidon2([anulador]).toString(),
  };

  console.log('Inputs:', inputs);

  const { witness } = await noir.execute(inputs);

  // console.log('Witness:', witness);

  // Genera la prueba
  const { proof, publicInputs } = await honk.generateProof(witness);

  await fs.writeFile("./proof", proof);
  await fs.writeFile("./public-inputs", JSON.stringify(publicInputs));

  // console.log('Proof:', proof);
  // console.log('Public Inputs:', publicInputs);

  // Verifica la prueba
  // const verified = await honk.verifyProof({ proof, publicInputs });

  // console.log('Public Inputs:', publicInputs);
  // console.log('Proof verified:', verified);

  process.exit(0);
}

main().catch(console.error);
