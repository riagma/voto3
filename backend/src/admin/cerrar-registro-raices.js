#!/usr/bin/env node
import { cerrarRegistroRaicesEleccion, leerDatosRaicesEleccion } from '../algorand/registrarRaices.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';

const eleccionId = process.argv[2];

if (!eleccionId) {
    console.error(`Uso: node ${process.argv[1]} <elección-id>`);
    process.exit(1);
}

try {
    const bd = abrirConexionBD();

    await cerrarRegistroRaicesEleccion(bd, parseInt(eleccionId));

    await leerDatosRaicesEleccion(bd, parseInt(eleccionId));

} catch (err) {
    console.error('Error cerrando el registro de raíces:', err);
    process.exit(1);

} finally {
    cerrarConexionBD();
}

