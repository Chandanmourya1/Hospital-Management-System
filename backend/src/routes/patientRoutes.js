import express from 'express';
import {
  getPatients,
  getMyPatientProfile,
  getPatientById,
  createPatient,
  updatePatient,
  addMedicalHistory,
  deleteMedicalHistory,
  addAllergy,
  deleteAllergy,
} from '../controllers/patientController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Self-profile route (Patient only)
router.get('/me', protect, authorize('patient'), getMyPatientProfile);

// Patient Directory & Registration
router.get('/', protect, authorize('admin', 'doctor', 'receptionist', 'pharmacist', 'lab_technician'), getPatients);
router.post('/', protect, authorize('admin', 'receptionist'), createPatient);

// Patient Details & Updates (Staff or Self)
router.get('/:id', protect, getPatientById);
router.put('/:id', protect, updatePatient);

// Clinical Subdocuments: Medical History (Doctor, Admin)
router.post('/:id/medical-history', protect, authorize('doctor', 'admin'), addMedicalHistory);
router.delete('/:id/medical-history/:historyId', protect, authorize('doctor', 'admin'), deleteMedicalHistory);

// Clinical Subdocuments: Allergies (Doctor, Receptionist for intake, Admin)
router.post('/:id/allergies', protect, authorize('doctor', 'receptionist', 'admin'), addAllergy);
router.delete('/:id/allergies/:allergyId', protect, authorize('doctor', 'admin'), deleteAllergy);

export default router;
