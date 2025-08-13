import { abrirConexionBD, cerrarConexionBD } from '../src/modelo/BD.js';
import { desencriptarJSON, bigInt2HexStr, calcularPoseidon2 } from "../src/utiles/utilesCrypto.js";
import { CLAVE_PRUEBAS } from "../src/utiles/constantes.js";
import {
  registroVotanteEleccionDAO,
  pruebaZKDAO, raizZKDAO
} from "../src/modelo/DAOs.js";

import { calcularBloqueIndice, calcularPruebaDatosPublicos } from "../src/utiles/utilesArbol.js";

import { guardarProofEnFichero } from '../src/utiles/utilesArbol.js';

const dni = process.argv[2];
const eleccionId = parseInt(process.argv[3]);

if (!dni || !eleccionId) {
  console.error('Uso: node node ${process.argv[1]} <dni> <elección-id>');
  process.exit(1);
}

try {
  const bd = abrirConexionBD();

  const registroVotante = registroVotanteEleccionDAO.obtenerPorId(bd, { votanteId: dni, eleccionId });

  if (!registroVotante || !registroVotante.datosPrivados) {
    console.error(`No se encontró el registro de votante con DNI ${dni} para la elección ${eleccionId}.`);
    process.exit(1);
  }

  const datosCompromiso = await desencriptarJSON(registroVotante.datosPrivados, CLAVE_PRUEBAS);
  console.log('Cuenta:', datosCompromiso.cuentaAddr);
  console.log('Secreto:', datosCompromiso.secreto, bigInt2HexStr(BigInt(datosCompromiso.secreto)));
  console.log('Anulador:', datosCompromiso.anulador, bigInt2HexStr(BigInt(datosCompromiso.anulador)));
  const compromiso = calcularPoseidon2([BigInt(datosCompromiso.secreto), BigInt(datosCompromiso.anulador)]);
  console.log('Compromiso:', compromiso.toString(), bigInt2HexStr(compromiso));

  //----------------

  const pruebaZK = pruebaZKDAO.obtenerPorId(bd, { pruebaId: registroVotante.eleccionId });
  if (!pruebaZK) {
    console.error(`No se encontró la prueba ZK para la elección ${registroVotante.eleccionId}`);
    process.exit(1);
  }

  console.log(pruebaZK);

  const { bloque, bloqueIdx } = calcularBloqueIndice(
    pruebaZK.tamBloque,
    pruebaZK.tamResto,
    registroVotante.compromisoIdx);

  const raizZK = raizZKDAO.obtenerPorId(bd, { pruebaId: registroVotante.eleccionId, bloqueIdx: bloque });
  if (!raizZK) {
    console.error(`No se encontró la raíz ZK para la elección ${registroVotante.eleccionId} y bloque ${bloque}`);
    process.exit(1);
  }

  console.log(raizZK);

  const { proof, proofHash, publicInputs } = await calcularPruebaDatosPublicos({
    clave: datosCompromiso.secreto,
    anulador: datosCompromiso.anulador,
    bloqueIdx,
    ficheroMerkle11: pruebaZK.urlCircuito,
    ficheroCompromisos: raizZK.urlCompromisos,
  });

  const anulador_hash = calcularPoseidon2([BigInt(datosCompromiso.anulador)]).toString();
  await guardarProofEnFichero(proof, `proof_${anulador_hash}_loc.bin`);

} catch (err) {
  console.error('Error abriendo el registro de compromisos:', err);

} finally {
  cerrarConexionBD();
  process.exit(0);
}
