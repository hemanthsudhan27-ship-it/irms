import { Router } from 'express';
import { ActivityLogController } from '../controllers/activity-log.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = Router();
const activityLogController = new ActivityLogController();

router.use(authenticate);

router.get('/', authorizeRoles('super_admin', 'complex_admin'), activityLogController.getLogs);

export default router;
