import express from 'express';
import {
  getPatientEmrOverview,
  getPatientTimeline,
  uploadMedicalDocument,
  getPatientDocuments,
  getDocumentById,
  deleteDocument,
  addDiagnosis,
  updateDiagnosis,
  deleteDiagnosis,
  addTreatment,
  updateTreatment,
  deleteTreatment,
  getPatientPrescriptions,
} from '../controllers/emrController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadEmrDocument } from '../middleware/upload.js';

const router = express.Router();

// 1. Patient EMR Overview & Longitudinal Health Timeline
router.get('/patients/:patientId/overview', protect, getPatientEmrOverview);
router.get('/patients/:patientId/timeline', protect, getPatientTimeline);

// 2. Diagnostic Test Reports & Medical Documents Storage
router.get('/patients/:patientId/documents', protect, getPatientDocuments);
router.post(
  '/patients/:patientId/documents',
  protect,
  uploadEmrDocument.single('file'),
  uploadMedicalDocument
);
router.get('/documents/:id', protect, getDocumentById);
router.delete('/documents/:id', protect, deleteDocument);

// 3. Clinical Diagnoses
router.post('/patients/:patientId/diagnoses', protect, authorize('doctor', 'admin'), addDiagnosis);
router.put('/patients/:patientId/diagnoses/:diagnosisId', protect, authorize('doctor', 'admin'), updateDiagnosis);
router.delete('/patients/:patientId/diagnoses/:diagnosisId', protect, authorize('doctor', 'admin'), deleteDiagnosis);

// 4. Treatments & Surgical Procedures
router.post('/patients/:patientId/treatments', protect, authorize('doctor', 'admin'), addTreatment);
router.put('/patients/:patientId/treatments/:treatmentId', protect, authorize('doctor', 'admin'), updateTreatment);
router.delete('/patients/:patientId/treatments/:treatmentId', protect, authorize('doctor', 'admin'), deleteTreatment);

// 5. Unified Digital Prescriptions Repository
router.get('/patients/:patientId/prescriptions', protect, getPatientPrescriptions);

export default router;
