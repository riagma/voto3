import { Router } from 'express';
import { controladorAlgorand } from '../controladores/controladorAlgorand.js';

const router = Router();

router.get('/config', controladorAlgorand.obtenerConfiguracionAlgorand);

export const rutasAlgorand = router;