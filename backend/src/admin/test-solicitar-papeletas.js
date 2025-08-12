#!/usr/bin/env node
import { algorand } from '../algorand/algorand.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { contratoBlockchainDAO, pruebaZKDAO, raizZKDAO, votanteDatosEleccionDAO } from '../modelo/DAOs.js';
import { registrarAnuladorEleccion, solicitarPapeletaEleccion } from '../algorand/registrarAnuladores.js';
import { calcularBloqueIndice, calcularPruebaDatosPublicos } from '../utiles/utilesArbol.js';

import { ALGO_ENV } from '../utiles/constantes.js';

const TAM_LOTE = ALGO_ENV === 'localnet' ? 100 : 10;

const consoleLog = console.log;

//--------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotantes = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id> <número-votantes>?`);
  process.exit(1);
}

//----------------------------------------------------------------------------

const totalLabel = 'Tiempo total';
console.time(totalLabel);

try {

  const bd = abrirConexionBD();

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });
  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}.`);
  }

  console.log('Datos del contrato:', contrato);

  const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: eleccionId });
  if (!pruebaZK) {
    throw new Error(`No se encontró la prueba ZK para la elección ${eleccionId}.`);
  }

  console.log('Datos de la prueba ZK:', pruebaZK);

  let raizZK = null;

  //--------------

  let contadorVotantes = 0;


  while (contadorVotantes < numeroVotantes) {

    const max = Math.min(TAM_LOTE, numeroVotantes - contadorVotantes);

    const datosVotantes = votanteDatosEleccionDAO.obtenerDatosVotantesSolicitar(bd, { eleccionId, max });

    if (!datosVotantes || datosVotantes.length === 0) {
      console.error(`No se encontraron más datos de votantes para la elección ${eleccionId}.`);
      break;
    }

    contadorVotantes += datosVotantes.length;
    console.log(`Solicitando ${datosVotantes.length} papeletas de votantes en la elección ${eleccionId}.`);

    const loteLabel = `Procesados ${datosVotantes.length} votantes. Total: ${contadorVotantes}/${numeroVotantes}`;
    console.time(loteLabel);

    const proofLabel = `Generadas ${datosVotantes.length} pruebas ZK`;
    console.time(proofLabel);

    //--------------
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    await Promise.all(datosVotantes.map(async (datosVotante) => {

      const { bloque, bloqueIdx } = calcularBloqueIndice(
        pruebaZK.tamBloque,
        pruebaZK.tamResto,
        datosVotante.compromisoIdx);

      if (raizZK === null || raizZK.bloqueIdx !== bloque) {
        raizZK = raizZKDAO.obtenerPorId(bd, { pruebaId: eleccionId, bloqueIdx: bloque });
      }

      const { proof, proofHash, publicInputs } = await calcularPruebaDatosPublicos({
        clave: datosVotante.secreto,
        anulador: datosVotante.anulador,
        bloqueIdx: bloqueIdx,
        ficheroMerkle11: pruebaZK.urlCircuito,
        ficheroCompromisos: raizZK.urlCompromisos,
      });

      datosVotante.proof = proof;
      // OJO: Se guarda el hash de la prueba temporalmente para no crear un campo nuevo
      datosVotante.claveVotoPublica = proofHash;
      datosVotante.publicInputs = publicInputs;

      // return datosVotante;
    }));

    //--------------
    console.log = consoleLog;
    console.timeEnd(proofLabel);
    const verifyLabel = `Verificadas ${datosVotantes.length} pruebas ZK`;
    console.time(verifyLabel);
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    // const datosGenerados = await Promise.all(
    //   datosVotantes.map(async (datosVotante) => {
    await Promise.all(datosVotantes.map(async (datosVotante) => {
      console.log('Datos votante:', datosVotante);

      const resultadoRegistrar = await registrarAnuladorEleccion(bd, {
        eleccionId,
        destinatario: datosVotante.cuentaAddr,
        proof: datosVotante.proof,
        proofHash: datosVotante.claveVotoPublica,
        publicInputs: datosVotante.publicInputs,
      });

      console.log('Resultado del registro:', resultadoRegistrar);

      return datosVotante;
    }));

    //--------------
    console.log = consoleLog;
    console.timeEnd(verifyLabel);
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    // const datosVerificados = await Promise.all(
    //   datosVotantes.map(async (datosVotante) => {
    await Promise.all(datosVotantes.map(async (datosVotante) => {
      console.log('Datos votante:', datosVotante);

      await realizarOptInCuentaVotante(
        datosVotante.cuentaAddr,
        datosVotante.mnemonico,
        contrato.tokenId);


      const anuladorHash = BigInt(datosVotante.publicInputs[1]).toString();
      await solicitarPapeletaEleccion(bd, { eleccionId, anulador: anuladorHash });

      datosVotante.anuladorHash = anuladorHash;
      return datosVotante;
    }));

    for (const datosVotante of datosVotantes) {
      datosVotante.proof = '-';
      datosVotante.claveVotoPublica = '-';
      datosVotante.publicInputs = '-';
      actualizarDatosVotante(bd, datosVotante);
    }

    console.log = consoleLog;
    console.timeEnd(loteLabel);
    console.timeLog(totalLabel);
  }

} catch (err) {
  console.log = consoleLog;
  console.error('Error solicitando papeletas votantes:', err);
  process.exit(1);

} finally {
  console.log = consoleLog;
  console.log('Cerrando conexión a la base de datos...');
  cerrarConexionBD();
  console.log('Proceso finalizado.');
  console.timeEnd(totalLabel);
  process.exitCode = 0;
  process.kill(process.pid, 'SIGTERM');
  // process.exit(0);
}

//----------------------------------------------------------------------------

async function realizarOptInCuentaVotante(cuentaAddr, mnemonico, assetId) {

  console.log(`Realizando Opt-In en cuenta ${cuentaAddr} para assetId ${assetId}`);

  const accountInfo = await algorand.account.getInformation(cuentaAddr);
  console.log(`Cuenta ${cuentaAddr} = ${accountInfo.amount}`);

  const papeleta = accountInfo.assets.find(asset => asset.assetId === BigInt(assetId));

  if (accountInfo.amount < 200000n && papeleta) {
    console.log(`Cuenta ${cuentaAddr} ya acepta papeletas.`);
    return null;
  }

  const cuenta = algorand.account.fromMnemonic(mnemonico);

  const resultadoOptIn = await algorand.send.assetOptIn(
    {
      sender: cuenta.addr,
      assetId: BigInt(assetId),
      signer: cuenta.signer,
    },
    {
      skipWaiting: false,
      skipSimulate: true,
      maxRoundsToWaitForConfirmation: 12,
      maxFee: (2000).microAlgos(),
    });

  // console.log(resultadoOptIn);

  return resultadoOptIn
}

//----------------------------------------------------------------------------

function actualizarDatosVotante(bd, datosVotante) {

  const { votanteId, eleccionId, ...datos } = datosVotante;

  const id = { votanteId, eleccionId };

  votanteDatosEleccionDAO.actualizar(bd, id, datos);
}

//----------------------------------------------------------------------------

