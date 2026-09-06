import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import adminRoutes from './adminRoutes.js';
import storeRoutes from './storeRoutes.js';
import ownerRoutes from './ownerRoutes.js';

const router = Router();

// ── Domain routers ────────────────────────────────────────────────────────────

router.use('/health',  healthRoutes);
router.use('/auth',    authRoutes);
router.use('/admin',   adminRoutes);
router.use('/stores',  storeRoutes);
router.use('/owner',   ownerRoutes);

export default router;

