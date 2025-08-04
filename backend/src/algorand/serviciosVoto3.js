import { TextEncoder } from 'node:util'
import { microAlgos } from '@algorandfoundation/algokit-utils';

import { ABIMethod, decodeAddress, stringifyJSON } from 'algosdk';
import { algorand } from './algorand.js';
import { contratoBlockchainDAO, cuentaBlockchainDAO } from '../modelo/DAOs.js'; 
import { desencriptar } from '../utiles/utilesCrypto.js';
import { CLAVE_MAESTRA } from '../utiles/constantes.js';

import { toNote } from './algoUtiles.js';

const textEncoder = new TextEncoder();

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

const ABIinicializarEleccion = new ABIMethod({
  name: 'inicializar_eleccion',
  args: [
    { type: 'string', name: 'asset_name' },
    { type: 'string', name: 'unit_name' },
    { type: 'uint64', name: 'total' }
  ],
  returns: { type: 'uint64' },
});

const ABIleerEstadoContrato = new ABIMethod({
  name: 'leer_estado_contrato',
  args: [],
  returns: { type: 'uint64' },
});

const ABIestablecerEstadoContrato = new ABIMethod({
  name: 'establecer_estado_contrato',
  args: [
    { type: 'uint64', name: 'nuevo_estado' }
  ],
  returns: { type: 'uint64' },
});

//--------------

const ABIabrirRegistroCompromisos = new ABIMethod({
  name: 'abrir_registro_compromisos',
  args: [],
  returns: { type: 'void' },
});

const ABIregistrarCompromiso = new ABIMethod({
  name: 'registrar_compromiso',
  args: [],
  returns: { type: 'uint64' },
});

const ABIcerrarRegistroCompromisos = new ABIMethod({
  name: 'cerrar_registro_compromisos',
  args: [],
  returns: { type: 'uint64' },
});

//--------------

const ABIabrirRegistroRaices = new ABIMethod({
  name: 'abrir_registro_raices',
  args: [
    { type: 'uint64', name: 'num_bloques' },
    { type: 'uint64', name: 'tam_bloque' },
    { type: 'uint64', name: 'tam_resto' }
  ],
  returns: { type: 'void' },
});

const ABIregistrarRaiz = new ABIMethod({
  name: 'registrar_raiz',
  args: [],
  returns: { type: 'uint64' },
});

const ABIcerrarRegistroRaices = new ABIMethod({
  name: 'cerrar_registro_raices',
  args: [{ type: 'string', name: 'txnId_raiz' }],
  returns: { type: 'uint64' },
});

const ABIleerDatosRaices = new ABIMethod({
  name: 'leer_datos_raices',
  args: [],
  returns: { type: '(uint64,uint64,uint64,string)' },
});

//--------------

const ABIabrirRegistroAnuladores = new ABIMethod({
  name: 'abrir_registro_anuladores',
  args: [],
  returns: { type: 'void' },
});

const ABIregistrarAnulador = new ABIMethod({
  name: 'registrar_anulador',
  args: [],
  returns: { type: 'uint64' },
});

const ABIenviarPapeleta = new ABIMethod({
  name: 'enviar_papeleta',
  args: [{ type: 'byte[]', name: 'destinatario' }],
  returns: { type: 'uint64' },
});

const ABIcerrarRegistroAnuladores = new ABIMethod({
  name: 'cerrar_registro_anuladores',
  args: [],
  returns: { type: 'uint64' },
});

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

let contadorNote = 0;

