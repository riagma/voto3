#!/usr/bin/env node
import { createInterface } from 'readline';
import { cerrarConexionBD, abrirConexionBD } from '../modelo/BD.js';
import { eleccionDAO, contratoBlockchainDAO, pruebaZKDAO, raizZKDAO, anuladorZKDAO } from '../modelo/DAOs.js';
import { desplegarContrato } from '../algorand/desplegarContrato.js';

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;
const cuentaId = process.argv[3] ? parseInt(process.argv[3]) : 1;

if (!eleccionId) {
    console.error(`Uso: node ${process.argv[1]} <elección-id> <cuenta-id>?`);
    process.exit(1);
}

//-------------

try {
    const bd = abrirConexionBD();

    const eleccion = eleccionDAO.obtenerPorId(bd, { id: eleccionId });
    if (!eleccion) {
        console.error(`No se encontró la elección con ID ${eleccionId}`);
        process.exit(1);
    }

    const contrato = contratoBlockchainDAO.obtenerPorId(bd, { contratoId: eleccionId });

    if (contrato) {
        await preguntarUsuario(
          `La elección con ID ${eleccionId} ya tiene asociado el contrato con appId: ${contrato.appId}.\n` +
          '¿Deseas reemplazarlo? (s/n): '
        );
        const reemplazarlo = await preguntarUsuario(
          'Se perderán los datos actuales de la blockchain, ¿estás seguro? (s/n): '
        );
        if (reemplazarlo) {
            anuladorZKDAO.eliminarPorPruebaId(bd, eleccionId);
            raizZKDAO.eliminarPorPruebaId(bd, eleccionId);
            pruebaZKDAO.eliminar(bd, { pruebaId: eleccionId });
            contratoBlockchainDAO.reciclarContrato(bd, eleccionId);
        } else {
            console.log('Operación cancelada.');
            process.exit(0);
        }

    }

    console.log(`Desplegando el contrato algorand para elección con ID ${eleccionId}`);
    const { appId } = desplegarContrato(bd, eleccionId, cuentaId);
    console.log(`Desplegado contrato con appId ${appId} para la elección con ID ${eleccionId}`);

} catch (err) {
    console.error('Error desplegando contrato para elección:', err);
    process.exit(1);

} finally {
    cerrarConexionBD();
}

//-------------

async function preguntarUsuario(pregunta) {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolver => {
        rl.question(pregunta, (respuesta) => {
            rl.close();
            resolver(respuesta.toLowerCase().startsWith('s'));
        });
    });
}



