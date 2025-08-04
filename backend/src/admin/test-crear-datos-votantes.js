#!/usr/bin/env node
import { randomBytes } from 'node:crypto';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';

import {
  registroVotanteEleccionDAO,
  votanteDatosEleccionDAO,
  eleccionDAO,
  partidoDAO,

  contratoBlockchainDAO,
  pruebaZKDAO,
  raizZKDAO,

} from '../modelo/DAOs.js';

import {
  calcularPoseidon2,
  desencriptarJSON,
  encriptarConClavePublica } from '../utiles/utilesCrypto.js';

import { 
  calcularBloqueIndice, 
  calcularPruebaDatosPublicos } from '../utiles/utilesArbol.js';

import { CLAVE_PRUEBAS } from '../utiles/constantes.js';

//----------------------------------------------------------------------------

function crearVotanteDatosEleccion(votanteId, eleccionId) {
  return {
    votanteId: votanteId,
    eleccionId: eleccionId,
    cuentaAddr: '-',
    mnemonico: '-',
    secreto: '-',
    anulador: '-',
    anuladorHash: '-',
    compromiso: '-',
    compromisoIdx: 0,
    compromisoTxId: '-',
    appId: '-',
    appAddr: '-',
    tokenId: '-',
    numBloques: 0,
    tamBloque: 0,
    tamResto: 0,
    txIdRaizInicial: '-',
    urlCircuito: '-',
    bloque: 0,
    bloqueIdx: 0,
    raiz: '-',
    txIdRaiz: '-',
    urlCompromisos: '-',
    proof: '-',
    publicInputs: '-',
    claveVotoPublica: '-',
    voto: '-',
    votoEnc: '-',
    votoTxId: '-',
  };
}

//----------------------------------------------------------------------------

let partidos = null
let pesos = []

function elegirPartido(bd, eleccionId) {

  if (!partidos) {
    partidos = partidoDAO.obtenerPorEleccion(bd, eleccionId);
    let sumaPesos = 0;
    for (const partido of partidos) {
      const peso = Math.random();
      pesos.push(peso);
      sumaPesos += peso;
    }
    pesos = pesos.map(peso => peso / sumaPesos);
  }

  const r = Math.random();

  let acumulado = 0;
  for (let i = 0; i < partidos.length; i++) {
    acumulado += pesos[i];
    if (r < acumulado) return partidos[i];
  }
  return partidos[partidos.length - 1];
}

//----------------------------------------------------------------------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotantes = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id> <número-votantes>?`);
  process.exit(1);
}

