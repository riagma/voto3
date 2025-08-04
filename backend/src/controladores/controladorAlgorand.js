
import { CONFIG } from '../utiles/constantes.js';

export const controladorAlgorand = {
  
  obtenerConfiguracionAlgorand(peticion, respuesta) {
    try {
      respuesta.json({
        algodToken: CONFIG.ALGOD_TOKEN,
        algodServer: CONFIG.ALGOD_SERVER,
        algodPort: CONFIG.ALGOD_PORT,
        indexerToken: CONFIG.INDEXER_TOKEN,
        indexerServer: CONFIG.INDEXER_SERVER,
        indexerPort: CONFIG.INDEXER_PORT,
        explorerServer: CONFIG.EXPLORER_SERVER,
        explorerAccount: CONFIG.EXPLORER_ACCOUNT,
        explorerAsset: CONFIG.EXPLORER_ASSET,
        explorerApplication: CONFIG.EXPLORER_APPLICATION,
        explorerTransaction: CONFIG.EXPLORER_TRANSACTION,
      });
    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },
};

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function obtenerConfiguracionExplorador(serverBase) {

  let server = serverBase.endsWith('/') ? serverBase : serverBase + '/';

  let account = 'account/';
  let asset = 'asset/';
  let application = 'application/';
  let transaction = 'transaction/';

  if (serverBase.includes('allo.info')) {
    account = 'address/';
    asset = 'asa/';
    application = 'app/';
    transaction = 'txn/';

  } else if (serverBase.includes('explorer.perawallet.app')) {
    account = 'account/';
    asset = 'asset/';
    application = 'application/';
    transaction = 'tx/';

  } else if (serverBase.includes('lora.algokit.io')) {
    account = 'account/';
    asset = 'asset/';
    application = 'application/';
    transaction = 'transaction/';
  }

  return {
    server,
    account,
    asset,
    application,
    transaction
  };
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------




