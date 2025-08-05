#!/usr/bin/env node
import { execSync } from 'child_process';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { cuentaBlockchainDAO } from '../modelo/DAOs.js';
import { encriptar } from '../utiles/utilesCrypto.js';
import { CLAVE_MAESTRA } from '../utiles/constantes.js';
import { leerEntradaConsola } from '../utiles/utilesScripts.js';


try {
  const bd = abrirConexionBD();

  let direccion = await leerEntradaConsola(
    'Introduzca la dirección de la cuenta de testnet: '
  );

  console.log(`Dirección de cuenta: --${direccion}--`);

  if (!direccion) {
    console.error('No se proporcionó una dirección de cuenta.');
    process.exit(1);
  }

  let mnemonico = await leerEntradaConsola(
    'Introduzca el mnemonico de la cuenta de testnet: '
  );

  if (!mnemonico) {
    console.error('No se proporcionó un mnemonico.');
    process.exit(1);
  }

  let cuentaId = 0;

  const mnemonicoEncriptado = await encriptar(mnemonico, CLAVE_MAESTRA);

  const registroCuenta = cuentaBlockchainDAO.obtenerPorAddr(bd,
    {
      accNet: 'localnet',
      accAddr: direccion
    });

  if (!registroCuenta) {

    cuentaId = cuentaBlockchainDAO.crear(bd, {
      accNet: 'localnet',
      accAddr: direccion,
      accSecret: mnemonicoEncriptado,
    });

    console.log(`Cuenta de prueba creada con ID: ${cuentaId}`);

  } else {

    cuentaId = registroCuenta.cuentaId;

    cuentaBlockchainDAO.actualizar(bd, { cuentaId }, { accSecret: mnemonicoEncriptado });

    console.log(`Mnemonico actualizado de cuenta: ${registroCuenta.cuentaId}`);
  }

  const mnemonicoDesencriptado = await cuentaBlockchainDAO.obtenerMnemonico(bd, { cuentaId });
  console.log(`Mnemonico desencriptado: ${mnemonicoDesencriptado}`);

} catch (err) {
  console.error('Error creando cuenta de pruebas:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

