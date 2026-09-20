import crypto from 'crypto';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import DoctorProfile from '../models/DoctorProfile.js';
import sendEmail from '../utils/sendEmail.js';

// Helper to construct token response and set cookie
const sendTokenResponse = (user, statusCode, res, message = 'Success', extraData = {}) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  const userPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    avatar: user.avatar,
    phone: user.phone,
    gender: user.gender,
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    token,
    user: userPayload,
    ...extraData,
  });
};

/**
 * @desc    Register a new Patient (or Admin-created Staff)
 * @route   POST /api/v1/auth/register
 * @access  Public (for patients) / Admin (for staff roles)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, gender, dateOfBirth, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Role restrictions: public registration allows 'patient', or initial 'admin' bootstrap if no admin exists
    let assignedRole = 'patient';
    if (role && role !== 'patient') {
      const existingAdminCount = await User.countDocuments({ role: 'admin' });
      if (existingAdminCount === 0 && role === 'admin') {
        // First-run system bootstrap: allow initial Super Admin registration
        assignedRole = 'admin';
      } else if (req.user && req.user.role === 'admin') {
        // Authenticated Admin provisioning staff
        assignedRole = role;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Only Administrators can register staff (Doctors, Receptionists, Pharmacists, Lab Technicians, Admins).',
        });
      }
    }

    // Create user instance
    const user = new User({
      name,
      email,
      password,
      role: assignedRole,
      phone: phone || '',
      gender: gender || '',
      dateOfBirth: dateOfBirth || null,
      address: address || {},
      isVerified: assignedRole !== 'patient', // Staff created by admin are auto-verified
    });

    // Generate email verification token for patients
    let rawVerificationToken = null;
    if (!user.isVerified) {
      rawVerificationToken = user.generateEmailVerificationToken();
    }

    await user.save();

    // If patient, create default PatientProfile
    if (assignedRole === 'patient') {
      const patientId = await PatientProfile.generatePatientId();
      await PatientProfile.create({
        user: user._id,
        patientId,
        bloodGroup: req.body.bloodGroup || 'Unknown',
      });
    }

    // Send verification email if not auto-verified
    let emailResult = null;
    if (rawVerificationToken) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verificationUrl = `${clientUrl}/verify-email/${rawVerificationToken}`;

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; text-align: center;">Welcome to Hospital Management System</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Thank you for registering. Please click the button below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">Or copy and paste this link in your browser: <br/><a href="${verificationUrl}">${verificationUrl}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link will expire in 24 hours.</p>
        </div>
      `;

      emailResult = await sendEmail({
        email: user.email,
        subject: 'Hospital Management System - Email Verification',
        message: `Please verify your email by clicking: ${verificationUrl}`,
        html: emailHtml,
      });
    }

    sendTokenResponse(
      user,
      201,
      res,
      'Registration successful! Please check your email to verify your account.',
      {
        verificationToken: process.env.NODE_ENV !== 'production' ? rawVerificationToken : undefined,
        emailPreviewUrl: emailResult?.previewUrl || null,
      }
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user (Patient, Doctor, Receptionist, Admin)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password, expectedRole } = req.body;

    // Check for user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    // Optional: check role match if frontend portal passed expectedRole
    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({
        success: false,
        message: `Account found, but it is registered as '${user.role.toUpperCase()}', not '${expectedRole.toUpperCase()}'. Please log in through the correct portal.`,
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}!`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current logged in user & role profile
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    } else if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email address using token
 * @route   GET /api/v1/auth/verify-email/:token
 * @access  Public
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const rawToken = req.params.token;

    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired.',
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Email successfully verified! You now have full access.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot password - generate reset token & send email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email address exists.',
      });
    }

    // Generate reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7; text-align: center;">Hospital Management System</h2>
        <h3 style="text-align: center; color: #334155;">Password Reset Request</h3>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You requested a password reset for your Hospital Management System account. Please click the button below to choose a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">Or copy this URL into your browser: <br/><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Hospital Management System - Password Reset Request',
      message: `Password reset link: ${resetUrl}`,
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully.',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
      emailPreviewUrl: emailResult?.previewUrl || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using token
 * @route   PUT /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const rawToken = req.params.token;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successful! You can now log in.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current password
 * @route   PUT /api/v1/auth/update-password
 * @access  Private
 */
