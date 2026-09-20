import mongoose from 'mongoose';
import WardRoom from '../models/WardRoom.js';
import IpdAdmission from '../models/IpdAdmission.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';

// Utility helper to calculate BMI
const calculateBmi = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
};

/**
 * @desc    Get real-time visual hospital Bed Occupancy Matrix & KPI stats
 * @route   GET /api/v1/ipd/beds/matrix
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const getWardBedMatrix = async (req, res, next) => {
  try {
    const { wardType } = req.query;

    let query = { isOperational: true };
    if (wardType && wardType !== 'All') {
      query.wardType = wardType;
    }

    const wardRooms = await WardRoom.find(query)
      .populate({
        path: 'beds.currentAdmission',
        select: 'admissionId patient attendingDoctor admissionDate provisionalDiagnosis status',
        populate: [
          { path: 'patient', select: 'name phone gender dateOfBirth' },
          { path: 'attendingDoctor', select: 'name' },
        ],
      })
      .sort({ wardType: 1, roomNumber: 1 });

    let totalBeds = 0;
    let availableBeds = 0;
    let occupiedBeds = 0;
    let cleaningBeds = 0;
    let maintenanceBeds = 0;

    wardRooms.forEach((room) => {
      if (room.beds) {
        room.beds.forEach((bed) => {
          totalBeds++;
          if (bed.status === 'Available') availableBeds++;
          else if (bed.status === 'Occupied') occupiedBeds++;
          else if (bed.status === 'Cleaning') cleaningBeds++;
          else if (bed.status === 'Maintenance') maintenanceBeds++;
        });
      }
    });

    const occupancyRate = totalBeds > 0 ? parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalBeds,
        availableBeds,
        occupiedBeds,
        cleaningBeds,
        maintenanceBeds,
        occupancyRate,
      },
      wardRooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of all ward rooms with optional filters
 * @route   GET /api/v1/ipd/beds/rooms
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const getAllWardRooms = async (req, res, next) => {
  try {
    const { wardType, floor } = req.query;
    let query = { isOperational: true };

    if (wardType && wardType !== 'All') query.wardType = wardType;
    if (floor) query.floor = floor;

    const rooms = await WardRoom.find(query).sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admit a patient to IPD and atomically allocate an available bed
 * @route   POST /api/v1/ipd/admit
 * @access  Private (Receptionist, Doctor, Admin)
 */
