import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { stringifyJSON } from 'algosdk';

import { CONFIG } from '../utiles/constantes.js';
import { algorand } from './algorand.js';
import { inicializarEleccion } from './serviciosVoto3.js';
import { cuentaBlockchainDAO, contratoBlockchainDAO } from '../modelo/DAOs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

export async function desplegarContrato(bd, eleccionId, cuentaId = 1) {

  const artifactsDir = path.join(__dirname, '../../', CONFIG.ARTIFACTS_DIR);

  console.log(`Desplegando contrato: ${eleccionId} - ${cuentaId} - ${artifactsDir}`);

  const { approvalProgram, clearStateProgram, schema } = await _leerArtefactos(artifactsDir);

  // console.log(`Obteniendo Mnemonico de cuenta ${cuentaId}...`);
  const mnemonico = await cuentaBlockchainDAO.obtenerMnemonico(bd, { cuentaId });
  // console.log(`Leyendo mnemonico de cuenta ${cuentaId}: ${mnemonico}`);

  //-------------

  const account = algorand.account.fromMnemonic(mnemonico);
  console.log(`Cuenta de despliegue: ${account.addr}`);

  const resultCreate = await algorand.send.appCreate(
    {
      sender: account.addr,
      approvalProgram,
      clearStateProgram,
      schema,
    },
    {
      skipWaiting: false,
      skipSimulate: true,
      maxRoundsToWaitForConfirmation: 12,
      maxFee: (2000).microAlgos(),
    }
  );

  const nuevoContrato = {
    contratoId: eleccionId,
    appId: resultCreate.appId,
    appAddr: resultCreate.appAddress.toString(),
    tokenId: "0",
    cuentaId, 
    rondaInicialCompromisos: "0",
    rondaFinalCompromisos: "0",
    rondaInicialAnuladores: "0",
    rondaFinalAnuladores: "0"
  };

  console.log(`Nuevo contrato: ${stringifyJSON(nuevoContrato)}`);

  const contratoId = contratoBlockchainDAO.crear(bd, nuevoContrato);

  //-------------

  await algorand.send.payment(
    {
      sender: account.addr,
      receiver: resultCreate.appAddress,
      amount: (1).algos(),
    },
    {
      skipWaiting: false,
      skipSimulate: true,
      maxRoundsToWaitForConfirmation: 12,
    }
  );

  //-------------

  const resultadoInicializacion = await inicializarEleccion(bd, {
    contratoId,
    nombreToken: 'VOTO3',
    nombreUnidades: 'VT3',
    numeroUnidades: BigInt(100000000),
  });

  console.log(`Contrato inicializado con éxito, con asset id = ${stringifyJSON(resultadoInicializacion)}`);

  contratoBlockchainDAO.actualizar(bd, { contratoId }, { tokenId: resultadoInicializacion }); 

  //--------------

  console.log(`Contrato desplegado con éxito:`);
  console.log(`  contratoId: ${contratoId}`);
  console.log(`  appId:      ${resultCreate.appId}`);
  console.log(`  appAddr:    ${resultCreate.appAddress}`);

  return {
    contratoId,
    appId: resultCreate.appId,
    appAddr: resultCreate.appAddress
  };
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------

async function _leerArtefactos(artifactsDir) {

  const approvalFile = (await _findFile(artifactsDir, '.approval.teal'));
  const clearFile = (await _findFile(artifactsDir, '.clear.teal'));

  console.log(`  Approval TEAL: ${approvalFile}`);
  console.log(`  Clear TEAL   : ${clearFile}`);

  if (!approvalFile || !clearFile) {
    throw new Error('No se encontraron los TEAL de approval o clear en ' + artifactsDir);
  }

  const approvalProgram = await readFile(path.join(artifactsDir, approvalFile), 'utf8');
  const clearStateProgram = await readFile(path.join(artifactsDir, clearFile), 'utf8');

  // Intenta cargar schema desde appspec, si existe
  let globalInts = 0, globalByteSlices = 0, localInts = 0, localByteSlices = 0;
  const specFile = (await _findFile(artifactsDir, '.json'));
  if (specFile) {
    const specJson = JSON.parse(await readFile(path.join(artifactsDir, specFile), 'utf8'));
    console.log(`  Cargando esquema desde: ${stringifyJSON(specJson.state.schema)}`);
    globalInts = specJson.state.schema.global?.ints ?? 0;
    globalByteSlices = specJson.state.schema.global?.bytes ?? 0;
    localInts = specJson.state.schema.local?.ints ?? 0;
    localByteSlices = specJson.state.schema.local?.bytes ?? 0;
  }

  console.log(`  Global State Schema: ${globalInts} ints, ${globalByteSlices} bytes`);
  console.log(`  Local State Schema : ${localInts} ints, ${localByteSlices} bytes`);

  return {
    approvalProgram,
    clearStateProgram,
    schema: {
      globalInts,
      globalByteSlices,
      localInts,
      localByteSlices,
    },
  };
}

//----------------------------------------------------------------------------

async function _findFile(dir, suffix) {
  const files = await _readFileDir(dir);
  return files.find((f) => f.toLowerCase().endsWith(suffix));
}

async function _readFileDir(dir) {
  const { readdir } = await import('node:fs/promises');
  return readdir(dir);
}

//----------------------------------------------------------------------------
//----------------------------------------------------------------------------
