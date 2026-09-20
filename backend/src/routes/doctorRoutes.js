import express from 'express';
import {
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  createDoctor,
  updateDoctor,
  updateSchedule,
  updateAvailability,
  deleteDoctor,
  getDepartments,
} from '../controllers/doctorController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public / Specialist Exploration routes
router.get('/departments', getDepartments);
router.get('/', getDoctors);

// Authenticated Doctor self-profile
router.get('/me', protect, authorize('doctor'), getMyDoctorProfile);

// Single Doctor Detail
router.get('/:id', getDoctorById);

// Admin Management
router.post('/', protect, authorize('admin'), createDoctor);
router.delete('/:id', protect, authorize('admin'), deleteDoctor);

// Profile & Clinical Schedule Updates (Doctor or Admin)
router.put('/:id', protect, authorize('doctor', 'admin'), updateDoctor);
router.put('/:id/schedule', protect, authorize('doctor', 'admin'), updateSchedule);
router.put('/:id/availability', protect, authorize('doctor', 'admin'), updateAvailability);

export default router;
