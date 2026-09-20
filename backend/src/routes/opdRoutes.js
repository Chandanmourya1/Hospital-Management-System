import express from 'express';
import {
  registerOpdVisit,
  getOpdQueue,
  getAllOpdVisits,
  getOpdVisitById,
  getPatientVisitHistory,
  updateVitals,
  completeConsultation,
  scheduleFollowUpAppointment,
} from '../controllers/opdController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// OPD Triage & Walk-in Registration (Staff only)
router.post('/register', protect, authorize('receptionist', 'admin', 'doctor'), registerOpdVisit);

// Live Doctor/Department Outpatient Queue
router.get('/queue', protect, authorize('doctor', 'receptionist', 'admin'), getOpdQueue);

// Master OPD Ledger
router.get('/visits', protect, authorize('admin', 'receptionist', 'doctor'), getAllOpdVisits);

// Single Visit Record with Rx & Vitals
router.get('/visits/:id', protect, getOpdVisitById);

// Patient Outpatient Visit History
router.get('/patient/:patientId/history', protect, getPatientVisitHistory);

// Update Vitals during triage
router.put('/visits/:id/vitals', protect, authorize('receptionist', 'admin', 'doctor'), updateVitals);

// Doctor Consultation Completion & Digital Prescription Generation
router.post('/visits/:id/consultation', protect, authorize('doctor', 'admin'), completeConsultation);

// 1-Click Follow-up Appointment Scheduling
router.post('/visits/:id/follow-up-appointment', protect, scheduleFollowUpAppointment);

export default router;
