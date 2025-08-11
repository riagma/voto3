import express from 'express';
import path from 'path';
import fs from 'node:fs';
import { subirArchivo, descargarArchivo, estaActivo } from '../utiles/servicioIpfs.js';

const router = express.Router();

/**
 * GET /api/ipfs/estado
 * Verifica si el servicio IPFS está activo
 */
router.get('/estado', (req, res) => {
  const respuesta = { 
    activo: estaActivo(),
    mensaje: estaActivo() ? 'IPFS activo' : 'IPFS inactivo'
  };
  console.log('Estado del servicio IPFS consultado:', respuesta);
  res.json(respuesta);
});

/**
 * POST /api/ipfs/subir
 * Sube un archivo a IPFS
 * Body: { rutaArchivo: "/ruta/completa/al/archivo" }
 */
router.post('/subir', async (req, res) => {
  try {
    const { rutaArchivo } = req.body;

    if (!rutaArchivo) {
      return res.status(400).json({ 
        error: 'Se requiere la ruta del archivo' 
      });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ 
        error: `Archivo no encontrado: ${rutaArchivo}` 
      });
    }

    // Verificar que es un archivo (no directorio)
    const stats = fs.statSync(rutaArchivo);
    if (!stats.isFile()) {
      return res.status(400).json({ 
        error: `La ruta no es un archivo válido: ${rutaArchivo}` 
      });
    }

    const cid = await subirArchivo(rutaArchivo);
    
    res.json({
      success: true,
      archivo: path.basename(rutaArchivo),
      rutaCompleta: rutaArchivo,
      cid: cid,
      tamaño: stats.size
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      detalle: error.message 
    });
  }
});

/**
 * POST /api/ipfs/descargar
 * Descarga un archivo de IPFS
 * Body: { cid: "QmXXXXXX" }
 */
router.post('/descargar', async (req, res) => {
  try {
    const { cid } = req.body;

    if (!cid) {
      return res.status(400).json({ 
        error: 'Se requiere el CID del archivo' 
      });
    }

    const contenido = await descargarArchivo(cid);
    
    // Convertir Uint8Array a Buffer para enviar
    const buffer = Buffer.from(contenido);
    
    res.json({
      success: true,
      cid: cid,
      tamaño: contenido.length,
      contenido: buffer.toString('base64') // Enviar como base64
    });

  } catch (error) {
    console.error('Error descargando archivo:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor', 
      detalle: error.message 
    });
  }
});

export const rutasIpfs = router;