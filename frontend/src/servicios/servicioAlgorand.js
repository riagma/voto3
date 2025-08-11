import algosdk from 'algosdk';
import { api } from './api.js';
import { unirUrl } from '../utiles/utilesVistas.js';


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

let algod = null;
let indexer = null;
let explorer = null;
let explorerAccount = null;
let explorerAsset = null;
let explorerApplication = null;
let explorerTransaction = null;

export async function configurarAlgorand() {
  if (!algod || !indexer || !explorer) {
    const config = await api.get(`/api/algorand/config`);

    if (
      !config ||
      !config.algodServer ||
      !config.indexerServer ||
      !config.explorerServer ||
      !config.explorerAccount ||
      !config.explorerAsset ||
      !config.explorerApplication ||
      !config.explorerTransaction) {
      throw new Error("Configuración de Algorand incompleta o inválida.");
    }

    try {
      configurarAlgorandClient(
        config.algodToken || '',
        config.algodServer,
        config.algodPort || '');

      configurarAlgorandIndexer(
        config.indexerToken || '',
        config.indexerServer,
        config.indexerPort || '');

      configurarExplorador(
        config.explorerServer,
        config.explorerAccount,
        config.explorerAsset,
        config.explorerApplication,
        config.explorerTransaction);

    } catch (error) {
      throw new Error("Error al configurar Algorand: " + error.message);
    }

    console.log("Algorand configurado correctamente.");
  }
  console.log("Algorand ya estaba configurado.");
}

export function configurarAlgorandClient(token, server, port) {
  algod = new algosdk.Algodv2(token, server, port);
  console.log("Configurado Algorand Client:", server, port);
}

export function configurarAlgorandIndexer(token, server, port) {
  indexer = new algosdk.Indexer(token, server, port);
  console.log("Configurado Algorand Indexer:", server, port);
}

