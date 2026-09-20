import mongoose from 'mongoose';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';

/**
 * @desc    Get all patients with search, filtering, and pagination
 * @route   GET /api/v1/patients
 * @access  Private (Admin, Doctor, Receptionist)
 */
export const getPatients = async (req, res, next) => {
  try {
    const { search, bloodGroup, gender, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build search conditions
    let userFilter = { role: 'patient' };
    if (gender) {
      userFilter.gender = gender;
    }

    let profileFilter = {};
    if (bloodGroup) {
      profileFilter.bloodGroup = bloodGroup;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');

      // Check if search matches user fields (name, email, phone) or patientId
      const matchingUsers = await User.find({
        role: 'patient',
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      }).select('_id');

      const userIdsFromSearch = matchingUsers.map((u) => u._id);

      profileFilter.$or = [
        { user: { $in: userIdsFromSearch } },
        { patientId: searchRegex },
      ];
    }

    // Query profiles with user population
    const total = await PatientProfile.countDocuments(profileFilter);

    const patients = await PatientProfile.find(profileFilter)
      .populate({
        path: 'user',
        match: userFilter,
        select: 'name email phone gender dateOfBirth address avatar isVerified createdAt',
      })
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Filter out any profiles where user didn't match gender filter if applied
    const filteredPatients = patients.filter((p) => p.user !== null);

    res.status(200).json({
      success: true,
      count: filteredPatients.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      patients: filteredPatients,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated patient's profile
 * @route   GET /api/v1/patients/me
 * @access  Private (Patient only)
 */
export const getMyPatientProfile = async (req, res, next) => {
  try {
    let profile = await PatientProfile.findOne({ user: req.user._id })
      .populate({
        path: 'user',
        select: 'name email phone gender dateOfBirth address avatar isVerified createdAt',
      })
      .populate({
        path: 'medicalHistory.recordedBy',
        select: 'name email role',
      });

    // If profile does not exist yet, create one
    if (!profile) {
      const newPatientId = await PatientProfile.generatePatientId();
      profile = await PatientProfile.create({
        user: req.user._id,
        patientId: newPatientId,
        bloodGroup: 'Unknown',
      });
      profile = await profile.populate('user');
    }

    res.status(200).json({
      success: true,
      patient: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single patient by Profile ID or Patient ID
 * @route   GET /api/v1/patients/:id
 * @access  Private (Admin, Doctor, Receptionist, or Patient if self)
 */
export const getPatientById = async (req, res, next) => {
  try {
    const idParam = req.params.id;

    // Allow search by ObjectId or by human-readable patientId (e.g. PAT-1001)
    let query = {};
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      query.$or = [{ _id: idParam }, { user: idParam }];
    } else {
      query.patientId = idParam;
    }

    const patient = await PatientProfile.findOne(query)
      .populate({
        path: 'user',
        select: 'name email phone gender dateOfBirth address avatar isVerified createdAt',
      })
      .populate({
        path: 'medicalHistory.recordedBy',
        select: 'name email role',
      });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with identifier '${idParam}'`,
      });
    }

    // Role check: If caller is a patient, they can only view their own profile
    if (
      req.user.role === 'patient' &&
      patient.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not permitted to view other patient records.',
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new in-person / OPD patient
 * @route   POST /api/v1/patients
 * @access  Private (Admin, Receptionist)
 */
export const createPatient = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      dateOfBirth,
      address,
      bloodGroup,
      maritalStatus,
      occupation,
      emergencyContact,
      insurance,
      allergies,
      medicalHistory,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    // Generate unique readable patient ID (e.g. PAT-1003)
    const patientId = await PatientProfile.generatePatientId();

    // Create User account (auto-verified since registered by staff)
    const user = await User.create({
      name,
      email,
      password: password || 'Patient@123',
      role: 'patient',
      phone: phone || '',
      gender: gender || 'prefer-not-to-say',
      dateOfBirth: dateOfBirth || null,
      address: address || {},
      isVerified: true,
    });

    // Create linked Patient Profile
    const profile = await PatientProfile.create({
      user: user._id,
      patientId,
      bloodGroup: bloodGroup || 'Unknown',
      maritalStatus: maritalStatus || 'Single',
      occupation: occupation || '',
      emergencyContact: emergencyContact || {},
      insurance: insurance || {},
      allergies: allergies || [],
      medicalHistory: medicalHistory || [],
    });

    const populatedPatient = await PatientProfile.findById(profile._id).populate(
      'user',
      'name email phone gender dateOfBirth address avatar isVerified createdAt'
    );

    res.status(201).json({
      success: true,
      message: `Patient registered successfully with ID ${patientId}!`,
      patient: populatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update patient details (Demographics, Insurance, Emergency Contact)
 * @route   PUT /api/v1/patients/:id
 * @access  Private (Admin, Receptionist, Doctor, or Patient if self)
 */
export const updatePatient = async (req, res, next) => {
  try {
    const idParam = req.params.id;

    let patient = await PatientProfile.findById(idParam);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with id ${idParam}`,
      });
    }

    // Patient can only update their own profile
    if (
      req.user.role === 'patient' &&
      patient.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this patient record.',
      });
    }

    const {
      name,
      phone,
      gender,
      dateOfBirth,
      address,
      bloodGroup,
      maritalStatus,
      occupation,
      emergencyContact,
      insurance,
    } = req.body;

    // Update User demographic fields if provided
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (gender) userUpdate.gender = gender;
    if (dateOfBirth) userUpdate.dateOfBirth = dateOfBirth;
    if (address) userUpdate.address = address;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(patient.user, userUpdate, { new: true, runValidators: true });
    }

    // Update Profile fields
    if (bloodGroup) patient.bloodGroup = bloodGroup;
    if (maritalStatus) patient.maritalStatus = maritalStatus;
    if (occupation !== undefined) patient.occupation = occupation;
    if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
    if (insurance) patient.insurance = { ...patient.insurance, ...insurance };

    await patient.save();

    const updatedPatient = await PatientProfile.findById(patient._id)
      .populate('user', 'name email phone gender dateOfBirth address avatar isVerified createdAt')
      .populate('medicalHistory.recordedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Patient details successfully updated.',
      patient: updatedPatient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add medical condition / history entry
 * @route   POST /api/v1/patients/:id/medical-history
 * @access  Private (Doctor, Admin)
 */
export const addMedicalHistory = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with id ${req.params.id}`,
      });
    }

    const { condition, diagnosisDate, status, notes } = req.body;

    if (!condition) {
      return res.status(400).json({
        success: false,
        message: 'Condition or diagnosis name is required.',
      });
    }

    patient.medicalHistory.unshift({
      condition,
      diagnosisDate: diagnosisDate || Date.now(),
      status: status || 'Active',
      notes: notes || '',
      recordedBy: req.user._id,
    });

    await patient.save();

    const updatedPatient = await PatientProfile.findById(patient._id)
      .populate('user', 'name email phone gender dateOfBirth address')
      .populate('medicalHistory.recordedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Medical history record successfully added.',
      medicalHistory: updatedPatient.medicalHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete medical history entry
 * @route   DELETE /api/v1/patients/:id/medical-history/:historyId
 * @access  Private (Doctor, Admin)
 */
export const deleteMedicalHistory = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with id ${req.params.id}`,
      });
    }

    patient.medicalHistory = patient.medicalHistory.filter(
      (item) => item._id.toString() !== req.params.historyId
    );

    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully.',
      medicalHistory: patient.medicalHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add allergy record
 * @route   POST /api/v1/patients/:id/allergies
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const addAllergy = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with id ${req.params.id}`,
      });
    }

    const { allergen, severity, reaction, identifiedDate } = req.body;

    if (!allergen) {
      return res.status(400).json({
        success: false,
        message: 'Allergen name is required.',
      });
    }

    patient.allergies.push({
      allergen,
      severity: severity || 'Moderate',
      reaction: reaction || '',
      identifiedDate: identifiedDate || Date.now(),
    });

    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Allergy record successfully added.',
      allergies: patient.allergies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete allergy record
 * @route   DELETE /api/v1/patients/:id/allergies/:allergyId
 * @access  Private (Doctor, Admin)
 */
export const deleteAllergy = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient not found with id ${req.params.id}`,
      });
    }

    patient.allergies = patient.allergies.filter(
      (item) => item._id.toString() !== req.params.allergyId
    );

    await patient.save();

    res.status(200).json({
      success: true,
      message: 'Allergy record deleted successfully.',
      allergies: patient.allergies,
    });
  } catch (error) {
    next(error);
  }
};