async function _llamarMetodoVoto3(bd, { contratoId, method, args = [], note, lease, extraFee }) {
  console.log(`Ejecutando llamada al método ${method.name}`);
  const { sender, appId } = await establecerClienteVoto3(bd, { contratoId });
  const params = {
    sender,
    appId,
    method,
    args,
    skipWaiting: false,
    skipSimulate: true,
    maxRoundsToWaitForConfirmation: 12,
    maxFee: microAlgos((extraFee ?? 0) + 2000),
    debug: false,
  };
  params.note = note ? toNote(note) : toNote(`voto3-${method.name}-${++contadorNote}`);
  if (lease) params.lease = lease;
  if (extraFee) params.extraFee = extraFee;
  const resultado = await algorand.send.appCallMethodCall(params);
  console.log(`Llamada ejecutada con éxito ${resultado.confirmation?.confirmedRound} - ${resultado.txIds}`);
  return resultado;
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function inicializarEleccion(bd,
  {
    contratoId,
    nombreToken,
    nombreUnidades,
    numeroUnidades,
  }) {

  const assetName = nombreToken.length > 32 ? nombreToken.substring(0, 32) : nombreToken;
  const unitName = nombreUnidades.length > 8 ? nombreUnidades.substring(0, 8) : nombreUnidades;
  const total = BigInt(numeroUnidades);

  const args = [assetName, unitName, total];

  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIinicializarEleccion,
    args,
    extraFee: (100000).microAlgos(),
  });
  return resultado.returns[0].returnValue;
}

//----------------------------------------------------------------------------

export async function leerEstadoContrato(bd, { contratoId }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIleerEstadoContrato,
  });
  return resultado.returns[0].returnValue;
}

//----------------------------------------------------------------------------

export async function establecerEstadoContrato(bd, { contratoId, estado }) {
  const args = [BigInt(estado)];
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIestablecerEstadoContrato,
    args,
  });
  return resultado.returns[0].returnValue;
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function abrirRegistroCompromisos(bd, { contratoId }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIabrirRegistroCompromisos,
  });
  return { round: resultado.confirmation?.confirmedRound };
}

//----------------------------------------------------------------------------

export async function registrarCompromiso(bd, { contratoId, compromiso }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIregistrarCompromiso,
    note: compromiso,
  });
  return { txId: resultado.txIds[0], cont: resultado.returns[0].returnValue };
}

//----------------------------------------------------------------------------

export async function cerrarRegistroCompromisos(bd, { contratoId }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIcerrarRegistroCompromisos,
  });
  return { round: resultado.confirmation?.confirmedRound, total: resultado.returns[0].returnValue };
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function abrirRegistroRaices(bd, { contratoId, numBloques, tamBloque, tamResto }) {
  const args = [numBloques, tamBloque, tamResto];
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIabrirRegistroRaices,
    args,
  });
  return { txId: resultado.txIds[0], round: resultado.confirmation?.confirmedRound };
}

//----------------------------------------------------------------------------

export async function registrarRaiz(bd, { contratoId, raiz }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIregistrarRaiz,
    note: raiz,
  });
  return { txId: resultado.txIds[0], cont: resultado.returns[0].returnValue };
}

//----------------------------------------------------------------------------

export async function cerrarRegistroRaices(bd, { contratoId, txIdRaizInicial }) {
  const args = [textEncoder.encode(txIdRaizInicial)];
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIcerrarRegistroRaices,
    args
  });
  return { txId: resultado.txIds[0], round: resultado.confirmation?.confirmedRound };
}

//----------------------------------------------------------------------------

export async function leerDatosRaices(bd, { contratoId }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIleerDatosRaices,
  });
  // console.log("Datos de raices leídos:", stringifyJSON(resultado.returns[0].returnValue[0]));
  // console.log("Datos de raices leídos:", stringifyJSON(resultado.returns[0].returnValue[1]));
  // console.log("Datos de raices leídos:", stringifyJSON(resultado.returns[0].returnValue[2]));
  // console.log("Datos de raices leídos:", stringifyJSON(resultado.returns[0].returnValue[3]));
  return {
    numBloques: Number(resultado.returns[0].returnValue[0]),
    tamBloque: Number(resultado.returns[0].returnValue[1]),
    tamResto: Number(resultado.returns[0].returnValue[2]),
    txnIdRaiz: resultado.returns[0].returnValue[3],
  };
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function abrirRegistroAnuladores(bd, { contratoId }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIabrirRegistroAnuladores,
  });
  return { ronda: resultado.confirmation?.confirmedRound };
}

