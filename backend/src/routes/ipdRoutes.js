import express from 'express';
import {
  getWardBedMatrix,
  getAllWardRooms,
  updateBedStatus,
  admitPatient,
  getActiveInpatients,
  getAllAdmissions,
  getAdmissionById,
  transferBed,
  addDoctorRound,
  addNursingRecord,
  dischargePatient,
} from '../controllers/ipdController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Ward & Bed Management Routes
router.get('/beds/matrix', protect, authorize('doctor', 'receptionist', 'admin'), getWardBedMatrix);
router.get('/beds/rooms', protect, authorize('doctor', 'receptionist', 'admin'), getAllWardRooms);
router.put('/beds/:roomId/:bedNumber/status', protect, authorize('doctor', 'receptionist', 'admin'), updateBedStatus);

// Inpatient Admission Routes
router.post('/admit', protect, authorize('receptionist', 'doctor', 'admin'), admitPatient);
router.get('/admissions/active', protect, authorize('doctor', 'receptionist', 'admin'), getActiveInpatients);
router.get('/admissions', protect, authorize('doctor', 'receptionist', 'admin'), getAllAdmissions);
router.get('/admissions/:id', protect, getAdmissionById);

// Clinical Encounter, Nursing & Transfer Routes
router.post('/admissions/:id/transfer-bed', protect, authorize('receptionist', 'doctor', 'admin'), transferBed);
router.post('/admissions/:id/rounds', protect, authorize('doctor', 'admin'), addDoctorRound);
router.post('/admissions/:id/nursing', protect, authorize('receptionist', 'doctor', 'admin'), addNursingRecord);
router.post('/admissions/:id/discharge', protect, authorize('doctor', 'admin'), dischargePatient);

export default router;
