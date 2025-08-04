#!/usr/bin/env node
import { algorand } from '../algorand/algorand.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { contratoBlockchainDAO, registroVotanteEleccionDAO, anuladorZKDAO, pruebaZKDAO, raizZKDAO } from '../modelo/DAOs.js';
import { registrarAnuladorEleccion, solicitarPapeletaEleccion } from '../algorand/registrarAnuladores.js';

import { desencriptarJSON, calcularPoseidon2 } from '../utiles/utilesCrypto.js';
import { calcularBloqueIndice, calcularPruebaDatosPublicos } from '../utiles/utilesArbol.js';  

import { CLAVE_PRUEBAS } from '../utiles/constantes.js';

//--------------

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroPapeletas = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
  console.error(`Uso: node ${process.argv[1]} <elección-id> <número-papeletas>?`);
  process.exit(1);
}

//----------------------------------------------------------------------------

async function generarPruebasRegistro(bd, registroVotante, datosPrivados) {

  const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: registroVotante.eleccionId });
  if (!pruebaZK) {
    throw new Error(`No se encontró la prueba ZK para la elección ${registroVotante.eleccionId}`);
  }

  console.log(pruebaZK);

  const { bloque, bloqueIdx } = calcularBloqueIndice(
    pruebaZK.tamBloque,
    pruebaZK.tamResto,
    registroVotante.compromisoIdx);

  const raizZK = raizZKDAO.obtenerPorId(bd, { pruebaId: registroVotante.eleccionId, bloqueIdx: bloque });
  if (!raizZK) {
    throw new Error(`No se encontró la raíz ZK para la elección ${registroVotante.eleccionId} y bloque ${bloque}`);
  }

  console.log(raizZK);

  const { proof, proofHash, publicInputs } = await calcularPruebaDatosPublicos({
    clave: datosPrivados.secreto,
    anulador: datosPrivados.anulador,
    bloqueIdx,
    ficheroMerkle11: pruebaZK.urlCircuito,
    ficheroCompromisos: raizZK.urlCompromisos,
  });

  const datosPublicos = publicInputs.map(pi => BigInt(pi).toString());
  console.log('Datos públicos:', datosPublicos);

  return { proof, proofHash, publicInputs };
}

//----------------------------------------------------------------------------

async function realizarOptInCuentaVotante(assetId, mnemonico) {

  console.log(`Realizando Opt-In para la cuenta votante con assetId ${assetId} y mnemonico ${mnemonico}`);
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

  console.log(resultadoOptIn);

  return resultadoOptIn
}

//----------------------------------------------------------------------------

try {

  const bd = abrirConexionBD();

  const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });

  if (!contrato) {
    throw new Error(`No se encontró el contrato para la elección ${eleccionId}`);
  }

//--------------
  console.log = function () {}; // Desactiva console.log para evitar demasiada salida
//--------------

  let contadorPapeletas = 0;
  let compromisoIdx = 0;

  while (contadorPapeletas < numeroPapeletas) {

    const votantesRegistrados = registroVotanteEleccionDAO.obtenerRegistrosEleccion(bd,
      {
        eleccionId,
        compromisoIdx
      });

    if (!votantesRegistrados || votantesRegistrados.length === 0) {
      console.log(`No hay votantes registrados para la elección ${eleccionId} con compromisoIdx ${compromisoIdx}.`);
      break;
    }

    compromisoIdx += votantesRegistrados.length;
    
    for (let idx = 0; idx < votantesRegistrados.length && contadorPapeletas < numeroPapeletas; idx++) {

      const registroVotante = votantesRegistrados[idx];

      console.log(`Procesando votante ${registroVotante.votanteId} en la elección ${eleccionId}.`);

      const datosPrivados = await desencriptarJSON(registroVotante.datosPrivados, CLAVE_PRUEBAS);

      console.log(`Datos privados del votante ${registroVotante.votanteId}:`, datosPrivados);

      const anuladorHash = calcularPoseidon2([BigInt(datosPrivados.anulador)]).toString();

      const anuladorZK = anuladorZKDAO.obtenerPorId(bd, { pruebaId: eleccionId, anulador: anuladorHash });

      if (anuladorZK && anuladorZK.papeletaTxId !== 'TEMPORAL') {
        console.log(`Ya se ha enviado la papeleta al votante ${registroVotante.votanteId} en la elección ${eleccionId}.`);
        continue;
      }

      console.log(anuladorZK ? anuladorZK : `No se encontró anulador ZK ${eleccionId}:${anuladorHash}`);

      if (!anuladorZK) {

        const { proof, proofHash, publicInputs } = await generarPruebasRegistro(bd, registroVotante, datosPrivados);

        console.log(`Registrando papeleta ${proofHash} para el votante ${registroVotante.votanteId} en la elección ${eleccionId}.`);

        const resultadoRegistrar = await registrarAnuladorEleccion(bd, {
          eleccionId,
          destinatario: datosPrivados.cuentaAddr,
          proof,
          proofHash,
          publicInputs,
        });

        console.log(`Resultado del registro: ${resultadoRegistrar.cont}`);
      }

      const resultadoOptIn = await realizarOptInCuentaVotante(
        contrato.tokenId, 
        datosPrivados.mnemonico);

      await solicitarPapeletaEleccion(bd, { eleccionId, anulador: anuladorHash });

      contadorPapeletas++;
    }
  }

} catch (err) {
  console.error('Error abriendo el registro de compromisos:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

process.exit(0);