//----------------------------------------------------------------------------

export async function registrarAnulador(bd, { contratoId, destinatario, anuladorNote }) {
  const { sender, appId } = await establecerClienteVoto3(bd, { contratoId });

  const txGroup = algorand
    .newGroup()
    .addPayment({ sender: sender, receiver: destinatario, amount: (205000).microAlgo() })
    .addAppCallMethodCall({
      sender,
      appId,
      method: ABIregistrarAnulador,
      maxFee: (2000).microAlgo(),
      note: toNote(anuladorNote),
    });

  const resultado = await txGroup.send({
    skipSimulate: true,
    skipWaiting: false,
    maxRoundsToWaitForConfirmation: 12,
  });

  console.log(resultado);

  return { 
    txId: resultado.txIds[1], 
    cont: resultado.returns[0].returnValue };
}

//----------------------------------------------------------------------------

export async function enviarPapeleta(bd, { contratoId, destinatario }) {
  console.log("Enviando papeleta a:", destinatario);
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIenviarPapeleta,
    extraFee: (1000).microAlgo(),
    args: [decodeAddress(destinatario).publicKey]
  });
  return { txId: resultado.txIds[0], cont: resultado.returns[0].returnValue };
}

//----------------------------------------------------------------------------

export async function cerrarRegistroAnuladores(bd, { contratoId }) {
  const resultado = await _llamarMetodoVoto3(bd, {
    contratoId,
    method: ABIcerrarRegistroAnuladores,
  });
  return { 
    ronda: resultado.confirmation?.confirmedRound,
    total: resultado.returns[0].returnValue };
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

let contratoVoto3 = 0;

let contratoAppId = null;
let contratoSender = null;

export async function establecerClienteVoto3(bd, { contratoId }) {

  if (contratoId !== contratoVoto3) {

    contratoVoto3 = contratoId;

    const { appId, cuentaId } = contratoBlockchainDAO.obtenerPorId(bd, { contratoId });
    const { accSecret } = cuentaBlockchainDAO.obtenerPorId(bd, { cuentaId });

    const mnemonico = await desencriptar(accSecret, CLAVE_MAESTRA);

    const cuentaContrato = algorand.account.fromMnemonic(mnemonico);

    algorand.setSigner(cuentaContrato.addr, cuentaContrato.signer);

    contratoAppId = BigInt(appId);
    contratoSender = cuentaContrato.addr;

    console.log(`sender: ${contratoSender}, appId: ${contratoAppId}`);
  }

  return { sender: contratoSender, appId: contratoAppId }
}

// //----------------------------------------------------------------------------

// export async function leerContratoBaseDatos(bd, contratoId) {
//   try {
//     const contrato = await daos.contratoBlockchain.obtenerPorId(bd, { contratoId });
//     if (!contrato) {
//       throw new Error(`No se ha encontrado el contrato con ID ${contratoId}`);
//     }
//     return { appId: contrato.appId, cuentaId: contrato.cuentaId };
//   } catch (error) {
//     throw new Error('Error obtenido datos cuenta: ' + error.message);
//   }
// }

// //----------------------------------------------------------------------------

// export async function leerCuentaBaseDatos(bd, cuentaId) {
//   try {
//     const cuenta = await daos.cuentaBlockchain.obtenerPorId(bd, { cuentaId });
//     if (!cuenta) {
//       throw new Error(`No se ha encontrado la cuenta con ID ${cuentaId}`);
//     }
//     return { secreto: cuenta.accSecret }
//   } catch (error) {
//     throw new Error('Error obtenido datos cuenta: ' + error.message);
//   }
// }

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
