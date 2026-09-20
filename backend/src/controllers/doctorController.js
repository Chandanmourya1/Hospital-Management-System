import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

/**
 * @desc    Get all doctors with search, department filters, and schedule availability
 * @route   GET /api/v1/doctors
 * @access  Public / Authenticated
 */
export const getDoctors = async (req, res, next) => {
  try {
    const {
      search,
      department,
      availableDay,
      availabilityStatus,
      page = 1,
      limit = 10,
      sort = 'experienceYears',
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    let profileFilter = {};

    if (department && department !== 'All') {
      profileFilter.department = department;
    }

    if (availabilityStatus) {
      profileFilter.availabilityStatus = availabilityStatus;
    }

    if (availableDay) {
      profileFilter.availableDays = availableDay;
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');

      const matchingUsers = await User.find({
        role: 'doctor',
        name: searchRegex,
      }).select('_id');

      const userIds = matchingUsers.map((u) => u._id);

      profileFilter.$or = [
        { user: { $in: userIds } },
        { specialization: searchRegex },
        { doctorId: searchRegex },
      ];
    }

    const total = await DoctorProfile.countDocuments(profileFilter);

    // Determine sort
    let sortOption = {};
    if (sort === 'experienceYears') {
      sortOption = { experienceYears: -1 };
    } else if (sort === 'fee_low') {
      sortOption = { consultationFee: 1 };
    } else if (sort === 'fee_high') {
      sortOption = { consultationFee: -1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const doctors = await DoctorProfile.find(profileFilter)
      .populate({
        path: 'user',
        match: { isActive: true },
        select: 'name email phone gender avatar isVerified isActive createdAt',
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Filter out any where user is inactive/null
    const activeDoctors = doctors.filter((d) => d.user !== null);

    res.status(200).json({
      success: true,
      count: activeDoctors.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      doctors: activeDoctors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single doctor by ID or Doctor ID (e.g. DOC-1001)
 * @route   GET /api/v1/doctors/:id
 * @access  Public / Authenticated
 */
export const getDoctorById = async (req, res, next) => {
  try {
    const idParam = req.params.id;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      query.$or = [{ _id: idParam }, { user: idParam }];
    } else {
      query.doctorId = idParam;
    }

    const doctor = await DoctorProfile.findOne(query).populate({
      path: 'user',
      select: 'name email phone gender avatar isVerified isActive createdAt',
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor not found with identifier '${idParam}'`,
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get logged-in doctor's own profile and schedule
 * @route   GET /api/v1/doctors/me
 * @access  Private (Doctor only)
 */
export const getMyDoctorProfile = async (req, res, next) => {
  try {
    let doctor = await DoctorProfile.findOne({ user: req.user._id }).populate({
      path: 'user',
      select: 'name email phone gender avatar isVerified isActive createdAt',
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found for the authenticated user.',
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Onboard a new Doctor (Creates User + DoctorProfile)
 * @route   POST /api/v1/doctors
 * @access  Private (Admin only)
 */
export const createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      gender,
      department,
      specialization,
      licenseNumber,
      consultationFee,
      experienceYears,
      roomNumber,
      bio,
      qualifications,
      workingHours,
      availableDays,
      weeklySchedule,
      slotDurationMinutes,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Generate unique doctor ID (DOC-1001, DOC-1002...)
    const doctorId = await DoctorProfile.generateDoctorId();

    // Create User with role 'doctor'
    const user = await User.create({
      name,
      email,
      password: password || 'Doctor@123',
      role: 'doctor',
      phone: phone || '',
      gender: gender || 'male',
      isVerified: true,
    });

    // Default weekly schedule if not provided
    const days = availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const initialSchedule =
      weeklySchedule ||
      allDays.map((d) => ({
        day: d,
        isAvailable: days.includes(d),
        startTime: workingHours?.start || '09:00',
        endTime: workingHours?.end || '17:00',
        maxPatients: 20,
      }));

    const doctorProfile = await DoctorProfile.create({
      user: user._id,
      doctorId,
      department: department || 'General Medicine',
      specialization: specialization || 'General Physician',
      licenseNumber: licenseNumber || `MED-REG-${Date.now().toString().slice(-4)}`,
      consultationFee: consultationFee || 500,
      experienceYears: experienceYears || 1,
      roomNumber: roomNumber || 'Consultation Room 101',
      availabilityStatus: 'Available',
      workingHours: workingHours || { start: '09:00', end: '17:00' },
      availableDays: days,
      weeklySchedule: initialSchedule,
      slotDurationMinutes: slotDurationMinutes || 30,
      qualifications: qualifications || [],
      bio: bio || '',
    });

    const populatedDoctor = await DoctorProfile.findById(doctorProfile._id).populate(
      'user',
      'name email phone gender avatar isVerified isActive'
    );

    res.status(201).json({
      success: true,
      message: `Dr. ${name} registered successfully with ID ${doctorId}!`,
      doctor: populatedDoctor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Doctor profile details
 * @route   PUT /api/v1/doctors/:id
 * @access  Private (Admin, or Doctor if self)
 */
export const updateDoctor = async (req, res, next) => {
  try {
    const idParam = req.params.id;

    let doctor = await DoctorProfile.findById(idParam);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor not found with id ${idParam}`,
      });
    }

    // Role check: Doctor can only update their own profile unless Admin
    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You may only edit your own doctor profile.',
      });
    }

    const {
      name,
      phone,
      gender,
      specialization,
      department,
      licenseNumber,
      consultationFee,
      experienceYears,
      roomNumber,
      bio,
      qualifications,
      slotDurationMinutes,
    } = req.body;

    // Update User model fields
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (phone !== undefined) userUpdate.phone = phone;
    if (gender) userUpdate.gender = gender;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(doctor.user, userUpdate);
    }

    // Update DoctorProfile fields
    if (specialization) doctor.specialization = specialization;
    if (department && req.user.role === 'admin') doctor.department = department;
    if (licenseNumber && req.user.role === 'admin') doctor.licenseNumber = licenseNumber;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (experienceYears !== undefined) doctor.experienceYears = experienceYears;
    if (roomNumber) doctor.roomNumber = roomNumber;
    if (bio !== undefined) doctor.bio = bio;
    if (qualifications) doctor.qualifications = qualifications;
    if (slotDurationMinutes) doctor.slotDurationMinutes = slotDurationMinutes;

    await doctor.save();

    const updated = await DoctorProfile.findById(doctor._id).populate(
      'user',
      'name email phone gender avatar isVerified isActive'
    );

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully.',
      doctor: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update Doctor weekly schedule and working hours
 * @route   PUT /api/v1/doctors/:id/schedule
 * @access  Private (Doctor self, or Admin)
 */
export const updateSchedule = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor not found with id ${req.params.id}`,
      });
    }

    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own schedule.',
      });
    }

    const { weeklySchedule, workingHours, slotDurationMinutes } = req.body;

    if (weeklySchedule) {
      doctor.weeklySchedule = weeklySchedule;
      // Recalculate availableDays array
      doctor.availableDays = weeklySchedule.filter((s) => s.isAvailable).map((s) => s.day);
    }

    if (workingHours) {
      doctor.workingHours = workingHours;
    }

    if (slotDurationMinutes) {
      doctor.slotDurationMinutes = slotDurationMinutes;
    }

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Doctor schedule successfully updated.',
      weeklySchedule: doctor.weeklySchedule,
      availableDays: doctor.availableDays,
      workingHours: doctor.workingHours,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle real-time availability status (Available, In Consultation, On Leave, Offline)
 * @route   PUT /api/v1/doctors/:id/availability
 * @access  Private (Doctor self, or Admin)
 */
export const updateAvailability = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor not found with id ${req.params.id}`,
      });
    }

    if (req.user.role === 'doctor' && doctor.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only update your own availability.',
      });
    }

    const { availabilityStatus } = req.body;

    if (!['Available', 'In Consultation', 'On Leave', 'Offline'].includes(availabilityStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid availability status.',
      });
    }

    doctor.availabilityStatus = availabilityStatus;
    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Doctor status updated to ${availabilityStatus}`,
      availabilityStatus: doctor.availabilityStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate a Doctor account
 * @route   DELETE /api/v1/doctors/:id
 * @access  Private (Admin only)
 */
export const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor not found with id ${req.params.id}`,
      });
    }

    // Soft delete user account
    await User.findByIdAndUpdate(doctor.user, { isActive: false });
    await DoctorProfile.findByIdAndDelete(doctor._id);

    res.status(200).json({
      success: true,
      message: 'Doctor account has been deactivated and removed from the active directory.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of hospital departments with active doctor counts
 * @route   GET /api/v1/doctors/departments
 * @access  Public
 */
export const getDepartments = async (req, res, next) => {
  try {
    const counts = await DoctorProfile.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      { $match: { 'userInfo.isActive': true } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const allDepartments = [
      'Cardiology',
      'Neurology',
      'Orthopedics',
      'Pediatrics',
      'General Medicine',
      'Dermatology',
      'Oncology',
      'Gynecology',
      'Radiology',
      'Emergency',
    ];

    const result = allDepartments.map((dept) => {
      const match = counts.find((c) => c._id === dept);
      return {
        department: dept,
        count: match ? match.count : 0,
      };
    });

    res.status(200).json({
      success: true,
      departments: result,
    });
  } catch (error) {
    next(error);
  }
};
