import { Router } from 'express';
import { FloorController } from '../controllers/floor.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles, enforceComplexScope } from '../middlewares/role.middleware.js';

const router = Router();
const floorController = new FloorController();

router.use(authenticate);

router.get('/complex/:complexId', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, floorController.getByComplex);
router.get('/:id', authorizeRoles('super_admin', 'complex_admin'), floorController.getById);
router.post('/', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, floorController.create);
router.put('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, floorController.update);
router.delete('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, floorController.delete);

export default router;
