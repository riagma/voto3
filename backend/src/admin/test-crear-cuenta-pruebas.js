#!/usr/bin/env node
import { execSync } from 'child_process';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';
import { cuentaBlockchainDAO } from '../modelo/DAOs.js';
import { encriptar } from '../utiles/utilesCrypto.js';
import { CLAVE_MAESTRA } from '../utiles/constantes.js';

function run(cmd) {
  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(`\n$ ${cmd}\n${output}`);
    return output;
  } catch (err) {
    console.error(`Error ejecutando: ${cmd}\n`, err.stderr?.toString() || err.message);
    process.exit(1);
  }
}

try {
  const bd = abrirConexionBD();

  run('algokit goal wallet -f unencrypted-default-wallet');
  const cuentas = run('algokit goal account list');

  const cuentaRegex = /\[online\]\s+([A-Z0-9]{58})/g;
  const cuentaMatch = cuentaRegex.exec(cuentas);

  if (cuentaMatch) {
    const direccion = cuentaMatch[1];
    console.log(`Cuenta encontrada: ${direccion}`);

    const datosCuenta = run(`algokit goal account export -a ${direccion}`);
    const mnemoMatch = datosCuenta.match(/"([^"]+)"/);

    if (mnemoMatch) {
      const mnemonico = mnemoMatch[1];
      const mnemonicoEncriptado = await encriptar(mnemonico, CLAVE_MAESTRA);
      console.log(`Mnemonico encriptado: ${mnemonicoEncriptado}`);

      const registroCuenta = cuentaBlockchainDAO.obtenerPorAddr(bd,
        {
          accNet: 'localnet',
          accAddr: direccion
        });

      let cuentaId = 0; 

      if (!registroCuenta) {

        cuentaId = cuentaBlockchainDAO.crear(bd, {
          accNet: 'localnet',
          accAddr: direccion,
          accSecret: mnemonicoEncriptado,
        });

        console.log(`Cuenta de prueba creada con ID: ${cuentaId}`);

      } else {

        cuentaId = registroCuenta.cuentaId;

        cuentaBlockchainDAO.actualizar(bd, { cuentaId }, { accSecret: mnemonicoEncriptado});

        console.log(`Mnemonico actualizado de cuenta: ${registroCuenta.cuentaId}`);
      }

      const mnemonicoDesencriptado = await cuentaBlockchainDAO.obtenerMnemonico(bd, { cuentaId });
      console.log(`Mnemonico desencriptado: ${mnemonicoDesencriptado}`);
    }
  }

} catch (err) {
  console.error('Error creando cuenta de pruebas:', err);
  process.exit(1);

} finally {
  cerrarConexionBD();
}

