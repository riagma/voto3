import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { CONFIG } from '../utiles/constantes.js';

const algodConfig = {
  server: CONFIG.ALGOD_SERVER,
  port: CONFIG.ALGOD_PORT,
  token: CONFIG.ALGOD_TOKEN,
};

const indexerConfig = {
  server: CONFIG.INDEXER_SERVER,
  port: CONFIG.INDEXER_PORT,
  token: CONFIG.INDEXER_TOKEN,
};

console.log(`Configurando Algorand con: ${JSON.stringify(algodConfig)}`);
export const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig });
console.log(`Algorand configurado: ${CONFIG.ALGO_ENV}`);

async function printNetworkInfo() {
  const network = await algorand.client.network();
  console.log(`Is LocalNet: ${network.isLocalNet}`);
  console.log(`Is TestNet: ${network.isTestNet}`);
  console.log(`Is MainNet: ${network.isMainNet}`);
  console.log(`Genesis ID: ${network.genesisId}`);
  console.log(`Genesis Hash: ${network.genesisHash}`);
}

await printNetworkInfo();

if (!algorand) {
  throw new Error(`Entorno de Algorand no configurado correctamente: ${CONFIG.ALGO_ENV}`);
}

export const algod = algorand.client.algod;
export const indexer = algorand.client.indexer;
