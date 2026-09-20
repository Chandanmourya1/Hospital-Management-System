import mongoose from 'mongoose';
import OpdVisit from '../models/OpdVisit.js';
import DoctorProfile from '../models/DoctorProfile.js';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { calculateDoctorSlots } from '../utils/slotHelper.js';

/**
 * Helper to compute BMI: weight (kg) / [height (m)]^2
 */
const calculateBmi = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
};

/**
 * @desc    Register a new Outpatient Department (OPD) visit / Walk-in triage check-in
 * @route   POST /api/v1/opd/register
 * @access  Private (Staff: Receptionist, Admin, Doctor)
 */
export const registerOpdVisit = async (req, res, next) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      chiefComplaints,
      symptomsDuration,
      vitals = {},
      consultationFee,
      billingStatus = 'Paid',
    } = req.body;

    if (!patientId || !doctorId || !chiefComplaints) {
      return res.status(400).json({
        success: false,
        message: 'Patient, Consulting Doctor, and Chief Complaints are required.',
      });
    }

    // Find Patient User & Profile
    let patientUser = null;
    let patientProfile = null;

    if (mongoose.Types.ObjectId.isValid(patientId)) {
      patientUser = await User.findById(patientId);
      if (patientUser) {
        patientProfile = await PatientProfile.findOne({ user: patientUser._id });
      }
    }

    if (!patientUser) {
      // Check if patientId is a PAT code (e.g. PAT-1001)
      patientProfile = await PatientProfile.findOne({ patientId }).populate('user');
      if (patientProfile) {
        patientUser = patientProfile.user;
      }
    }

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found.',
      });
    }

    // Find Doctor User & Profile
    let doctorProfile = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctorProfile = await DoctorProfile.findOne({
        $or: [{ _id: doctorId }, { user: doctorId }],
      }).populate('user');
    } else {
      doctorProfile = await DoctorProfile.findOne({ doctorId }).populate('user');
    }

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor record not found.',
      });
    }

    // Calculate BMI if height and weight are provided
    const weight = vitals.weight ? parseFloat(vitals.weight) : null;
    const height = vitals.height ? parseFloat(vitals.height) : null;
    const bmi = calculateBmi(weight, height);

    const enrichedVitals = {
      bloodPressure: vitals.bloodPressure || '',
      heartRate: vitals.heartRate ? parseInt(vitals.heartRate, 10) : null,
      temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
      respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate, 10) : null,
      spO2: vitals.spO2 ? parseInt(vitals.spO2, 10) : null,
      weight,
      height,
      bmi,
      recordedAt: new Date(),
    };

    const today = new Date();

    // Auto-generate Sequential Visit ID (OPD-1001) and Daily Queue Token
    const newVisitId = await OpdVisit.generateVisitId();
    const tokenNumber = await OpdVisit.getNextTokenNumber(doctorProfile.user._id, today);

    const opdVisit = await OpdVisit.create({
      visitId: newVisitId,
      tokenNumber,
      patient: patientUser._id,
      patientProfile: patientProfile?._id,
      doctor: doctorProfile.user._id,
      doctorProfile: doctorProfile._id,
      appointment: appointmentId || null,
      department: doctorProfile.department,
      visitDate: today,
      status: 'Waiting',
      vitals: enrichedVitals,
      chiefComplaints: chiefComplaints.trim(),
      symptomsDuration: symptomsDuration ? symptomsDuration.trim() : '',
      consultationFee: consultationFee || doctorProfile.consultationFee,
      billingStatus,
      recordedBy: req.user._id,
    });

    const populated = await OpdVisit.findById(opdVisit._id)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId specialization department roomNumber consultationFee')
      .populate('patientProfile', 'patientId bloodGroup allergies');

    res.status(201).json({
      success: true,
      message: `OPD Visit ${newVisitId} registered. Queue Token #${tokenNumber} assigned.`,
      visit: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live OPD consultation queue for a doctor / department
 * @route   GET /api/v1/opd/queue
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const getOpdQueue = async (req, res, next) => {
  try {
    const { doctorId, department, date, status } = req.query;

    let targetDoctorId = null;

    if (req.user.role === 'doctor') {
      targetDoctorId = req.user._id;
    } else if (doctorId) {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        const docProf = await DoctorProfile.findOne({
          $or: [{ _id: doctorId }, { user: doctorId }],
        });
        targetDoctorId = docProf ? docProf.user : doctorId;
      }
    }

    const queryDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    let query = {
      visitDate: { $gte: startOfDay, $lte: endOfDay },
    };

    if (targetDoctorId) query.doctor = targetDoctorId;
    if (department && department !== 'All') query.department = department;
    if (status && status !== 'All') query.status = status;

    const visits = await OpdVisit.find(query)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('doctor', 'name email')
      .populate('doctorProfile', 'doctorId specialization department roomNumber')
      .populate('patientProfile', 'patientId bloodGroup allergies')
      .sort({ tokenNumber: 1 });

    const totalInQueue = visits.length;
    const waitingCount = visits.filter((v) => v.status === 'Waiting').length;
    const inConsultationCount = visits.filter((v) => v.status === 'In Consultation').length;
    const completedCount = visits.filter((v) => v.status === 'Completed').length;

    res.status(200).json({
      success: true,
      count: visits.length,
      stats: {
        totalInQueue,
        waitingCount,
        inConsultationCount,
        completedCount,
      },
      queue: visits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get master OPD visits ledger with filters and search
 * @route   GET /api/v1/opd/visits
 * @access  Private (Staff: Admin, Receptionist, Doctor)
 */
export const getAllOpdVisits = async (req, res, next) => {
  try {
    const {
      doctor,
      patient,
      department,
      status,
      date,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let query = {};

    if (doctor) query.doctor = doctor;
    if (patient) query.patient = patient;
    if (department && department !== 'All') query.department = department;
    if (status && status !== 'All') query.status = status;

    if (date) {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateObj);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.visitDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { visitId: regex },
        { chiefComplaints: regex },
        { diagnosis: regex },
        { 'prescription.prescriptionId': regex },
      ];
    }

    const total = await OpdVisit.countDocuments(query);

    const visits = await OpdVisit.find(query)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId specialization department roomNumber consultationFee')
      .populate('patientProfile', 'patientId bloodGroup')
      .sort({ visitDate: -1, tokenNumber: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: visits.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      visits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single OPD visit details with populated vitals, medical history, and prescription
 * @route   GET /api/v1/opd/visits/:id
 * @access  Private (Doctor, Receptionist, Admin, or Patient self)
 */
export const getOpdVisitById = async (req, res, next) => {
  try {
    const idParam = req.params.id;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      query._id = idParam;
    } else {
      query.visitId = idParam;
    }

    const visit = await OpdVisit.findOne(query)
      .populate('patient', 'name email phone gender dateOfBirth address')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId specialization department roomNumber consultationFee qualifications licenseNumber')
      .populate('patientProfile', 'patientId bloodGroup maritalStatus emergencyContact insurance allergies medicalHistory')
      .populate('recordedBy', 'name');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'OPD visit record not found.',
      });
    }

    // Role guard: Patient can only view their own visit
    if (
      req.user.role === 'patient' &&
      visit.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this OPD record.',
      });
    }

    res.status(200).json({
      success: true,
      visit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete chronological outpatient visit history for a patient
 * @route   GET /api/v1/opd/patient/:patientId/history
 * @access  Private (Patient self, or Staff)
 */
export const getPatientVisitHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    let targetUserId = null;

    if (req.user.role === 'patient') {
      targetUserId = req.user._id;
    } else if (patientId === 'me') {
      targetUserId = req.user._id;
    } else if (mongoose.Types.ObjectId.isValid(patientId)) {
      targetUserId = patientId;
    } else {
      // Look up by patientId (PAT-xxxx)
      const profile = await PatientProfile.findOne({ patientId });
      if (profile) targetUserId = profile.user;
    }

    if (!targetUserId) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    const visits = await OpdVisit.find({ patient: targetUserId })
      .populate('doctor', 'name email')
      .populate('doctorProfile', 'doctorId specialization department roomNumber')
      .sort({ visitDate: -1 });

    res.status(200).json({
      success: true,
      count: visits.length,
      visits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update vitals for an OPD visit during triage
 * @route   PUT /api/v1/opd/visits/:id/vitals
 * @access  Private (Staff: Doctor, Receptionist, Admin)
 */
export const updateVitals = async (req, res, next) => {
  try {
    const { vitals } = req.body;

    const visit = await OpdVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'OPD visit record not found.',
      });
    }

    const weight = vitals.weight !== undefined ? parseFloat(vitals.weight) : visit.vitals.weight;
    const height = vitals.height !== undefined ? parseFloat(vitals.height) : visit.vitals.height;
    const bmi = calculateBmi(weight, height);

    visit.vitals = {
      bloodPressure: vitals.bloodPressure !== undefined ? vitals.bloodPressure : visit.vitals.bloodPressure,
      heartRate: vitals.heartRate !== undefined ? parseInt(vitals.heartRate, 10) : visit.vitals.heartRate,
      temperature: vitals.temperature !== undefined ? parseFloat(vitals.temperature) : visit.vitals.temperature,
      respiratoryRate: vitals.respiratoryRate !== undefined ? parseInt(vitals.respiratoryRate, 10) : visit.vitals.respiratoryRate,
      spO2: vitals.spO2 !== undefined ? parseInt(vitals.spO2, 10) : visit.vitals.spO2,
      weight,
      height,
      bmi,
      recordedAt: new Date(),
    };

    await visit.save();

    res.status(200).json({
      success: true,
      message: 'Vital signs updated successfully.',
      vitals: visit.vitals,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Doctor completes consultation: records diagnosis, examination, issues digital prescription & follow-up
 * @route   POST /api/v1/opd/visits/:id/consultation
 * @access  Private (Doctor, Admin)
 */
export const completeConsultation = async (req, res, next) => {
  try {
    const {
      physicalExamination,
      diagnosis,
      clinicalNotes,
      prescription = {},
      followUp = {},
    } = req.body;

    if (!diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Clinical diagnosis is required to complete consultation.',
      });
    }

    const visit = await OpdVisit.findById(req.params.id);
    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'OPD visit record not found.',
      });
    }

    // Verify authorized doctor or admin
    if (
      req.user.role === 'doctor' &&
      visit.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not the assigned doctor for this OPD consultation.',
      });
    }

    visit.physicalExamination = physicalExamination || visit.physicalExamination;
    visit.diagnosis = diagnosis.trim();
    visit.clinicalNotes = clinicalNotes ? clinicalNotes.trim() : visit.clinicalNotes;
    visit.status = 'Completed';

    // Generate digital prescription slip for completed consultation
    const existingRxId = visit.prescription?.prescriptionId;
    const rxId = existingRxId || (await OpdVisit.generatePrescriptionId());

    // Clean medicines array: ensure non-empty medicine names and valid fields
    const validMedicines = (prescription.medicines || [])
      .filter((m) => m && m.name && m.name.trim() !== '')
      .map((m) => ({
        name: m.name.trim(),
        dosage: (m.dosage && m.dosage.trim()) || '1 tablet',
        frequency: (m.frequency && m.frequency.trim()) || '1-0-1',
        duration: (m.duration && m.duration.trim()) || '5 days',
        instructions: (m.instructions && m.instructions.trim()) || 'After food',
      }));

    visit.prescription = {
      prescriptionId: rxId,
      medicines: validMedicines,
      investigationsRecommended: prescription.investigationsRecommended || [],
      dietaryAdvice: prescription.dietaryAdvice ? prescription.dietaryAdvice.trim() : '',
      generalNotes: prescription.generalNotes ? prescription.generalNotes.trim() : '',
      issuedAt: new Date(),
    };

    // Follow-up consultation recommendation
    if (followUp.recommended && followUp.followUpDate) {
      visit.followUp = {
        recommended: true,
        followUpDate: new Date(followUp.followUpDate),
        instructions: followUp.instructions || 'Review in OPD clinic',
        appointmentCreated: false,
        appointmentId: null,
      };
    }

    await visit.save();

    // Auto-sync primary diagnosis to Patient's long-term Medical History (EMR integration)
    const patientProfile = await PatientProfile.findOne({ user: visit.patient });
    if (patientProfile) {
      const alreadyLogged = patientProfile.medicalHistory.some(
        (m) => m.condition.toLowerCase() === diagnosis.trim().toLowerCase() && m.status === 'Active'
      );

      if (!alreadyLogged) {
        patientProfile.medicalHistory.push({
          condition: diagnosis.trim(),
          diagnosisDate: new Date(),
          status: 'Active',
          notes: `Diagnosed during OPD consultation (${visit.visitId}). ${clinicalNotes || ''}`,
          recordedBy: req.user._id,
        });
        await patientProfile.save();
      }
    }

    // If an appointment was linked, mark it as Completed as well
    if (visit.appointment) {
      await Appointment.findByIdAndUpdate(visit.appointment, {
        status: 'Completed',
        consultationNotes: `Completed in OPD (${visit.visitId}). Diagnosis: ${diagnosis}`,
      });
    }

    const populated = await OpdVisit.findById(visit._id)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('doctor', 'name email')
      .populate('doctorProfile', 'doctorId specialization department roomNumber qualifications licenseNumber')
      .populate('patientProfile', 'patientId bloodGroup allergies');

    res.status(200).json({
      success: true,
      message: `Consultation completed and Prescription ${visit.prescription?.prescriptionId || ''} generated successfully!`,
      visit: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Schedule recommended follow-up appointment directly from an OPD visit
 * @route   POST /api/v1/opd/visits/:id/follow-up-appointment
 * @access  Private (Doctor, Receptionist, Admin, Patient)
 */
export const scheduleFollowUpAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, timeSlot, startTime, endTime } = req.body;

    const visit = await OpdVisit.findById(req.params.id)
      .populate('doctorProfile')
      .populate('patient');

    if (!visit) {
      return res.status(404).json({
        success: false,
        message: 'OPD visit record not found.',
      });
    }

    const targetDate = appointmentDate || visit.followUp?.followUpDate;
    if (!targetDate) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date is required to schedule follow-up.',
      });
    }

    const dateObj = new Date(targetDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // If slot is specified, check double-booking
    let chosenSlot = timeSlot;
    if (!chosenSlot) {
      // Find first available slot for doctor
      const slotData = await calculateDoctorSlots(visit.doctorProfile, dateObj);
      const free = slotData.slots?.find((s) => s.isAvailable);
      if (!free) {
        return res.status(400).json({
          success: false,
          message: 'No available appointment slots on the selected follow-up date.',
        });
      }
      chosenSlot = free.timeSlot;
    }

    const conflict = await Appointment.findOne({
      doctor: visit.doctor,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: chosenSlot,
      status: { $ne: 'Cancelled' },
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Slot ${chosenSlot} is already booked on this date.`,
      });
    }

    const [calcStart, calcEnd] = chosenSlot.split(' - ');
    const newAptId = await Appointment.generateAppointmentId();

    const appointment = await Appointment.create({
      appointmentId: newAptId,
      patient: visit.patient._id,
      patientProfile: visit.patientProfile,
      doctor: visit.doctor,
      doctorProfile: visit.doctorProfile._id,
      department: visit.department,
      appointmentDate: dateObj,
      timeSlot: chosenSlot,
      startTime: startTime || calcStart,
      endTime: endTime || calcEnd,
      status: 'Confirmed',
      bookingType: 'Online',
      reasonForVisit: `Follow-up review for: ${visit.diagnosis || visit.chiefComplaints}`,
      consultationFee: visit.doctorProfile.consultationFee,
      roomNumber: visit.doctorProfile.roomNumber,
      consultationNotes: `Scheduled from OPD Visit ${visit.visitId}. ${visit.followUp?.instructions || ''}`,
    });

    visit.followUp.appointmentCreated = true;
    visit.followUp.appointmentId = appointment._id;
    await visit.save();

    res.status(201).json({
      success: true,
      message: `Follow-up appointment ${newAptId} confirmed for ${dateObj.toLocaleDateString()} at ${chosenSlot}.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};
