import express from 'express';
import {
  getAvailableSlots,
  bookAppointment,
  getAllAppointments,
  getMyPatientAppointments,
  getDoctorSchedule,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  sendAppointmentReminder,
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Real-time available slot exploration (Public / Authenticated)
router.get('/available-slots', getAvailableSlots);

// Patient specific appointments
router.get('/my-appointments', protect, authorize('patient'), getMyPatientAppointments);

// Doctor consulting schedule
router.get('/doctor-schedule', protect, authorize('doctor'), getDoctorSchedule);

// Staff appointment management (Admin, Receptionist, Doctor)
router.get('/', protect, authorize('admin', 'receptionist', 'doctor'), getAllAppointments);

// Single appointment lookup
router.get('/:id', protect, getAppointmentById);

// Booking (Patient self-booking, or Receptionist/Admin on behalf of patient)
router.post('/', protect, authorize('patient', 'receptionist', 'admin'), bookAppointment);

// Rescheduling (Patient self or Staff)
router.put('/:id/reschedule', protect, authorize('patient', 'receptionist', 'admin'), rescheduleAppointment);

// Cancellation (Patient self or Staff)
router.put('/:id/cancel', protect, authorize('patient', 'receptionist', 'admin'), cancelAppointment);

// Doctor / Staff status updates (Completed, No Show, In Consultation)
router.put('/:id/status', protect, authorize('doctor', 'receptionist', 'admin'), updateAppointmentStatus);

// Dispatch appointment reminder notification
router.post('/:id/reminder', protect, authorize('doctor', 'receptionist', 'admin'), sendAppointmentReminder);

export default router;
