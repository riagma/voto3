import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs/promises';
import { createInterface } from 'readline';
import { RUTA_BD } from '../../utiles/constantes.js';

const __nombreArchivo = fileURLToPath(import.meta.url);
const __directorioBase = dirname(__nombreArchivo);

const archivoSQL = resolve(__directorioBase, 'ddl.sql');

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

async function inicializarBaseDatos() {
    try {
        const existeBD = await fs.access(RUTA_BD)
            .then(() => true)
            .catch(() => false);

        if (existeBD) {
            const sobrescribir = await preguntarUsuario(
                `La base de datos ya existe en: ${RUTA_BD}\n` +
                '¿Desea sobrescribirla? (s/N): '
            );

            if (!sobrescribir) {
                console.log('Operación cancelada.');
                process.exit(0);
            }

            console.log('Eliminando base de datos existente...');
            await fs.unlink(RUTA_BD);
        }

        const directorioBD = dirname(RUTA_BD);
        await fs.mkdir(directorioBD, { recursive: true });

        const sentenciasSQL = await fs.readFile(archivoSQL, 'utf-8');
        console.log(RUTA_BD);

        const bd = new Database(RUTA_BD);

        console.log(`\nInicializando base de datos en: ${RUTA_BD}`);
        bd.exec(sentenciasSQL);
        console.log('Base de datos creada exitosamente.');
        
        bd.close((error) => {
            if (error) {
                console.error('Error al cerrar la base de datos:', error.message);
            } else {
                console.log('Conexión a base de datos cerrada.');
            }
        });

    } catch (error) {
        console.error('Error durante la inicialización:', error);
        process.exit(1);
    }
}

inicializarBaseDatos();
