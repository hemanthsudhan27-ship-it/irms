import { Router } from 'express';
import { ComplexController } from '../controllers/complex.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles, enforceComplexScope } from '../middlewares/role.middleware.js';

const router = Router();
const complexController = new ComplexController();

// Apply Authentication for all routes
router.use(authenticate);

// Complex Admin self-management routes
router.get('/my-complex', authorizeRoles('complex_admin', 'super_admin'), complexController.getMyComplex);
router.put('/my-complex', authorizeRoles('complex_admin', 'super_admin'), complexController.updateMyComplex);

// Super Admin Management routes
router.get('/', authorizeRoles('super_admin'), complexController.getAll);
router.post('/', authorizeRoles('super_admin'), complexController.create);
router.get('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, complexController.getById);
router.put('/:id', authorizeRoles('super_admin', 'complex_admin'), enforceComplexScope, complexController.update);
router.patch('/:id/rename', authorizeRoles('super_admin'), complexController.rename);
router.delete('/:id', authorizeRoles('super_admin'), complexController.delete);
router.post('/:id/assign-admin', authorizeRoles('super_admin'), complexController.assignAdmin);

export default router;