export function configurarExplorador(server, account, asset, application, transaction) {
  explorer = server.endsWith('/') ? server : server + '/';
  explorerAccount = account.endsWith('/') ? account : account + '/';
  explorerAsset = asset.endsWith('/') ? asset : asset + '/';
  explorerApplication = application.endsWith('/') ? application : application + '/';
  explorerTransaction = transaction.endsWith('/') ? transaction : transaction + '/';

  console.log("Configurado explorador:",
    explorer,
    explorerAccount,
    explorerAsset,
    explorerApplication,
    explorerTransaction);
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

const codificador = new TextEncoder();
const decodificador = new TextDecoder();

export const servicioAlgorand = {

  crearCuentaAleatoria() {
    const cuenta = algosdk.generateAccount();
    // console.log("Cuenta creada:", cuenta.addr);
    // console.log("Mnemonic:", algosdk.secretKeyToMnemonic(cuenta.sk));
    return { cuentaAddr: cuenta.addr.toString(), mnemonico: algosdk.secretKeyToMnemonic(cuenta.sk) };
  },

  async revisarBalance(addr) {
    const cuentaInfo = await algod.accountInformation(addr).do();
    console.log(`Balance: ${cuentaInfo.amount} microALGOs`);
    return Number(cuentaInfo.amount);
  },

  async revisarOptIn(addr, assetId) {
    const cuentaInfo = await algod.accountInformation(addr).do();
    const assetIdBigInt = BigInt(assetId);
    const tiene = cuentaInfo.assets.find(a => a.assetId === assetIdBigInt);
    console.log(tiene ? "Ya está opt-in" : "No ha hecho opt-in");
    return !!tiene;
  },

  async revisarAssetId(addr, assetId) {
    const cuentaInfo = await algod.accountInformation(addr).do();
    const assetIdBigInt = BigInt(assetId);
    const asset = cuentaInfo.assets.find(a => a.assetId === assetIdBigInt);

    if (asset) {
      console.log(`La cuenta tiene ${asset.amount} del asset ${assetId}.`);
      return asset.amount;
    } else {
      console.log(`La cuenta no tiene el asset ${assetId}.`);
      return 0;
    }
  },

  async revisarCuenta(addr, assetId) {
    let balance = 0;
    let acepta = false;
    let papeleta = false;

    try {
      const cuentaInfo = await algod.accountInformation(addr).do();
      // Convertimos el assetId de entrada a BigInt para una comparación segura
      const assetIdBigInt = BigInt(assetId);

      balance = cuentaInfo.amount;

      // --- Logs para depuración ---
      const assetsEnCuenta = cuentaInfo.assets.map(a => a.assetId);
      console.log(`Buscando el asset ID: ${assetIdBigInt}`);
      console.log('Assets que la cuenta posee:', assetsEnCuenta);
      // --- FIN: Logs para depuración ---

      const assetEncontrado = cuentaInfo.assets.find(a => a.assetId === assetIdBigInt);

      if (assetEncontrado) {
        acepta = true; // Si se encuentra el asset, ha hecho opt-in
        papeleta = assetEncontrado.amount > 0; // Si la cantidad es > 0, tiene la papeleta
      }

    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.warn(`La cuenta ${addr} no se encontró en la red.`);
      } else {
        console.error(`Error al revisar la cuenta ${addr}:`, error);
      }
    }

    console.log(`Balance: ${balance}, Acepta: ${acepta}, Papeleta: ${papeleta}`);
    return { balance, acepta, papeleta };
  },

  //----------------------------------------------------------------------------

  async hacerOptIn(mnemonico, assetId) {
    const cuenta = algosdk.mnemonicToSecretKey(mnemonico);
    if (!cuenta || !cuenta.addr || !cuenta.sk) {
      throw new Error("Cuenta inválida o mnemonico incorrecto.");
    }

    console.log("Haciendo opt-in para la cuenta:", cuenta.addr.toString(), "con assetId:", assetId);

    const params = await algod.getTransactionParams().do();
    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      sender: cuenta.addr,
      receiver: cuenta.addr,
      amount: 0,
      assetIndex: Number(assetId),
      suggestedParams: params,
    });

    const signedTxn = txn.signTxn(cuenta.sk);
    const respSRT = await algod.sendRawTransaction(signedTxn).do();
    const txId = respSRT.txId ? respSRT.txId : respSRT.txid ? respSRT.txid : "null";
    console.log("Opt-in txId:", txId);

    await algosdk.waitForConfirmation(algod, txId, 4);
    return txId;
  },

  //----------------------------------------------------------------------------

  async _consultarTransaccionAsset(addr, assetId, role) {
    const respSearch = await indexer.searchForTransactions()
      .address(addr)
      .addressRole(role)
      .assetID(assetId)
      .txType('axfer')
      .do();

    const txns = Array.isArray(respSearch.transactions) ? respSearch.transactions : [];

    const buscarAssetTransfer = (t) => {
      if (t.txType === 'appl' && t.innerTxns && t.innerTxns.length > 0) {
        return t.innerTxns.find(i => i.assetTransferTransaction && i.assetTransferTransaction.amount > 0);
      } else if (t.txType === 'axfer') {
        return t.assetTransferTransaction && t.assetTransferTransaction.amount > 0;
      }
    };

    let txnAxfer = txns.find(buscarAssetTransfer);

    return txnAxfer || null;
  },

  async consultarPapeletaRecibida(addr, assetId) {
    const papeletaRx = await this._consultarTransaccionAsset(addr, assetId, 'receiver');

    if (!papeletaRx) {
      console.log("No se ha recibido la papeleta.");
      return null;
    }

    const roundTime = papeletaRx.roundTime;
    const date = new Date(roundTime * 1000);
    console.log("Se ha recibido la papeleta.", date.toISOString(), papeletaRx);
    return { date, txId: papeletaRx.id };
  },

  async consultarPapeletaEnviada(addr, assetId) {
    const papeletaTx = await this._consultarTransaccionAsset(addr, assetId, 'sender');

    if (!papeletaTx) {
      console.log("No se ha emitido el voto.");
      return null;
    }

    const txId = papeletaTx.id;
    const nota = papeletaTx.note ? this.fromNote(papeletaTx.note) : {};
    const roundTime = papeletaTx.roundTime;
    const date = new Date(roundTime * 1000);
    console.log("Se ha emitido el voto:", date.toISOString(), txId, nota);
    return { date, txId, nota };
  },

  //----------------------------------------------------------------------------

  async votar(mnemonico, assetId, appAddr, voto) {
    try {
      const cuenta = algosdk.mnemonicToSecretKey(mnemonico);
      if (!cuenta || !cuenta.addr || !cuenta.sk) {
        throw new Error("Cuenta inválida o mnemonico incorrecto.");
      }

      const params = await algod.getTransactionParams().do();

      const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender: cuenta.addr,
        receiver: appAddr,
        amount: 1n,
        assetIndex: Number(assetId),
        suggestedParams: params,
        note: this.toNote(voto),
      });

      const signedTxn = txn.signTxn(cuenta.sk);
      const respSRT = await algod.sendRawTransaction(signedTxn).do();
      const txId = respSRT.txId ? respSRT.txId : respSRT.txid ? respSRT.txid : "null";
      console.log("Envío asset txID:", txId);

      await algosdk.waitForConfirmation(algod, txId, 4);
      return { date: new Date(), txId, voto };
    } catch (error) {
      console.error("Error al emitir el voto:", error);
      if (error.response) {
        console.error("Detalles del error:", error.response.body ? JSON.parse(error.response.body) : error.response);
      }
      throw new Error(`Error al emitir el voto: ${error.message}`);
    }
  },

  //----------------------------------------------------------------------------

  async destruirCuenta(mnemonico, assetId, appAddr, accAddr) {
    try {
      const cuenta = algosdk.mnemonicToSecretKey(mnemonico);
      if (!cuenta || !cuenta.addr || !cuenta.sk) {
        throw new Error("Cuenta inválida o mnemonico incorrecto.");
      }

      const cuentaInfo = await algod.accountInformation(cuenta.addr).do();
      const microAlgos = Number(cuentaInfo.amount || 0);
      const borrada = cuentaInfo.delete || false;

      let optOutTxId = null;
      let closeTxId = null;

      if (borrada || microAlgos <= Number(10000)) {
        // Si la cuenta ya está borrada o tiene menos de 0.01 ALGOs
        console.log("La cuenta ya está borrada o no tiene suficientes microALGOs.");
        return {
          optOutTxId,
          closeTxId,
          date: new Date()
        };
      }

      console.log(`Destruyendo cuenta ${cuenta.addr}...`);

      const assetIdBigInt = BigInt(assetId);
      const assetEncontrado = cuentaInfo.assets.find(a => a.assetId === assetIdBigInt);

      if (!assetEncontrado) {
        console.log("La cuenta no tiene el asset, procediendo a cerrar solo la cuenta.");
      }

      if (assetEncontrado) {
        console.log(`Haciendo opt-out del asset ${assetId}...`);

        const axferParams = await algod.getTransactionParams().do();
        const optOutTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          sender: cuenta.addr,
          receiver: appAddr,
          amount: assetEncontrado.amount, // Devolver todo el balance del asset
          assetIndex: Number(assetId),
          closeRemainderTo: appAddr, // Cerrar el asset hacia el creador
          suggestedParams: axferParams,
          note: this.toNote('CIERRE DE CUENTA'),  
        });

        const signedOptOutTxn = optOutTxn.signTxn(cuenta.sk);
        const respOptOut = await algod.sendRawTransaction(signedOptOutTxn).do();
        const optOutTxId = respOptOut.txId || respOptOut.txid || "null";
        console.log("Opt-out txId:", optOutTxId);

        await algosdk.waitForConfirmation(algod, optOutTxId, 4);
        console.log("Opt-out completado exitosamente");
      }

      console.log(`Cerrando cuenta y devolviendo ALGO a ${accAddr}...`);
      
      const closeParams = await algod.getTransactionParams().do();
      const closeTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: cuenta.addr,
        receiver: accAddr,
        amount: 0, // Amount 0 para cerrar cuenta
        closeRemainderTo: accAddr, // Enviar todo el balance restante la cuenta Voto3
        suggestedParams: closeParams,
        note: this.toNote('CIERRE DE CUENTA'),
      });

      const signedCloseTxn = closeTxn.signTxn(cuenta.sk);
      const respClose = await algod.sendRawTransaction(signedCloseTxn).do();
      closeTxId = respClose.txId || respClose.txid || "null";
      console.log("Cierre de cuenta txId:", closeTxId);

      await algosdk.waitForConfirmation(algod, closeTxId, 4);
      console.log("Cuenta cerrada exitosamente");

      return {
        optOutTxId,
        closeTxId,
        date: new Date()
      };

    } catch (error) {
      console.error("Error al destruir la cuenta:", error);
      if (error.response) {
        console.error("Detalles del error:", error.response.body ? JSON.parse(error.response.body) : error.response);
      }
      throw new Error(`Error al destruir la cuenta: ${error.message}`);
    }
  },

  //----------------------------------------------------------------------------

  toNote(json) {
    return codificador.encode(JSON.stringify(json));
  },

  fromNote(bytes) {
    return JSON.parse(decodificador.decode(bytes));
  },

  //----------------------------------------------------------------------------

  urlApplication(appId) {
    return appId ? unirUrl(explorer, explorerApplication, appId) : explorer;
  },
  urlAccount(address) {
    return address ? unirUrl(explorer, explorerAccount, address) : explorer;
  },
  urlAsset(assetId) {
    return assetId ? unirUrl(explorer, explorerAsset, assetId) : explorer;
  },
  urlTransaction(txId) {
    return txId ? unirUrl(explorer, explorerTransaction, txId) : explorer;
  },
}
