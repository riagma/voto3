import { Router } from 'express';
import { mwBaseDatos } from '../middlewares/mwBaseDatos.js';
import { mwExcepcion } from '../middlewares/mwExcepcion.js';

import { rutasVotante } from './rutasVotante.js';
import { rutasEleccion } from './rutasEleccion.js';
import { rutasRegistro } from './rutasRegistro.js';
import { rutasPapeleta } from './rutasPapeleta.js';
import { rutasAlgorand } from './rutasAlgorand.js';

import { rutasIpfs } from './rutasIpfs.js';

const router = Router();

router.use(mwBaseDatos);

router.use('/votante', rutasVotante); 

router.use('/eleccion', rutasEleccion);
router.use('/registro', rutasRegistro);
router.use('/papeleta', rutasPapeleta);
router.use('/algorand', rutasAlgorand);

router.use('/ipfs', rutasIpfs);

router.use((peticion, respuesta, siguiente) => {
  respuesta.status(404).json({
    error: 'API endpoint no encontrado',
    ruta: peticion.originalUrl
  });
});

router.use(mwExcepcion);

export const rutasApi = router;