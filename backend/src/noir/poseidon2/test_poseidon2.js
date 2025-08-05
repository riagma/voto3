import { 
  calcularPoseidon2ZkpSync, 
  calcularPoseidon2ZkpAsync,
  hexStr2BigInt, 
  bigInt2HexStr } from '../../utiles/utilesCrypto.js';

const val1 = hexStr2BigInt('0x0ef169460624f186851b601b03af1e51af7e1c4727af87e1a08c8f869af90df8'); 
const val2 = hexStr2BigInt('0x00');

const inputs = [val1, val2];

console.log("Inputs:", inputs.map(bigInt2HexStr));
console.log("Inputs:", inputs.map(x => x.toString()));

const poseidon2ZkpSync = calcularPoseidon2ZkpSync(inputs);
console.log("poseidon2ZkpSync:", typeof poseidon2ZkpSync, bigInt2HexStr(poseidon2ZkpSync), poseidon2ZkpSync.toString());

const poseidon2ZkpAsync = await calcularPoseidon2ZkpAsync(inputs);
console.log("poseidon2ZkpAsync:", typeof poseidon2ZkpAsync, bigInt2HexStr(poseidon2ZkpAsync), poseidon2ZkpAsync.toString());

