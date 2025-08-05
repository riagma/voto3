#!/usr/bin/env node
import fetch from 'node-fetch';
import path from 'path';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

/**
 * Sube un archivo al backend IPFS
 * @param {string} rutaArchivo - Ruta completa del archivo
 * @returns {Promise<string>} - CID del archivo subido
 */
export async function subirArchivoRemoto(rutaArchivo) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ipfs/subir`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rutaArchivo }),
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.error || 'Error desconocido');
    }

    console.log(`Archivo subido exitosamente:`);
    console.log(`  Archivo: ${resultado.archivo}`);
    console.log(`  CID: ${resultado.cid}`);
    console.log(`  Tamaño: ${resultado.tamaño} bytes`);

    return resultado.cid;

  } catch (error) {
    console.error('Error subiendo archivo:', error.message);
    throw error;
  }
}

/**
 * Descarga un archivo de IPFS y muestra su contenido
 * @param {string} cid - CID del archivo
 * @param {boolean} mostrarContenido - Si mostrar el contenido por consola (default: true)
 * @returns {Promise<Uint8Array>} - Contenido del archivo
 */
export async function descargarArchivoRemoto(cid, mostrarContenido = true) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ipfs/descargar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cid }),
    });

    const resultado = await response.json();

    if (!response.ok) {
      throw new Error(resultado.error || 'Error desconocido');
    }

    console.log(`Archivo descargado exitosamente:`);
    console.log(`  CID: ${resultado.cid}`);
    console.log(`  Tamaño: ${resultado.tamaño} bytes`);

    // Convertir de base64 a buffer
    const buffer = Buffer.from(resultado.contenido, 'base64');
    
    if (mostrarContenido) {
      console.log('\n--- CONTENIDO DEL ARCHIVO ---');
      
      // Intentar mostrar como texto primero
      try {
        const textoContenido = buffer.toString('utf8');
        
        // Verificar si es texto válido (no contiene muchos caracteres no imprimibles)
        const caracteresNoImprimibles = textoContenido.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g);
        const esBinario = caracteresNoImprimibles && caracteresNoImprimibles.length > textoContenido.length * 0.1;
        
        if (!esBinario) {
          console.log(textoContenido);
        } else {
          console.log('(Archivo binario - mostrando hexadecimal)');
          console.log(buffer.toString('hex'));
        }
      } catch (error) {
        console.log('(Error decodificando como texto - mostrando hexadecimal)');
        console.log(buffer.toString('hex'));
      }
      
      console.log('--- FIN CONTENIDO ---\n');
    }

    return new Uint8Array(buffer);

  } catch (error) {
    console.error('Error descargando archivo:', error.message);
    throw error;
  }
}

/**
 * Verifica el estado del servicio IPFS
 */
export async function verificarEstado() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ipfs/estado`);
    const resultado = await response.json();
    
    console.log(`Estado IPFS: ${resultado.mensaje}`);
    return resultado.activo;

  } catch (error) {
    console.error('Error verificando estado:', error.message);
    return false;
  }
}

// Si se ejecuta directamente desde línea de comandos
if (import.meta.url === `file://${process.argv[1]}`) {
  const comando = process.argv[2];
  const argumento = process.argv[3];

  if (!comando || (comando !== 'subir' && comando !== 'descargar' && comando !== 'estado')) {
    console.error('Uso:');
    console.error('  node clienteIpfs.js subir <ruta-archivo>');
    console.error('  node clienteIpfs.js descargar <cid>');
    console.error('  node clienteIpfs.js estado');
    console.error('');
    console.error('Ejemplos:');
    console.error('  node clienteIpfs.js subir /home/usuario/documento.pdf');
    console.error('  node clienteIpfs.js descargar QmXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');
    console.error('  node clienteIpfs.js estado');
    process.exit(1);
  }

  try {
    if (comando === 'estado') {
      await verificarEstado();
      
    } else if (comando === 'subir') {
      if (!argumento) {
        console.error('Error: Se requiere la ruta del archivo para subir');
        process.exit(1);
      }
      
      console.log('Verificando estado del servicio...');
      const activo = await verificarEstado();
      
      if (!activo) {
        console.error('El servicio IPFS no está activo en el backend');
        process.exit(1);
      }

      console.log(`Subiendo archivo: ${argumento}`);
      const cid = await subirArchivoRemoto(path.resolve(argumento));
      
      console.log('\n✅ Archivo subido exitosamente');
      console.log(`CID: ${cid}`);
      
    } else if (comando === 'descargar') {
      if (!argumento) {
        console.error('Error: Se requiere el CID del archivo para descargar');
        process.exit(1);
      }
      
      console.log('Verificando estado del servicio...');
      const activo = await verificarEstado();
      
      if (!activo) {
        console.error('El servicio IPFS no está activo en el backend');
        process.exit(1);
      }

      console.log(`Descargando archivo con CID: ${argumento}`);
      await descargarArchivoRemoto(argumento);
      
      console.log('\n✅ Archivo descargado exitosamente');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}