try {
  const bd = abrirConexionBD();

  const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
  if (!eleccion) {
    throw new Error(`No se encontró la elección con ID ${eleccionId}`);
  }

  //--------------
  const consoleLog = console.log;
  console.log = function () {}; // Desactiva console.log para evitar demasiada salida
  //--------------

  let contadorVotantes = 0;
  let compromisoIdx = 0;

  while (contadorVotantes < numeroVotantes) {

    const registrosVotantes = registroVotanteEleccionDAO.obtenerRegistrosEleccion(bd,
      {
        eleccionId,
        compromisoIdx,
        max: 1000
      });

    // console.log(`Procesando ${registrosVotantes.length} registros de votantes para la elección ${eleccionId}.`);

    if (!registrosVotantes || registrosVotantes.length === 0) {
      console.log(`No hay más votantes registrados para la elección ${eleccionId} con compromisoIdx ${compromisoIdx}.`);
      break;
    }

    compromisoIdx += registrosVotantes.length;

    for (const registro of registrosVotantes) {

      // console.log(`Procesando registro de votante: ${registro.votanteId}, compromisoIdx: ${registro.compromisoIdx}`);

      let datosVotante = votanteDatosEleccionDAO.obtenerPorId(bd, {
        votanteId: registro.votanteId,
        eleccionId: registro.eleccionId,
      });

      if (datosVotante) {
        console.log(`El votante ${datosVotante.votanteId} ya tiene datos para la elección ${datosVotante.eleccionId}.`);
        continue;
      }

      datosVotante = crearVotanteDatosEleccion(registro.votanteId, registro.eleccionId);

      datosVotante.compromiso = registro.compromiso;
      datosVotante.compromisoIdx = registro.compromisoIdx;
      datosVotante.compromisoTxId = registro.compromisoTxId;

      //--------------

      const datosPrivados = await desencriptarJSON(registro.datosPrivados, CLAVE_PRUEBAS);

      datosVotante.cuentaAddr = datosPrivados.cuentaAddr;
      datosVotante.mnemonico = datosPrivados.mnemonico;
      datosVotante.secreto = datosPrivados.secreto;
      datosVotante.anulador = datosPrivados.anulador;

      datosVotante.anuladorHash = calcularPoseidon2([BigInt(datosVotante.anulador)]).toString();

      //--------------

      const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: datosVotante.eleccionId });

      if (!contrato) {
        console.error(`No se encontró el contrato para la elección ${datosVotante.eleccionId}.`);
        continue;
      }

      datosVotante.appId = contrato.appId;
      datosVotante.appAddr = contrato.appAddr;
      datosVotante.tokenId = contrato.tokenId;

      // console.log(`Datos del contrato: appId=${datosVotante.appId}, appAddr=${datosVotante.appAddr}, tokenId=${datosVotante.tokenId}`);

      //--------------

      const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: datosVotante.eleccionId });

      if (!pruebaZK) {
        console.error(`No se encontró la prueba ZK para la elección ${datosVotante.eleccionId}.`);
        continue;
      }

      datosVotante.numBloques = pruebaZK.numBloques;
      datosVotante.tamBloque = pruebaZK.tamBloque;
      datosVotante.tamResto = pruebaZK.tamResto;
      datosVotante.txIdRaizInicial = pruebaZK.txIdRaizInicial;
      datosVotante.urlCircuito = pruebaZK.urlCircuito;

      // console.log(`Datos de la prueba ZK: numBloques=${datosVotante.numBloques}, tamBloque=${datosVotante.tamBloque}, tamResto=${datosVotante.tamResto}, txIdRaizInicial=${datosVotante.txIdRaizInicial}, urlCircuito=${datosVotante.urlCircuito}`);

      //--------------

      const { bloque, bloqueIdx } = calcularBloqueIndice(
        datosVotante.tamBloque,
        datosVotante.tamResto,
        datosVotante.compromisoIdx);

      datosVotante.bloque = bloque;
      datosVotante.bloqueIdx = bloqueIdx;

      // console.log(`Índice del bloque: bloque=${datosVotante.bloque}, bloqueIdx=${datosVotante.bloqueIdx}`);

      //--------------

      const raizZK = raizZKDAO.obtenerPorId(bd, {
        pruebaId: datosVotante.eleccionId,
        bloqueIdx: datosVotante.bloque
      });

      datosVotante.raiz = raizZK.raiz;
      datosVotante.txIdRaiz = raizZK.txIdRaiz;
      datosVotante.urlCompromisos = raizZK.urlCompromisos;

      // console.log(`Raíz del bloque: ${datosVotante.raiz}, txIdRaiz=${datosVotante.txIdRaiz}, urlCompromisos=${datosVotante.urlCompromisos}`);

      //--------------

      const { proof, publicInputs } = await calcularPruebaDatosPublicos({
        clave: datosVotante.secreto,
        anulador: datosVotante.anulador,
        bloqueIdx: datosVotante.bloqueIdx,
        ficheroMerkle11: datosVotante.urlCircuito,
        ficheroCompromisos: datosVotante.urlCompromisos,
      });

      datosVotante.proof = proof.toString('base64'); // Guardar como Base64
      datosVotante.publicInputs = JSON.stringify(publicInputs);

      // console.log(`Prueba generada: proof=${datosVotante.proof.length}, publicInputs=${datosVotante.publicInputs}`);

      //--------------

      datosVotante.claveVotoPublica = eleccion.claveVotoPublica;

      datosVotante.voto = elegirPartido(bd, datosVotante.eleccionId).siglas;
      datosVotante.votoEnc = await encriptarConClavePublica(JSON.stringify({
        siglas: datosVotante.voto,
        nonce: randomBytes(16).toString('hex')
      }), datosVotante.claveVotoPublica);

      //--------------

      const { proof: prueba, ...datosVotantePintar } = datosVotante;
      console.log(datosVotantePintar);
      console.log('proof = ', prueba.length);

      votanteDatosEleccionDAO.crear(bd, datosVotante);

      if (++contadorVotantes >= numeroVotantes) {
        break;
      }
    }
  }

  console.log = consoleLog;
  console.log(`Se han creado ${contadorVotantes} datos de votantes para la elección ${eleccionId}.`);

} catch (err) {
  console.log = consoleLog;
  console.error('Error abriendo el registro de compromisos:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
  process.exit(0);
}




