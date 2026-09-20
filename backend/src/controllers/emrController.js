import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import MedicalDocument from '../models/MedicalDocument.js';
import OpdVisit from '../models/OpdVisit.js';
import IpdAdmission from '../models/IpdAdmission.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper to resolve patient User and PatientProfile
 */
const resolvePatient = async (patientIdentifier, reqUser = null) => {
  let patientUser = null;
  let patientProfile = null;

  if (!patientIdentifier) return { patientUser: null, patientProfile: null };

  if ((patientIdentifier === 'me' || patientIdentifier === 'self') && reqUser) {
    patientUser = await User.findById(reqUser._id);
    if (patientUser) {
      patientProfile = await PatientProfile.findOne({ user: patientUser._id });
    }
  } else if (mongoose.Types.ObjectId.isValid(patientIdentifier)) {
    // Could be User._id or PatientProfile._id
    patientUser = await User.findById(patientIdentifier);
    if (patientUser) {
      patientProfile = await PatientProfile.findOne({ user: patientUser._id });
    } else {
      patientProfile = await PatientProfile.findById(patientIdentifier);
      if (patientProfile) {
        patientUser = await User.findById(patientProfile.user);
      }
    }
  } else {
    // Could be human-readable patientId e.g. PAT-1001
    patientProfile = await PatientProfile.findOne({ patientId: patientIdentifier });
    if (patientProfile) {
      patientUser = await User.findById(patientProfile.user);
    }
  }

  // Auto-heal missing patientProfile or missing patientId
  if (patientUser && !patientProfile) {
    const newPatientId = await PatientProfile.generatePatientId();
    patientProfile = await PatientProfile.create({
      user: patientUser._id,
      patientId: newPatientId,
      bloodGroup: 'Unknown',
    });
  } else if (patientProfile && !patientProfile.patientId) {
    patientProfile.patientId = await PatientProfile.generatePatientId();
    await patientProfile.save();
  }

  return { patientUser, patientProfile };
};

/**
 * Check if the requesting user is allowed to view/access the target patient's EMR
 */
const checkPatientAccess = (req, targetUserId) => {
  if (!req.user) return false;
  if (
    req.user.role === 'admin' ||
    req.user.role === 'doctor' ||
    req.user.role === 'receptionist' ||
    req.user.role === 'lab_technician'
  ) {
    return true;
  }
  // Patient can only view their own EMR
  if (req.user.role === 'patient' && req.user._id.toString() === targetUserId.toString()) {
    return true;
  }
  return false;
};

/**
 * Format doctor name ensuring no duplicate 'Dr.' prefix
 */
const formatDoctorName = (name, fallback = 'Consultant Physician') => {
  if (!name) return fallback;
  return name.trim().startsWith('Dr.') ? name.trim() : `Dr. ${name.trim()}`;
};

/**
 * @desc    Get complete EMR clinical summary & statistics for a patient
 * @route   GET /api/v1/emr/patients/:patientId/overview
 * @access  Private (Doctor, Receptionist, Admin, Patient [self])
 */
