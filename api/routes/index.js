import { Router } from 'express';
import workcardsRoutes from './workcards.routes.js';
import inventoryRoutes from './inventory.routes.js';
import equipmentRoutes from './equipment.routes.js';
import capaRoutes from './capa.routes.js';
import analyzerRoutes from './analyzer.routes.js';
import qbwcRoutes from './qbwc.routes.js';
import logsRoutes from './logs.routes.js';
import backupRoutes from './backup.routes.js';

const apiRouter = Router();

// Mount all modular routes
apiRouter.use(workcardsRoutes);
apiRouter.use(inventoryRoutes);
apiRouter.use(equipmentRoutes);
apiRouter.use(capaRoutes);
apiRouter.use(analyzerRoutes);
apiRouter.use(qbwcRoutes);
apiRouter.use(logsRoutes);
apiRouter.use(backupRoutes);

export default apiRouter;
