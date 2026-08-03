import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();
const dashboardController = new DashboardController();

router.use(authenticate);

router.get('/super-admin', authorizeRoles('super_admin'), dashboardController.getSuperAdminStats);
router.get('/complex-admin', authorizeRoles('complex_admin', 'super_admin'), dashboardController.getComplexAdminStats);

export default router;
