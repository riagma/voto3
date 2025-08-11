#!/usr/bin/env node
import { abrirRegistroRaicesEleccion } from '../algorand/registrarRaices.js';
import { abrirConexionBD, cerrarConexionBD } from '../modelo/BD.js';

const eleccionId = process.argv[2] ? parseInt(process.argv[2]) : undefined;

if (!eleccionId) {
    console.error(`Uso: node ${process.argv[1]} <elección-id>`);
    process.exit(1);
}

try {
    const bd = abrirConexionBD();

    await abrirRegistroRaicesEleccion(bd, eleccionId);

} catch (err) {
    console.error('Error abriendo el registro de raices:', err);
    process.exit(1);

} finally {
    cerrarConexionBD();
}

