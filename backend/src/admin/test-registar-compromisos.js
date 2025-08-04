#!/usr/bin/env node
import algosdk from 'algosdk';
import { registrarVotanteEleccion } from '../algorand/registrarCompromisos.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { votanteDAO } from '../modelo/DAOs.js';
import { 
  calcularPoseidon2,
  encriptarJSON,
  randomBigInt
} from '../utiles/utilesCrypto.js';
import { CLAVE_PRUEBAS } from '../utiles/constantes.js';

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const numeroVotantes = process.argv[3] ? parseInt(process.argv[3]) : 100;

if (!eleccionId) {
    console.error(`Uso: node ${process.argv[1]} <elección-id> <número-votantes>?`);
    process.exit(1);
}

try {
    const bd = abrirConexionBD();

    const votantesSinRegistro = votanteDAO.obtenerVotantesSinRegistro(bd, eleccionId, numeroVotantes);

    if (votantesSinRegistro.length > 0) {

        console.log(`Se registrarán ${votantesSinRegistro.length} votantes en la elección ${eleccionId}.`);

        console.log = function () {}; // Desactiva console.log para evitar demasiada salida

        for (const votante of votantesSinRegistro) {

            const votanteId = votante.dni;

            const { compromiso, datosPrivados } = await generarDatosPrivadoPruebas();

            await registrarVotanteEleccion(bd, { votanteId, eleccionId, compromiso, datosPrivados });

            console.log(`Compromiso registrado para el votante ${votante.dni} en la elección ${eleccionId}: ${compromiso}`);
        }
    }

    console.log(`Total de votantes registrados ${votantesSinRegistro.length} en la elección ${eleccionId}.`);
 
} catch (err) {
    console.error('Error abriendo el registro de compromisos:', err);
    process.exit(1);

} finally {
    cerrarConexionBD();
}

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

  return { compromiso, datosPrivados };
}


