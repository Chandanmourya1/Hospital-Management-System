import express from 'express';
import {
  register,
  login,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword,
  logout,
  registerStaff,
  getStaffList,
  getSystemSetupStatus,
  removeStaff,
  toggleStaffStatus,
} from '../controllers/authController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from '../middleware/validate.js';

const router = express.Router();

// Public auth routes (optionalAuth allows admin bearer token to be recognized for role assignment)
router.get('/setup-status', getSystemSetupStatus);
router.post('/register', optionalAuth, validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.put('/reset-password/:token', validateResetPassword, resetPassword);
router.post('/logout', logout);

// Authenticated routes
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

// Super Admin Staff Management routes
router.get('/staff', protect, authorize('admin'), getStaffList);
router.post('/staff', protect, authorize('admin'), validateRegister, registerStaff);
router.delete('/staff/:id', protect, authorize('admin'), removeStaff);
router.patch('/staff/:id/status', protect, authorize('admin'), toggleStaffStatus);

// Role-based verification test routes (Demonstrates RBAC for B.Tech Viva)
router.get('/test/patient-only', protect, authorize('patient'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the Patient exclusive route!' });
});

router.get('/test/doctor-only', protect, authorize('doctor'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the Doctor exclusive route!' });
});

router.get('/test/receptionist-only', protect, authorize('receptionist'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the Receptionist exclusive route!' });
});

router.get('/test/admin-only', protect, authorize('admin'), (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the Super Admin exclusive route!' });
});

export default router;
