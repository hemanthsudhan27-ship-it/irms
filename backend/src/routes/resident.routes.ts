import { Router } from 'express';
import { ResidentController } from '../controllers/resident.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles, enforceComplexScope } from '../middlewares/role.middleware.js';

const router = Router();
const residentController = new ResidentController();

router.use(authenticate);

router.get('/', authorizeRoles('super_admin', 'complex_admin'), residentController.getAll);
router.get('/:id', authorizeRoles('super_admin', 'complex_admin'), residentController.getById);
router.post('/', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, residentController.create);
router.put('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, residentController.update);
router.patch('/:id/move-out', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, residentController.moveOut);
router.delete('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, residentController.delete);

export default router;
