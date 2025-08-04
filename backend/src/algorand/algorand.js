import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import { CONFIG } from '../utiles/constantes.js';

// export const algorand =
  // CONFIG.ALGO_ENV === 'mainnet' ? AlgorandClient.mainNet() :
  // CONFIG.ALGO_ENV === 'testnet' ? AlgorandClient.testNet() :
  // CONFIG.ALGO_ENV === 'localnet' ? AlgorandClient.defaultLocalNet() : null;


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

export const algorand = AlgorandClient.fromConfig({ algodConfig, indexerConfig });

async function printNetworkInfo() {
  const network = await algorand.client.network();
  console.log(`Is LocalNet: ${network.isLocalNet}`);
  console.log(`Is TestNet: ${network.isTestNet}`);
  console.log(`Is MainNet: ${network.isMainNet}`);
  console.log(`Genesis ID: ${network.genesisId}`);
  console.log(`Genesis Hash: ${network.genesisHash}`);
}

printNetworkInfo();

if (!algorand) {
  throw new Error(`Entorno de Algorand no configurado correctamente: ${CONFIG.ALGO_ENV}`);
}

export const algod = algorand.client.algod;
export const indexer = algorand.client.indexer;