export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password successfully updated.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/v1/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User successfully logged out.',
  });
};

/**
 * @desc    Register new hospital staff (Pharmacist, Lab Tech, Receptionist, Doctor, Admin)
 * @route   POST /api/v1/auth/staff
 * @access  Private (Admin only)
 */
export const registerStaff = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      gender,
      department,
      specialization,
      licenseNumber,
      consultationFee,
      experienceYears,
      roomNumber,
    } = req.body;

    const allowedStaffRoles = ['pharmacist', 'lab_technician', 'receptionist', 'doctor', 'admin'];
    if (!allowedStaffRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid staff role '${role}'. Allowed roles: ${allowedStaffRoles.join(', ')}`,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email,
      password: password || 'Staff@123',
      role,
      phone: phone || '',
      gender: gender || 'male',
      isVerified: true, // Hospital staff created by admin are auto-verified
    });

    // If role is doctor, create linked DoctorProfile
    let doctorProfile = null;
    if (role === 'doctor') {
      const doctorId = await DoctorProfile.generateDoctorId();
      doctorProfile = await DoctorProfile.create({
        user: user._id,
        doctorId,
        department: department || 'General Medicine',
        specialization: specialization || 'General Physician',
        licenseNumber: licenseNumber || `MED-REG-${Date.now().toString().slice(-4)}`,
        consultationFee: consultationFee || 500,
        experienceYears: experienceYears || 5,
        roomNumber: roomNumber || 'Room 101',
      });
    }

    res.status(201).json({
      success: true,
      message: `Hospital staff member (${role}) onboarded and auto-verified successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        gender: user.gender,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
      doctorProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all hospital staff members
 * @route   GET /api/v1/auth/staff
 * @access  Private (Admin only)
 */
export const getStaffList = async (req, res, next) => {
  try {
    const staffRoles = ['doctor', 'receptionist', 'pharmacist', 'lab_technician', 'admin'];
    const staff = await User.find({ role: { $in: staffRoles } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if the system has an initialized Super Admin
 * @route   GET /api/v1/auth/setup-status
 * @access  Public
 */
export const getSystemSetupStatus = async (req, res, next) => {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    res.status(200).json({
      success: true,
      hasAdmin: adminCount > 0,
      adminCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove or permanently delete a hospital staff member
 * @route   DELETE /api/v1/auth/staff/:id
 * @access  Private (Admin only)
 */
export const removeStaff = async (req, res, next) => {
  try {
    const staffId = req.params.id;

    // Prevent Super Admin from removing themselves
    if (req.user._id.toString() === staffId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Restriction: You cannot remove your own Super Administrator account.',
      });
    }

    const staffMember = await User.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found in hospital directory.',
      });
    }

    // If role is doctor, clean up linked DoctorProfile
    if (staffMember.role === 'doctor') {
      await DoctorProfile.findOneAndDelete({ user: staffMember._id });
    }

    // Delete user from directory
    await User.findByIdAndDelete(staffId);

    res.status(200).json({
      success: true,
      message: `Staff member ${staffMember.name} (${staffMember.role}) has been removed from the hospital directory.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle staff active status (Active <-> Inactive)
 * @route   PATCH /api/v1/auth/staff/:id/status
 * @access  Private (Admin only)
 */
export const toggleStaffStatus = async (req, res, next) => {
  try {
    const staffId = req.params.id;

    if (req.user._id.toString() === staffId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Restriction: You cannot deactivate your own Super Administrator account.',
      });
    }

    const staffMember = await User.findById(staffId);
    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.',
      });
    }

    staffMember.isActive = !staffMember.isActive;
    await staffMember.save();

    res.status(200).json({
      success: true,
      message: `Staff member ${staffMember.name} is now ${staffMember.isActive ? 'Active' : 'Deactivated'}.`,
      isActive: staffMember.isActive,
    });
  } catch (error) {
    next(error);
  }
};



