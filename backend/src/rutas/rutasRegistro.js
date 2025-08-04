import { Router } from 'express';
import { verificarCredencialesVotante } from '../middlewares/mwCredenciales.js';
import { controladorRegistro } from '../controladores/controladorRegistro.js';

const router = Router();

router.use(verificarCredencialesVotante);

// Listar todos los registros
// router.get('/', async (req, res) => {
//   const registros = await registroDAO.listar(req.bd);
//   res.json(registros);
// });

// Obtener un registro por ID
router.get('/:idEleccion', controladorRegistro.obtenerRegistroVotanteEleccion);
router.put('/:idEleccion', controladorRegistro.crearRegistroVotanteEleccion);

// Crear un nuevo registro
// router.post('/', async (req, res) => {
//   const nuevo = await registroDAO.crear(req.bd, req.body);
//   res.status(201).json(nuevo);
// });

// Actualizar un registro existente
// router.put('/:id', async (req, res) => {
//   const actualizado = await registroDAO.actualizar(req.bd, req.params.id, req.body);
//   if (!actualizado) return res.status(404).json({ error: 'No encontrado' });
//   res.json(actualizado);
// });

// Eliminar un registro
// router.delete('/:id', async (req, res) => {
//   const eliminado = await registroDAO.eliminar(req.bd, req.params.id);
//   if (!eliminado) return res.status(404).json({ error: 'No encontrado' });
//   res.json({ ok: true });
// });

export const rutasRegistro = router;