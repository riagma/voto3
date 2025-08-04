import { Router } from 'express';
import { rutasRegistro } from './rutasRegistro.js';
import { verificarTokenVotante } from '../middlewares/mwAutenticacion.js';
import { controladorVotante } from '../controladores/controladorVotante.js';
import { validarEsquema } from '../middlewares/mwValidacion.js';
import { esquemaRegistroVotanteEleccionPeticion } from '../tipos/esquemas.js';
import { verificarCredencialesVotante } from '../middlewares/mwCredenciales.js';

const router = Router();

router.use(verificarCredencialesVotante);

// Rutas del votante
router.get('/', controladorVotante.obtenerDatosVotante);

// router.get('/elecciones', controladorVotante.obtenerEleccionesDisponibles);
// router.get('/elecciones/:idEleccion', controladorVotante.obtenerEleccionPorId);
// router.get('/elecciones/:idEleccion/partidos', controladorVotante.obtenerPartidosEleccion);
// router.get('/elecciones/:idEleccion/resultados', controladorVotante.obtenerResultadosEleccion);
// router.get('/elecciones/:idEleccion/contrato', controladorVotante.obtenerRegistroVotanteEleccion);

// router.post(
//   '/elecciones/:idEleccion/registro',
//   validarEsquema(esquemaRegistroVotanteEleccionPeticion),
//   controladorVotante.registrarseEnEleccion
// );

// router.delete('/elecciones/:idEleccion/registro', controladorVotante.anularRegistroEnEleccion);

export const rutasVotante = router;