export const getPatientEmrOverview = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { patientUser, patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientUser || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient medical profile not found.',
      });
    }

    if (!checkPatientAccess(req, patientUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this patient EMR record.',
      });
    }

    // Aggregate counts & recent documents in parallel
    const [documentsCount, testReportsCount, abnormalReportsCount, opdVisitsCount, ipdAdmissionsCount] =
      await Promise.all([
        MedicalDocument.countDocuments({ patient: patientUser._id }),
        MedicalDocument.countDocuments({
          patient: patientUser._id,
          documentType: { $in: ['Diagnostic Report', 'Pathology / Lab', 'Radiology / Scan'] },
        }),
        MedicalDocument.countDocuments({
          patient: patientUser._id,
          isAbnormal: true,
        }),
        OpdVisit.countDocuments({ patient: patientUser._id }),
        IpdAdmission.countDocuments({ patient: patientUser._id }),
      ]);

    // Active diagnoses count
    const activeDiagnosesCount = (patientProfile.medicalHistory || []).filter(
      (m) => m.status === 'Active' || m.status === 'Chronic'
    ).length;

    // Treatments count
    const treatmentsCount = (patientProfile.treatments || []).length;

    // Recent test reports
    const recentReports = await MedicalDocument.find({
      patient: patientUser._id,
    })
      .populate('doctor', 'name')
      .sort({ documentDate: -1 })
      .limit(5);

    // Recent OPD Prescriptions & Inpatient Discharge Meds for active medications
    const recentOpdVisitsWithRx = await OpdVisit.find({
      patient: patientUser._id,
      'prescription.prescriptionId': { $exists: true, $ne: null },
    })
      .populate('doctor', 'name')
      .sort({ visitDate: -1 })
      .limit(3);

    const activeMedications = [];
    recentOpdVisitsWithRx.forEach((v) => {
      if (v.prescription && v.prescription.medications) {
        v.prescription.medications.forEach((m) => {
          activeMedications.push({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
            prescribedBy: formatDoctorName(v.doctor?.name),
            date: v.prescription.issuedAt || v.visitDate,
            source: `OPD (${v.visitId})`,
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      patient: {
        _id: patientUser._id,
        name: patientUser.name,
        email: patientUser.email,
        phone: patientUser.phone,
        gender: patientUser.gender,
        dateOfBirth: patientUser.dateOfBirth,
        address: patientUser.address,
      },
      profile: {
        _id: patientProfile._id,
        patientId: patientProfile.patientId,
        bloodGroup: patientProfile.bloodGroup,
        maritalStatus: patientProfile.maritalStatus,
        occupation: patientProfile.occupation,
        allergies: patientProfile.allergies,
        medicalHistory: patientProfile.medicalHistory,
        treatments: patientProfile.treatments || [],
        emergencyContact: patientProfile.emergencyContact,
        insurance: patientProfile.insurance,
      },
      stats: {
        activeDiagnosesCount,
        treatmentsCount,
        documentsCount,
        testReportsCount,
        abnormalReportsCount,
        opdVisitsCount,
        ipdAdmissionsCount,
      },
      recentReports,
      activeMedications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete longitudinal health timeline (unifying OPD, IPD, lab reports, treatments)
 * @route   GET /api/v1/emr/patients/:patientId/timeline
 * @access  Private (Doctor, Receptionist, Admin, Patient [self])
 */
export const getPatientTimeline = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { type = 'all' } = req.query;
    const { patientUser, patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientUser || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    if (!checkPatientAccess(req, patientUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this timeline.',
      });
    }

    const timeline = [];

    // 1. Fetch OPD Visits
    if (type === 'all' || type === 'opd') {
      const opdVisits = await OpdVisit.find({ patient: patientUser._id })
        .populate('doctor', 'name')
        .populate('doctorProfile', 'department specialization roomNumber')
        .sort({ visitDate: -1 });

      opdVisits.forEach((visit) => {
        timeline.push({
          id: visit._id,
          category: 'OPD Visit',
          date: visit.visitDate,
          title: `OPD Consultation — ${visit.department || 'General Medicine'}`,
          badge: visit.status,
          doctorName: visit.doctor?.name ? `Dr. ${visit.doctor.name}` : 'Attending Physician',
          code: visit.visitId,
          tokenNumber: visit.tokenNumber,
          details: {
            chiefComplaints: visit.chiefComplaints,
            diagnosis: visit.examinationNotes?.diagnosis || 'Consultation conducted',
            vitals: visit.vitals,
            prescriptionId: visit.prescription?.prescriptionId || null,
          },
          linkUrl: visit.prescription?.prescriptionId ? `/opd/prescription/${visit._id}` : null,
        });
      });
    }

    // 2. Fetch IPD Hospital Admissions
    if (type === 'all' || type === 'ipd') {
      const ipdAdmissions = await IpdAdmission.find({ patient: patientUser._id })
        .populate('attendingDoctor', 'name')
        .sort({ admissionDate: -1 });

      ipdAdmissions.forEach((adm) => {
        timeline.push({
          id: adm._id,
          category: 'IPD Inpatient',
          date: adm.admissionDate,
          title: `Hospital Admission — ${adm.department} (${adm.bedAllocation?.roomNumber} - ${adm.bedAllocation?.bedNumber})`,
          badge: adm.status,
          doctorName: adm.attendingDoctor?.name ? `Dr. ${adm.attendingDoctor.name}` : 'Attending Physician',
          code: adm.admissionId,
          details: {
            admissionType: adm.admissionType,
            provisionalDiagnosis: adm.provisionalDiagnosis,
            finalDiagnosis: adm.dischargeDetails?.finalDiagnosis || null,
            ward: adm.bedAllocation?.wardName,
            dischargeDate: adm.dischargeDetails?.dischargeDate || null,
            totalDaysStay: adm.dischargeDetails?.billingSummary?.totalDays || null,
          },
          linkUrl: `/ipd/admissions/${adm._id}`,
        });
      });
    }

    // 3. Fetch Diagnostic Test Reports & Uploaded Documents
    if (type === 'all' || type === 'reports' || type === 'documents') {
      let docQuery = { patient: patientUser._id };
      if (type === 'reports') {
        docQuery.documentType = { $in: ['Diagnostic Report', 'Pathology / Lab', 'Radiology / Scan'] };
      } else if (type === 'documents') {
        docQuery.documentType = { $nin: ['Diagnostic Report', 'Pathology / Lab', 'Radiology / Scan'] };
      }

      const docs = await MedicalDocument.find(docQuery)
        .populate('doctor', 'name')
        .sort({ documentDate: -1 });

      docs.forEach((d) => {
        timeline.push({
          id: d._id,
          category: d.documentType.includes('Report') || d.documentType.includes('Lab') || d.documentType.includes('Scan')
            ? 'Diagnostic Report'
            : 'Medical Document',
          date: d.documentDate,
          title: d.title,
          badge: d.isAbnormal ? 'Abnormal / Critical' : d.category,
          isAbnormal: d.isAbnormal,
          doctorName: d.doctor?.name ? formatDoctorName(d.doctor.name) : d.facility,
          details: {
            documentType: d.documentType,
            category: d.category,
            findings: d.findings,
            facility: d.facility,
            fileUrl: d.fileUrl,
            fileName: d.fileName,
            fileSize: d.fileSize,
          },
          fileUrl: d.fileUrl,
        });
      });
    }

    // 4. Fetch Diagnoses & Medical History entries
    if (type === 'all' || type === 'diagnoses') {
      (patientProfile.medicalHistory || []).forEach((diag) => {
        timeline.push({
          id: diag._id,
          category: 'Diagnosis',
          date: diag.diagnosisDate || diag.createdAt,
          title: `Documented Condition: ${diag.condition}`,
          badge: diag.status,
          details: {
            condition: diag.condition,
            status: diag.status,
            notes: diag.notes,
          },
        });
      });
    }

    // 5. Fetch Treatments & Surgical Procedures
    if (type === 'all' || type === 'treatments') {
      (patientProfile.treatments || []).forEach((tr) => {
        timeline.push({
          id: tr._id,
          category: 'Treatment & Procedure',
          date: tr.startDate || tr.createdAt,
          title: `${tr.treatmentType}: ${tr.treatmentName}`,
          badge: tr.outcome,
          details: {
            treatmentName: tr.treatmentName,
            treatmentType: tr.treatmentType,
            outcome: tr.outcome,
            endDate: tr.endDate,
            notes: tr.notes,
            department: tr.department,
          },
        });
      });
    }

    // Sort all timeline events descending (most recent first)
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      count: timeline.length,
      timeline,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload medical document or diagnostic test report with file
 * @route   POST /api/v1/emr/patients/:patientId/documents
 * @access  Private (Staff, Doctor, Patient [self])
 */
export const uploadMedicalDocument = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { patientUser, patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientUser || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    if (!checkPatientAccess(req, patientUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to upload documents for this patient.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please attach a document or test report file to upload.',
      });
    }

    const {
      title,
      documentType = 'Diagnostic Report',
      category = 'General',
      documentDate,
      facility = 'MedCare Multi-Speciality Hospital',
      doctorId,
      findings = '',
      isAbnormal = false,
      abnormalDetails = '',
      tags = '',
      notes = '',
    } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Document / test report title is required.',
      });
    }

    const relativeFileUrl = `/uploads/emr/${req.file.filename}`;
    const parsedTags = Array.isArray(tags)
      ? tags
      : tags
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const newDoc = await MedicalDocument.create({
      patient: patientUser._id,
      patientProfile: patientProfile._id,
      title: title.trim(),
      documentType,
      category,
      documentDate: documentDate ? new Date(documentDate) : new Date(),
      facility: facility.trim(),
      doctor: mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null,
      fileUrl: relativeFileUrl,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      findings: findings.trim(),
      isAbnormal: isAbnormal === 'true' || isAbnormal === true,
      abnormalDetails: abnormalDetails.trim(),
      tags: parsedTags,
      notes: notes.trim(),
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Medical document / test report uploaded successfully.',
      document: newDoc,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get patient documents & test reports with filtering
 * @route   GET /api/v1/emr/patients/:patientId/documents
 * @access  Private (Doctor, Receptionist, Admin, Patient [self])
 */
export const getPatientDocuments = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { category, documentType, isAbnormal, search } = req.query;
    const { patientUser } = await resolvePatient(patientId, req.user);

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    if (!checkPatientAccess(req, patientUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this patient documents.',
      });
    }

    let query = { patient: patientUser._id };

    if (category && category !== 'All') {
      query.category = category;
    }
    if (documentType && documentType !== 'All') {
      query.documentType = documentType;
    }
    if (isAbnormal === 'true') {
      query.isAbnormal = true;
    }
    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ title: regex }, { findings: regex }, { facility: regex }, { notes: regex }];
    }

    const documents = await MedicalDocument.find(query)
      .populate('doctor', 'name email')
      .populate('uploadedBy', 'name role')
      .sort({ documentDate: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single medical document by ID
 * @route   GET /api/v1/emr/documents/:id
 * @access  Private
 */
export const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await MedicalDocument.findById(id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name')
      .populate('uploadedBy', 'name role');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found.',
      });
    }

    if (!checkPatientAccess(req, document.patient._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this document.',
      });
    }

    res.status(200).json({
      success: true,
      document,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete medical document and remove file from disk
 * @route   DELETE /api/v1/emr/documents/:id
 * @access  Private (Doctor, Admin, or Uploader)
 */
export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const document = await MedicalDocument.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.',
      });
    }

    // Permission check: only admin, doctor, or original uploader can delete
    const isOwner = document.uploadedBy.toString() === req.user._id.toString();
    const isStaff = req.user.role === 'admin' || req.user.role === 'doctor';
    if (!isOwner && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this medical document.',
      });
    }

    // Attempt to remove physical file from disk
    if (document.fileUrl) {
      const diskPath = path.join(__dirname, '../../', document.fileUrl);
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch (unlinkErr) {
          console.error('Error removing document file from disk:', unlinkErr);
        }
      }
    }

    await MedicalDocument.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Medical document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add clinical diagnosis to patient's medical history
 * @route   POST /api/v1/emr/patients/:patientId/diagnoses
 * @access  Private (Doctor, Admin)
 */
