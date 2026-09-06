/**
 * src/controllers/adminController.js
 * Responsibility: Handle HTTP concerns for Admin routes.
 *
 * Rules:
 *   - No business logic here — delegate everything to adminService.
 *   - No role checks here — authorizeRoles middleware handles that upstream.
 *   - No Prisma queries here — service layer owns database access.
 */

import * as adminService from '../services/adminService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/admin/dashboard
 * Middleware chain: protect → authorizeRoles('ADMIN') → this handler
 */
export const getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboard();
    sendSuccess(res, data, 200, 'Admin dashboard statistics retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/users
 * Middleware chain: protect → authorizeRoles('ADMIN') → validateAdminCreateUser → this handler
 */
export const createUser = async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body);
    sendSuccess(res, { user }, 201, 'User created successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * Middleware chain: protect → authorizeRoles('ADMIN') → validateListUsers → this handler
 */
export const listUsers = async (req, res, next) => {
  try {
    const result = await adminService.listUsers(req.query);
    sendSuccess(res, result, 200, 'Users retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users/:id
 * Middleware chain: protect → authorizeRoles('ADMIN') → validateUuidParam → this handler
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    sendSuccess(res, { user }, 200, 'User details retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/stores
 * Middleware chain: protect → authorizeRoles('ADMIN') → validateAdminCreateStore → this handler
 */
export const createStore = async (req, res, next) => {
  try {
    const store = await adminService.createStore(req.body);
    sendSuccess(res, { store }, 201, 'Store created successfully.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/stores
 * Middleware chain: protect → authorizeRoles('ADMIN') → validateListStores → this handler
 */
export const listStores = async (req, res, next) => {
  try {
    const result = await adminService.listStores(req.query);
    sendSuccess(res, result, 200, 'Stores retrieved successfully.');
  } catch (err) {
    next(err);
  }
};
