import { Router } from 'express';
import { controladorPapeleta } from '../controladores/controladorPapeleta.js';

const router = Router();

router.put('/:idEleccion/registrar', controladorPapeleta.registrarSolicitudPapeleta);
router.put('/:idEleccion/solicitar', controladorPapeleta.completarSolicitudPapeleta);

export const rutasPapeleta = router;