export const addDiagnosis = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { condition, status = 'Active', diagnosisDate, notes = '' } = req.body;
    const { patientUser, patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientUser || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    if (!condition || condition.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Condition / diagnosis name is required.',
      });
    }

    patientProfile.medicalHistory.push({
      condition: condition.trim(),
      status,
      diagnosisDate: diagnosisDate ? new Date(diagnosisDate) : new Date(),
      notes: notes.trim(),
      recordedBy: req.user._id,
    });

    await patientProfile.save();

    res.status(201).json({
      success: true,
      message: 'Diagnosis logged successfully.',
      medicalHistory: patientProfile.medicalHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update clinical diagnosis record
 * @route   PUT /api/v1/emr/patients/:patientId/diagnoses/:diagnosisId
 * @access  Private (Doctor, Admin)
 */
export const updateDiagnosis = async (req, res, next) => {
  try {
    const { patientId, diagnosisId } = req.params;
    const { status, notes, condition } = req.body;
    const { patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const diag = patientProfile.medicalHistory.id(diagnosisId);
    if (!diag) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis record not found.',
      });
    }

    if (status) diag.status = status;
    if (notes !== undefined) diag.notes = notes.trim();
    if (condition) diag.condition = condition.trim();

    await patientProfile.save();

    res.status(200).json({
      success: true,
      message: 'Diagnosis record updated.',
      diagnosis: diag,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete clinical diagnosis record
 * @route   DELETE /api/v1/emr/patients/:patientId/diagnoses/:diagnosisId
 * @access  Private (Doctor, Admin)
 */
export const deleteDiagnosis = async (req, res, next) => {
  try {
    const { patientId, diagnosisId } = req.params;
    const { patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const diag = patientProfile.medicalHistory.id(diagnosisId);
    if (!diag) {
      return res.status(404).json({
        success: false,
        message: 'Diagnosis record not found.',
      });
    }

    patientProfile.medicalHistory.pull({ _id: diagnosisId });
    await patientProfile.save();

    res.status(200).json({
      success: true,
      message: 'Diagnosis record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record treatment, surgical procedure or therapy intervention
 * @route   POST /api/v1/emr/patients/:patientId/treatments
 * @access  Private (Doctor, Admin)
 */
export const addTreatment = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const {
      treatmentName,
      treatmentType = 'Medication Course',
      startDate,
      endDate,
      outcome = 'Ongoing',
      notes = '',
      department = '',
    } = req.body;

    const { patientUser, patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientUser || !patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    if (!treatmentName || treatmentName.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Treatment or surgical procedure name is required.',
      });
    }

    patientProfile.treatments = patientProfile.treatments || [];
    patientProfile.treatments.push({
      treatmentName: treatmentName.trim(),
      treatmentType,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      outcome,
      notes: notes.trim(),
      doctor: req.user._id,
      department: department.trim(),
    });

    await patientProfile.save();

    res.status(201).json({
      success: true,
      message: 'Treatment / surgical procedure documented successfully.',
      treatments: patientProfile.treatments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update treatment outcome or clinical progress notes
 * @route   PUT /api/v1/emr/patients/:patientId/treatments/:treatmentId
 * @access  Private (Doctor, Admin)
 */
export const updateTreatment = async (req, res, next) => {
  try {
    const { patientId, treatmentId } = req.params;
    const { outcome, endDate, notes } = req.body;
    const { patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const tr = patientProfile.treatments.id(treatmentId);
    if (!tr) {
      return res.status(404).json({
        success: false,
        message: 'Treatment record not found.',
      });
    }

    if (outcome) tr.outcome = outcome;
    if (endDate !== undefined) tr.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) tr.notes = notes.trim();

    await patientProfile.save();

    res.status(200).json({
      success: true,
      message: 'Treatment progress updated.',
      treatment: tr,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete treatment / procedure record
 * @route   DELETE /api/v1/emr/patients/:patientId/treatments/:treatmentId
 * @access  Private (Doctor, Admin)
 */
export const deleteTreatment = async (req, res, next) => {
  try {
    const { patientId, treatmentId } = req.params;
    const { patientProfile } = await resolvePatient(patientId, req.user);

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    const tr = patientProfile.treatments.id(treatmentId);
    if (!tr) {
      return res.status(404).json({
        success: false,
        message: 'Treatment record not found.',
      });
    }

    patientProfile.treatments.pull({ _id: treatmentId });
    await patientProfile.save();

    res.status(200).json({
      success: true,
      message: 'Treatment record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unified digital prescriptions repository (OPD + IPD discharge regimens)
 * @route   GET /api/v1/emr/patients/:patientId/prescriptions
 * @access  Private (Doctor, Receptionist, Admin, Patient [self])
 */
export const getPatientPrescriptions = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { search } = req.query;
    const { patientUser } = await resolvePatient(patientId, req.user);

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    if (!checkPatientAccess(req, patientUser._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this patient prescriptions.',
      });
    }

    const prescriptions = [];

    // 1. Fetch OPD Digital Prescriptions
    const opdVisitsWithRx = await OpdVisit.find({
      patient: patientUser._id,
      'prescription.prescriptionId': { $exists: true, $ne: null },
    })
      .populate('doctor', 'name')
      .populate('doctorProfile', 'department specialization roomNumber qualifications')
      .sort({ visitDate: -1 });

    opdVisitsWithRx.forEach((v) => {
      if (v.prescription && v.prescription.prescriptionId) {
        prescriptions.push({
          id: v._id,
          prescriptionId: v.prescription.prescriptionId,
          type: 'OPD Prescription',
          date: v.prescription.issuedAt || v.visitDate,
          doctor: {
            name: formatDoctorName(v.doctor?.name),
            department: v.department || 'General Medicine',
            specialization: v.doctorProfile?.specialization || '',
          },
          diagnosis: v.examinationNotes?.diagnosis || 'Outpatient Consultation',
          medications: v.prescription.medications || [],
          investigations: v.prescription.investigationsRecommended || [],
          dietaryAdvice: v.prescription.dietaryAdvice || '',
          generalNotes: v.prescription.generalNotes || '',
          viewUrl: `/opd/prescription/${v._id}`,
        });
      }
    });

    // 2. Fetch IPD Discharge Regimens
    const ipdAdmissionsWithRx = await IpdAdmission.find({
      patient: patientUser._id,
      'dischargeDetails.dischargeMedications.0': { $exists: true },
    })
      .populate('attendingDoctor', 'name')
      .sort({ 'dischargeDetails.dischargeDate': -1 });

    ipdAdmissionsWithRx.forEach((adm) => {
      const meds = (adm.dischargeDetails?.dischargeMedications || []).map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
      }));

      prescriptions.push({
        id: adm._id,
        prescriptionId: `${adm.admissionId}-RX`,
        type: 'IPD Discharge Medications',
        date: adm.dischargeDetails?.dischargeDate || adm.updatedAt,
        doctor: {
          name: formatDoctorName(adm.attendingDoctor?.name, 'Discharging Consultant'),
          department: adm.department,
        },
        diagnosis: adm.dischargeDetails?.finalDiagnosis || adm.provisionalDiagnosis,
        medications: meds,
        investigations: [],
        dietaryAdvice: adm.dischargeDetails?.dietaryAndActivityAdvice || '',
        generalNotes: adm.dischargeDetails?.courseInHospital || '',
        viewUrl: `/ipd/admissions/${adm._id}/discharge-summary`,
      });
    });

    // Filter by search drug name if provided
    let filtered = prescriptions;
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = prescriptions.filter(
        (rx) =>
          rx.prescriptionId.toLowerCase().includes(q) ||
          rx.diagnosis.toLowerCase().includes(q) ||
          rx.doctor.name.toLowerCase().includes(q) ||
          rx.medications.some((m) => m.name.toLowerCase().includes(q))
      );
    }

    // Sort descending by date
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      count: filtered.length,
      prescriptions: filtered,
    });
  } catch (error) {
    next(error);
  }
};
