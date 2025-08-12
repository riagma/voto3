#!/usr/bin/env node
import algosdk from 'algosdk';
import { registrarVotanteEleccion } from '../algorand/registrarCompromisos.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { votanteDAO, votanteDatosEleccionDAO } from '../modelo/DAOs.js';
import {
  calcularPoseidon2,
  encriptarJSON,
  randomBigInt
} from '../utiles/utilesCrypto.js';
import { CLAVE_PRUEBAS, ALGO_ENV } from '../utiles/constantes.js';

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

try {
  const bd = abrirConexionBD();

  let contadorVotantes = 0;

  while (contadorVotantes < numeroVotantes) {

    const max = Math.min(TAM_LOTE, numeroVotantes - contadorVotantes);

    const votantesSinRegistro = votanteDAO.obtenerVotantesSinRegistro(bd, eleccionId, max);

    if (!votantesSinRegistro || votantesSinRegistro.length === 0) {
      console.error(`No se encontraron más votantes sin registrar para la elección ${eleccionId}.`);
      break;
    }

    contadorVotantes += votantesSinRegistro.length;
    console.log(`Registrando ${votantesSinRegistro.length} votantes en la elección ${eleccionId}.`);

    const loteLabel = `Procesados ${votantesSinRegistro.length} votantes. Total: ${contadorVotantes}/${numeroVotantes}`;
    console.time(loteLabel);

    //--------------
    console.log = function () { }; // Desactiva console.log para evitar demasiada salida
    //--------------

    const resultados = await Promise.all(
      votantesSinRegistro.map(async (votante) => {

        const votanteId = votante.dni;

        const { compromiso, datosPrivados, datosPublicos } = await generarDatosPrivadoPruebas();

        const registroVotante = await registrarVotanteEleccion(bd, {
          votanteId,
          eleccionId,
          compromiso,
          datosPrivados,
        });

        crearVotanteDatosEleccion(bd,
          votanteId,
          eleccionId,
          registroVotante,
          datosPublicos
        );

        return { votanteId, compromiso };
      })
    );

    for (const { votanteId, compromiso } of resultados) {
      console.log(`Compromiso registrado para el votante ${votanteId} en la elección ${eleccionId}: ${compromiso}`);
    }

    console.log = consoleLog;
    console.timeEnd(loteLabel);
  }

} catch (err) {
  console.error('Error creando el registro de compromisos:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

//----------------------------------------------------------------------------

async function generarDatosPrivadoPruebas() {

  const cuenta = algosdk.generateAccount();

  const secreto = randomBigInt();
  const anulador = randomBigInt();

  const datosPublicos = {
    cuentaAddr: cuenta.addr.toString(),
    mnemonico: algosdk.secretKeyToMnemonic(cuenta.sk),
    secreto: secreto.toString(),
    anulador: anulador.toString(),
  };

  // console.log('Datos públicos generados:', datosPublicos);

  const compromiso = calcularPoseidon2([secreto, anulador]).toString();

  // console.log('Compromiso calculado:', compromiso);

  const datosPrivados = await encriptarJSON(datosPublicos, CLAVE_PRUEBAS);

  // console.log('Datos privados encriptados:', datosPrivados);
  // console.log('Datos privados desencriptados:', await desencriptarJSON(datosPrivados, CLAVE_PRUEBAS));

  return { compromiso, datosPrivados, datosPublicos };
}

//----------------------------------------------------------------------------

function crearVotanteDatosEleccion(bd, votanteId, eleccionId, registroVotante, datosPublicos) {

  const id = {
    votanteId: votanteId,
    eleccionId: eleccionId,
  };

  const datos = {
    votanteId: votanteId,
    eleccionId: eleccionId,
    cuentaAddr: datosPublicos.cuentaAddr,
    mnemonico: datosPublicos.mnemonico,
    secreto: datosPublicos.secreto,
    anulador: datosPublicos.anulador,
    anuladorHash: '-',
    compromiso: registroVotante.compromiso,
    compromisoIdx: registroVotante.compromisoIdx,
    compromisoTxId: registroVotante.compromisoTxId,
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

  if (votanteDatosEleccionDAO.obtenerPorId(bd, id)) {
    console.log(`El votante ${votanteId} ya tiene datos para la elección ${eleccionId}.`);
    votanteDatosEleccionDAO.actualizar(bd, id, datos);
  } else {
    console.log(`Creando datos del votante ${votanteId} para la elección ${eleccionId}.`);
    votanteDatosEleccionDAO.crear(bd, datos);
  }
}

//----------------------------------------------------------------------------




