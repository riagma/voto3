import { he } from '@faker-js/faker';
import { 
  calcularPoseidonCircom, 
  calcularPoseidonLite,
  calcularPoseidon2ZkPassport,
  calcularPoseidon2Noir, 
  hexStr2BigInt, 
  bigInt2HexStr } from '../../utiles/utilesCrypto.js';

const val1 = hexStr2BigInt('0x0ef169460624f186851b601b03af1e51af7e1c4727af87e1a08c8f869af90df8'); 
const val2 = hexStr2BigInt('0x00');

const inputs = [val1, val2];

console.log("Inputs:", inputs.map(bigInt2HexStr));
console.log("Inputs:", inputs.map(x => x.toString()));

const ccomPoseidon2 = calcularPoseidonCircom(inputs);
console.log("Ccom Poseidon2:", typeof ccomPoseidon2, bigInt2HexStr(ccomPoseidon2), ccomPoseidon2.toString());

const zkpaPoseidon2 = await calcularPoseidon2ZkPassport(inputs);
console.log("Zkpa Poseidon2:", typeof zkpaPoseidon2, bigInt2HexStr(zkpaPoseidon2), zkpaPoseidon2.toString());

const noirPoseidon2 = await calcularPoseidon2Noir(inputs);
console.log("Noir Poseidon2:", typeof noirPoseidon2, bigInt2HexStr(noirPoseidon2), noirPoseidon2.toString());