export const admitPatient = async (req, res, next) => {
  try {
    const patientId = req.body.patientId || req.body.patient;
    const attendingDoctorId = req.body.attendingDoctorId || req.body.attendingDoctor || req.body.doctorId;
    const wardRoomId = req.body.wardRoomId || req.body.wardId || req.body.ward;
    const {
      bedNumber,
      department,
      admissionType = 'Direct Admission',
      provisionalDiagnosis,
      chiefComplaints,
      initialVitals = {},
    } = req.body;

    if (!patientId || !attendingDoctorId || !wardRoomId || !bedNumber || !provisionalDiagnosis || !chiefComplaints) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required admission fields (patient, doctor, ward, bed, diagnosis, complaints).',
      });
    }

    // 1. Resolve Patient
    let patientUser = null;
    let patientProfile = null;

    if (mongoose.Types.ObjectId.isValid(patientId)) {
      patientUser = await User.findById(patientId);
      patientProfile = await PatientProfile.findOne({ user: patientId });
    } else {
      patientProfile = await PatientProfile.findOne({ patientId });
      if (patientProfile) {
        patientUser = await User.findById(patientProfile.user);
      }
    }

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found for admission.',
      });
    }

    // Check if patient is already currently admitted
    const existingActiveAdmission = await IpdAdmission.findOne({
      patient: patientUser._id,
      status: { $in: ['Admitted', 'Under Treatment'] },
    });

    if (existingActiveAdmission) {
      return res.status(400).json({
        success: false,
        message: `Patient is already admitted under active record ${existingActiveAdmission.admissionId} (${existingActiveAdmission.bedAllocation.roomNumber} - ${existingActiveAdmission.bedAllocation.bedNumber}).`,
      });
    }

    // 2. Resolve Doctor
    let doctorUser = null;
    let doctorProfile = null;

    if (mongoose.Types.ObjectId.isValid(attendingDoctorId)) {
      doctorUser = await User.findById(attendingDoctorId);
      doctorProfile = await DoctorProfile.findOne({
        $or: [{ user: attendingDoctorId }, { _id: attendingDoctorId }],
      });
      if (!doctorUser && doctorProfile) {
        doctorUser = await User.findById(doctorProfile.user);
      }
    } else {
      doctorProfile = await DoctorProfile.findOne({ doctorId: attendingDoctorId });
      if (doctorProfile) {
        doctorUser = await User.findById(doctorProfile.user);
      }
    }

    if (!doctorUser) {
      return res.status(404).json({
        success: false,
        message: 'Attending doctor not found.',
      });
    }

    // 3. Resolve Ward Room and Bed
    const wardRoom = await WardRoom.findById(wardRoomId);
    if (!wardRoom) {
      return res.status(404).json({
        success: false,
        message: 'Selected ward/room not found.',
      });
    }

    const targetBed = wardRoom.beds.find((b) => b.bedNumber === bedNumber);
    if (!targetBed) {
      return res.status(404).json({
        success: false,
        message: `Bed ${bedNumber} not found in room ${wardRoom.roomNumber}.`,
      });
    }

    if (targetBed.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Bed ${bedNumber} is currently ${targetBed.status}. Please select an available bed.`,
      });
    }

    // 4. Generate sequential IPD Admission ID
    const admissionId = await IpdAdmission.generateAdmissionId();

    // 5. Calculate BMI if weight and height are provided
    const weight = initialVitals.weight ? parseFloat(initialVitals.weight) : null;
    const height = initialVitals.height ? parseFloat(initialVitals.height) : null;
    const bmi = calculateBmi(weight, height);

    // 6. Create Admission Record
    const admission = await IpdAdmission.create({
      admissionId,
      patient: patientUser._id,
      patientProfile: patientProfile ? patientProfile._id : null,
      attendingDoctor: doctorUser._id,
      attendingDoctorProfile: doctorProfile ? doctorProfile._id : null,
      department: department || doctorProfile?.department || 'General Medicine',
      admissionDate: new Date(),
      admissionType,
      provisionalDiagnosis: provisionalDiagnosis.trim(),
      chiefComplaints: chiefComplaints.trim(),
      status: 'Admitted',
      bedAllocation: {
        ward: wardRoom._id,
        wardName: wardRoom.wardName,
        roomNumber: wardRoom.roomNumber,
        bedNumber: targetBed.bedNumber,
        dailyRate: wardRoom.dailyRate,
        allocatedAt: new Date(),
        transferHistory: [],
      },
      initialVitals: {
        bloodPressure: initialVitals.bloodPressure || '',
        heartRate: initialVitals.heartRate ? parseInt(initialVitals.heartRate, 10) : null,
        temperature: initialVitals.temperature ? parseFloat(initialVitals.temperature) : null,
        respiratoryRate: initialVitals.respiratoryRate ? parseInt(initialVitals.respiratoryRate, 10) : null,
        spO2: initialVitals.spO2 ? parseInt(initialVitals.spO2, 10) : null,
        weight,
        height,
        bmi,
        recordedAt: new Date(),
      },
      admittedBy: req.user._id,
    });

    // 7. Atomically mark the bed as Occupied
    targetBed.status = 'Occupied';
    targetBed.currentAdmission = admission._id;
    await wardRoom.save();

    res.status(201).json({
      success: true,
      message: `Patient admitted successfully with ID ${admissionId}. Allocated to ${wardRoom.roomNumber} - ${targetBed.bedNumber}.`,
      admission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active currently admitted inpatients with search & filters
 * @route   GET /api/v1/ipd/admissions/active
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const getActiveInpatients = async (req, res, next) => {
  try {
    const { department, doctorId, wardType, search } = req.query;

    let query = {
      status: { $in: ['Admitted', 'Under Treatment'] },
    };

    if (department && department !== 'All') query.department = department;

    if (req.user.role === 'doctor') {
      query.attendingDoctor = req.user._id;
    } else if (doctorId) {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        query.attendingDoctor = doctorId;
      }
    }

    if (wardType && wardType !== 'All') {
      const matchingWards = await WardRoom.find({ wardType }).select('_id');
      query['bedAllocation.ward'] = { $in: matchingWards.map((w) => w._id) };
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { admissionId: regex },
        { provisionalDiagnosis: regex },
        { 'bedAllocation.roomNumber': regex },
        { 'bedAllocation.bedNumber': regex },
      ];
    }

    const inpatients = await IpdAdmission.find(query)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('patientProfile', 'patientId bloodGroup allergies emergencyContact insurance')
      .populate('attendingDoctor', 'name email phone')
      .populate('attendingDoctorProfile', 'doctorId specialization department roomNumber')
      .sort({ admissionDate: -1 });

    res.status(200).json({
      success: true,
      count: inpatients.length,
      inpatients,
      admissions: inpatients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get master list of all admissions (active + discharged) with pagination
 * @route   GET /api/v1/ipd/admissions
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const getAllAdmissions = async (req, res, next) => {
  try {
    const { status, department, search, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (status && status !== 'All') query.status = status;
    if (department && department !== 'All') query.department = department;

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { admissionId: regex },
        { provisionalDiagnosis: regex },
        { 'bedAllocation.roomNumber': regex },
        { 'bedAllocation.bedNumber': regex },
      ];
    }

    const total = await IpdAdmission.countDocuments(query);

    const admissions = await IpdAdmission.find(query)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('patientProfile', 'patientId bloodGroup')
      .populate('attendingDoctor', 'name email')
      .populate('attendingDoctorProfile', 'doctorId specialization department')
      .sort({ admissionDate: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: admissions.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      admissions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single IPD admission details with rounds, nursing logs, and bed history
 * @route   GET /api/v1/ipd/admissions/:id
 * @access  Private (Doctor, Receptionist, Admin, Patient self)
 */
export const getAdmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query._id = id;
    } else {
      query.admissionId = id;
    }

    const admission = await IpdAdmission.findOne(query)
      .populate('patient', 'name email phone gender dateOfBirth address')
      .populate('patientProfile', 'patientId bloodGroup maritalStatus emergencyContact insurance allergies medicalHistory')
      .populate('attendingDoctor', 'name email phone')
      .populate('attendingDoctorProfile', 'doctorId specialization department roomNumber consultationFee qualifications licenseNumber')
      .populate('doctorRounds.doctor', 'name')
      .populate('dischargeDetails.dischargingDoctor', 'name')
      .populate('admittedBy', 'name');

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'IPD admission record not found.',
      });
    }

    // Role guard: Patient can only view their own admission
    if (
      req.user.role === 'patient' &&
      admission.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this inpatient record.',
      });
    }

    res.status(200).json({
      success: true,
      admission,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Transfer inpatient to another available room/bed
 * @route   POST /api/v1/ipd/admissions/:id/transfer-bed
 * @access  Private (Receptionist, Doctor, Admin)
 */
export const transferBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const targetWardRoomId = req.body.targetWardRoomId || req.body.targetWardId || req.body.wardId;
    const targetBedNumber = req.body.targetBedNumber || req.body.bedNumber;
    const reason = req.body.reason || 'Clinical requirement';

    if (!targetWardRoomId || !targetBedNumber) {
      return res.status(400).json({
        success: false,
        message: 'Target room and bed number are required for transfer.',
      });
    }

    const admission = await IpdAdmission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found.',
      });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer a discharged patient.',
      });
    }

    // Check target ward & bed
    const targetRoom = await WardRoom.findById(targetWardRoomId);
    if (!targetRoom) {
      return res.status(404).json({
        success: false,
        message: 'Target ward room not found.',
      });
    }

    const targetBed = targetRoom.beds.find((b) => b.bedNumber === targetBedNumber);
    if (!targetBed) {
      return res.status(404).json({
        success: false,
        message: `Target bed ${targetBedNumber} not found in room ${targetRoom.roomNumber}.`,
      });
    }

    if (targetBed.status !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Target bed ${targetBedNumber} is currently ${targetBed.status}.`,
      });
    }

    // 1. Release current bed in old room
    const oldRoom = await WardRoom.findById(admission.bedAllocation.ward);
    if (oldRoom) {
      const currentBed = oldRoom.beds.find((b) => b.bedNumber === admission.bedAllocation.bedNumber);
      if (currentBed) {
        currentBed.status = 'Cleaning'; // Transition to Cleaning for sanitization
        currentBed.currentAdmission = null;
        await oldRoom.save();
      }
    }

    // 2. Record historical transfer log
    admission.bedAllocation.transferHistory.push({
      fromWard: admission.bedAllocation.wardName,
      fromRoom: admission.bedAllocation.roomNumber,
      fromBed: admission.bedAllocation.bedNumber,
      toWard: targetRoom.wardName,
      toRoom: targetRoom.roomNumber,
      toBed: targetBed.bedNumber,
      transferredAt: new Date(),
      reason: reason.trim(),
      transferredBy: req.user._id,
    });

    // 3. Update admission with new bed allocation
    admission.bedAllocation.ward = targetRoom._id;
    admission.bedAllocation.wardName = targetRoom.wardName;
    admission.bedAllocation.roomNumber = targetRoom.roomNumber;
    admission.bedAllocation.bedNumber = targetBed.bedNumber;
    admission.bedAllocation.dailyRate = targetRoom.dailyRate;
    admission.bedAllocation.allocatedAt = new Date();

    await admission.save();

    // 4. Mark target bed as Occupied
    targetBed.status = 'Occupied';
    targetBed.currentAdmission = admission._id;
    await targetRoom.save();

    res.status(200).json({
      success: true,
      message: `Patient successfully transferred to ${targetRoom.roomNumber} - ${targetBed.bedNumber}. Previous bed marked for cleaning.`,
      admission,
      bedAllocation: admission.bedAllocation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Doctor logs daily clinical progress round & active treatment orders
 * @route   POST /api/v1/ipd/admissions/:id/rounds
 * @access  Private (Doctor, Admin)
 */
export const addDoctorRound = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      clinicalObservations,
      patientCondition = 'Stable',
      medicationOrders = [],
      investigationsOrdered = [],
      dietaryInstructions = '',
    } = req.body;

    if (!clinicalObservations || clinicalObservations.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Clinical observations are required to record a doctor round.',
      });
    }

    const admission = await IpdAdmission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found.',
      });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add clinical rounds to a discharged patient.',
      });
    }

    // Clean medication orders
    const validOrders = medicationOrders
      .filter((m) => m && m.name && m.name.trim() !== '')
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage ? m.dosage.trim() : '1 dose',
        route: m.route || 'Oral',
        frequency: m.frequency ? m.frequency.trim() : 'Once daily',
        instructions: m.instructions ? m.instructions.trim() : 'As directed',
        status: m.status || 'Active',
      }));

    admission.doctorRounds.push({
      roundDate: new Date(),
      doctor: req.user._id,
      clinicalObservations: clinicalObservations.trim(),
      patientCondition,
      medicationOrders: validOrders,
      investigationsOrdered: Array.isArray(investigationsOrdered) ? investigationsOrdered : [],
      dietaryInstructions: dietaryInstructions.trim(),
    });

    admission.status = 'Under Treatment';
    await admission.save();

    res.status(200).json({
      success: true,
      message: 'Doctor progress round and treatment orders recorded successfully.',
      admission,
      doctorRounds: admission.doctorRounds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Nurse logs periodic shift observations, vitals, and fluid intake/output
 * @route   POST /api/v1/ipd/admissions/:id/nursing
 * @access  Private (Staff: Receptionist/Nurse, Doctor, Admin)
 */
export const addNursingRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      nurseName,
      shift = 'Morning',
      vitals = {},
      intakeOutput = {},
      painScale = 0,
      nursingNotes,
    } = req.body;

    if (!nursingNotes || nursingNotes.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Nursing shift observations and notes are required.',
      });
    }

    const admission = await IpdAdmission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found.',
      });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({
        success: false,
        message: 'Cannot record nursing logs for a discharged patient.',
      });
    }

    admission.nursingRecords.push({
      recordedAt: new Date(),
      nurseName: nurseName ? nurseName.trim() : req.user.name,
      shift,
      vitals: {
        bloodPressure: vitals.bloodPressure || '',
        heartRate: vitals.heartRate ? parseInt(vitals.heartRate, 10) : null,
        temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
        respiratoryRate: vitals.respiratoryRate ? parseInt(vitals.respiratoryRate, 10) : null,
        spO2: vitals.spO2 ? parseInt(vitals.spO2, 10) : null,
        bloodSugar: vitals.bloodSugar ? parseFloat(vitals.bloodSugar) : null,
      },
      intakeOutput: {
        oralIntakeMl: intakeOutput.oralIntakeMl ? parseFloat(intakeOutput.oralIntakeMl) : 0,
        ivFluidsMl: intakeOutput.ivFluidsMl ? parseFloat(intakeOutput.ivFluidsMl) : 0,
        urineOutputMl: intakeOutput.urineOutputMl ? parseFloat(intakeOutput.urineOutputMl) : 0,
        drainOutputMl: intakeOutput.drainOutputMl ? parseFloat(intakeOutput.drainOutputMl) : 0,
      },
      painScale: painScale !== undefined ? parseInt(painScale, 10) : 0,
      nursingNotes: nursingNotes.trim(),
    });

    await admission.save();

    res.status(200).json({
      success: true,
      message: 'Nursing care record and vitals chart logged successfully.',
      admission,
      nursingRecords: admission.nursingRecords,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Execute patient discharge, calculate length-of-stay billing, release bed, and issue discharge summary
 * @route   POST /api/v1/ipd/admissions/:id/discharge
 * @access  Private (Doctor, Admin)
 */
export const dischargePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      finalDiagnosis,
      courseInHospital,
      conditionAtDischarge = 'Improved',
      dischargeMedications = [],
      dietaryAndActivityAdvice = '',
      followUpAdvice = {},
      treatmentAndNursingCharges = 0,
    } = req.body;

    if (!finalDiagnosis || !courseInHospital) {
      return res.status(400).json({
        success: false,
        message: 'Final clinical diagnosis and summary of hospital course are required for discharge clearance.',
      });
    }

    const admission = await IpdAdmission.findById(id);
    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission record not found.',
      });
    }

    if (admission.status === 'Discharged') {
      return res.status(400).json({
        success: false,
        message: 'Patient has already been discharged.',
      });
    }

    const dischargeDate = new Date();
    const admissionDate = new Date(admission.admissionDate);

    // Calculate length of stay (in days, minimum 1 day)
    const diffMs = dischargeDate.getTime() - admissionDate.getTime();
    const calculatedDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const bedRate = admission.bedAllocation.dailyRate || 800;
    const totalBedCharges = calculatedDays * bedRate;
    const treatmentChargesNum = parseFloat(treatmentAndNursingCharges) || 0;
    const totalBillAmount = totalBedCharges + treatmentChargesNum;

    // Format take-home medications
    const validMeds = dischargeMedications
      .filter((m) => m && m.name && m.name.trim() !== '')
      .map((m) => ({
        name: m.name.trim(),
        dosage: m.dosage ? m.dosage.trim() : '1 tablet',
        frequency: m.frequency ? m.frequency.trim() : '1-0-1',
        duration: m.duration ? m.duration.trim() : '7 days',
        instructions: m.instructions ? m.instructions.trim() : 'After meals',
      }));

    admission.status = 'Discharged';
    admission.dischargeDetails = {
      dischargeDate,
      dischargingDoctor: req.user._id,
      finalDiagnosis: finalDiagnosis.trim(),
      courseInHospital: courseInHospital.trim(),
      conditionAtDischarge,
      dischargeMedications: validMeds,
      dietaryAndActivityAdvice: dietaryAndActivityAdvice.trim(),
      followUpAdvice: {
        recommendedDate: followUpAdvice.recommendedDate ? new Date(followUpAdvice.recommendedDate) : null,
        instructions: followUpAdvice.instructions ? followUpAdvice.instructions.trim() : 'Review in OPD clinic with discharge summary',
      },
      billingSummary: {
        totalDays: calculatedDays,
        bedChargesPerDay: bedRate,
        totalBedCharges,
        treatmentAndNursingCharges: treatmentChargesNum,
        totalBillAmount,
        paymentStatus: req.body.paymentStatus || 'Pending',
      },
      dischargeSlipGenerated: true,
    };

    await admission.save();

    // Release allocated bed and mark as Cleaning
    const wardRoom = await WardRoom.findById(admission.bedAllocation.ward);
    if (wardRoom) {
      const allocatedBed = wardRoom.beds.find((b) => b.bedNumber === admission.bedAllocation.bedNumber);
      if (allocatedBed) {
        allocatedBed.status = 'Cleaning';
        allocatedBed.currentAdmission = null;
        await wardRoom.save();
      }
    }

    // Auto-sync final diagnosis to Patient's longitudinal medical history (EMR)
    const patientProfile = await PatientProfile.findOne({ user: admission.patient });
    if (patientProfile) {
      const alreadyLogged = patientProfile.medicalHistory.some(
        (m) => m.condition.toLowerCase() === finalDiagnosis.trim().toLowerCase() && m.status === 'Active'
      );

      if (!alreadyLogged) {
        patientProfile.medicalHistory.push({
          condition: finalDiagnosis.trim(),
          diagnosedDate: new Date(),
          status: 'Active',
          notes: `Documented during IPD Admission (${admission.admissionId})`,
        });
        await patientProfile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Inpatient discharged successfully. Bed ${admission.bedAllocation.roomNumber} - ${admission.bedAllocation.bedNumber} marked for cleaning.`,
      admission,
      dischargeDetails: admission.dischargeDetails,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Staff updates a bed's status (e.g. from 'Cleaning' to 'Available' or 'Maintenance')
 * @route   PUT /api/v1/ipd/beds/:roomId/:bedNumber/status
 * @access  Private (Staff: Receptionist, Doctor, Admin)
 */
export const updateBedStatus = async (req, res, next) => {
  try {
    const { roomId, bedNumber } = req.params;
    const { status } = req.body;

    if (!['Available', 'Occupied', 'Maintenance', 'Cleaning'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bed status value.',
      });
    }

    const wardRoom = await WardRoom.findById(roomId);
    if (!wardRoom) {
      return res.status(404).json({
        success: false,
        message: 'Ward room not found.',
      });
    }

    const bed = wardRoom.beds.find((b) => b.bedNumber === bedNumber);
    if (!bed) {
      return res.status(404).json({
        success: false,
        message: `Bed ${bedNumber} not found.`,
      });
    }

    if (bed.status === 'Occupied' && status !== 'Occupied') {
      return res.status(400).json({
        success: false,
        message: 'Cannot manually change status of an occupied bed. Please discharge or transfer the inpatient.',
      });
    }

    bed.status = status;
    await wardRoom.save();

    res.status(200).json({
      success: true,
      message: `Bed ${bedNumber} in ${wardRoom.roomNumber} updated to ${status}.`,
      bed,
    });
  } catch (error) {
    next(error);
  }
};
