import { Router } from 'express';
import { UnitController } from '../controllers/unit.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles, enforceComplexScope } from '../middlewares/role.middleware.js';

const router = Router();
const unitController = new UnitController();

router.use(authenticate);

router.get('/floor/:floorId', authorizeRoles('super_admin', 'complex_admin'), unitController.getByFloor);
router.get('/complex/:complexId', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, unitController.getByComplex);
router.get('/:id', authorizeRoles('super_admin', 'complex_admin'), unitController.getById);
router.post('/', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, unitController.create);
router.put('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, unitController.update);
router.delete('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, unitController.delete);

export default router;
