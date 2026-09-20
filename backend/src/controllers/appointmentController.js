import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import DoctorProfile from '../models/DoctorProfile.js';
import PatientProfile from '../models/PatientProfile.js';
import User from '../models/User.js';
import { calculateDoctorSlots } from '../utils/slotHelper.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * @desc    Get real-time available time slots for a doctor on a given date
 * @route   GET /api/v1/appointments/available-slots
 * @access  Public / Authenticated
 */
export const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both doctorId and date (YYYY-MM-DD).',
      });
    }

    // Find DoctorProfile by ID or by User ID
    let doctorProfile = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctorProfile = await DoctorProfile.findOne({
        $or: [{ _id: doctorId }, { user: doctorId }],
      }).populate('user', 'name email');
    } else {
      doctorProfile = await DoctorProfile.findOne({ doctorId }).populate('user', 'name email');
    }

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.',
      });
    }

    const slotData = await calculateDoctorSlots(doctorProfile, date);

    res.status(200).json({
      success: true,
      doctor: {
        _id: doctorProfile._id,
        doctorId: doctorProfile.doctorId,
        name: doctorProfile.user?.name,
        department: doctorProfile.department,
        specialization: doctorProfile.specialization,
        consultationFee: doctorProfile.consultationFee,
        roomNumber: doctorProfile.roomNumber,
      },
      date,
      ...slotData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Book a new appointment (Online or In-Person / Reception)
 * @route   POST /api/v1/appointments
 * @access  Private (Patient, Receptionist, Admin)
 */
export const bookAppointment = async (req, res, next) => {
  try {
    const {
      doctorId,
      appointmentDate,
      timeSlot,
      startTime,
      endTime,
      reasonForVisit,
      patientId,
      bookingType = 'Online',
    } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot || !reasonForVisit) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, appointment date, time slot, and reason for consultation are required.',
      });
    }

    // Determine Patient User ID
    let patientUserId = req.user._id;
    if (req.user.role !== 'patient') {
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Staff booking requires a target patientId.',
        });
      }
      patientUserId = patientId;
    }

    // Verify patient user exists
    const patientUser = await User.findById(patientUserId);
    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found.',
      });
    }

    const patientProfile = await PatientProfile.findOne({ user: patientUser._id });

    // Verify doctor exists
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
        message: 'Doctor profile not found.',
      });
    }

    const dateObj = new Date(appointmentDate);
    const startOfDay = new Date(dateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Double-booking check: Ensure slot is still open
    const conflictingAppointment = await Appointment.findOne({
      doctor: doctorProfile.user._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: 'Cancelled' },
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: `The selected time slot (${timeSlot}) was just reserved. Please select another slot.`,
      });
    }

    // Auto-generate Appointment ID (APT-1001, APT-1002)
    const newAppointmentId = await Appointment.generateAppointmentId();

    const [calcStart, calcEnd] = timeSlot.split(' - ');

    const appointment = await Appointment.create({
      appointmentId: newAppointmentId,
      patient: patientUser._id,
      patientProfile: patientProfile?._id,
      doctor: doctorProfile.user._id,
      doctorProfile: doctorProfile._id,
      department: doctorProfile.department,
      appointmentDate: dateObj,
      timeSlot,
      startTime: startTime || calcStart,
      endTime: endTime || calcEnd,
      status: 'Confirmed',
      bookingType,
      reasonForVisit,
      consultationFee: doctorProfile.consultationFee,
      roomNumber: doctorProfile.roomNumber,
    });

    // Populate for response
    const populated = await Appointment.findById(appointment._id)
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId department specialization roomNumber consultationFee')
      .populate('patientProfile', 'patientId bloodGroup');

    // Dispatch confirmation email via Nodemailer
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0284c7; margin: 0;">MedCare Hospital Management System</h2>
          <span style="font-size: 13px; color: #64748b;">Appointment Confirmation Pass</span>
        </div>
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px dashed #cbd5e1; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: bold;">Appointment ID</p>
          <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: bold; color: #0284c7; font-family: monospace;">${newAppointmentId}</p>
        </div>
        <p>Dear <strong>${patientUser.name}</strong>,</p>
        <p>Your medical consultation has been successfully booked with <strong>${doctorProfile.user.name}</strong> (${doctorProfile.specialization}).</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Department:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${doctorProfile.department}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Date:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Time Slot:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #0284c7;">${timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Consultation Suite:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${doctorProfile.roomNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Consultation Fee:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #16a34a;">$${doctorProfile.consultationFee}</td>
          </tr>
        </table>
        <p style="font-size: 12px; color: #64748b;">Please arrive 10 minutes prior to your allocated slot. If you need to reschedule or cancel, you can do so directly from your patient portal.</p>
      </div>
    `;

    sendEmail({
      email: patientUser.email,
      subject: `Appointment Confirmed [${newAppointmentId}] - Dr. ${doctorProfile.user.name}`,
      message: `Your appointment ${newAppointmentId} with Dr. ${doctorProfile.user.name} is confirmed for ${formattedDate} at ${timeSlot}.`,
      html: emailHtml,
    });

    res.status(201).json({
      success: true,
      message: `Appointment ${newAppointmentId} booked successfully!`,
      appointment: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all hospital appointments (Staff: Admin, Receptionist, Doctor)
 * @route   GET /api/v1/appointments
 * @access  Private (Staff only)
 */
export const getAllAppointments = async (req, res, next) => {
  try {
    const {
      doctor,
      patient,
      status,
      department,
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
    if (status && status !== 'All') query.status = status;
    if (department && department !== 'All') query.department = department;

    if (date) {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateObj);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ appointmentId: regex }, { reasonForVisit: regex }];
    }

    const total = await Appointment.countDocuments(query);

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone gender')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId specialization roomNumber consultationFee')
      .populate('patientProfile', 'patientId bloodGroup')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get appointments for the logged-in patient
 * @route   GET /api/v1/appointments/my-appointments
 * @access  Private (Patient only)
 */
export const getMyPatientAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId specialization department roomNumber consultationFee')
      .sort({ appointmentDate: -1, startTime: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get consulting schedule for the logged-in doctor
 * @route   GET /api/v1/appointments/doctor-schedule
 * @access  Private (Doctor only)
 */
export const getDoctorSchedule = async (req, res, next) => {
  try {
    const { date, status } = req.query;

    let query = { doctor: req.user._id };

    if (status && status !== 'All') query.status = status;

    if (date) {
      const dateObj = new Date(date);
      const startOfDay = new Date(dateObj);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(dateObj);
      endOfDay.setUTCHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email phone gender dateOfBirth')
      .populate('patientProfile', 'patientId bloodGroup allergies medicalHistory')
      .sort({ appointmentDate: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single appointment details
 * @route   GET /api/v1/appointments/:id
 * @access  Private
 */
export const getAppointmentById = async (req, res, next) => {
  try {
    const idParam = req.params.id;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      query._id = idParam;
    } else {
      query.appointmentId = idParam;
    }

    const appointment = await Appointment.findOne(query)
      .populate('patient', 'name email phone gender')
      .populate('doctor', 'name email phone')
      .populate('doctorProfile', 'doctorId specialization department roomNumber consultationFee')
      .populate('patientProfile', 'patientId bloodGroup allergies medicalHistory');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    // Role check: Patient can only view their own
    if (
      req.user.role === 'patient' &&
      appointment.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this appointment.',
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reschedule appointment to a new date/slot
 * @route   PUT /api/v1/appointments/:id/reschedule
 * @access  Private (Patient self, or Staff)
 */
export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { appointmentDate, timeSlot, startTime, endTime, rescheduleReason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment record not found.',
      });
    }

    if (
      req.user.role === 'patient' &&
      appointment.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only reschedule your own appointments.',
      });
    }

    if (appointment.status === 'Completed' || appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule an appointment that is already ${appointment.status}.`,
      });
    }

    const newDateObj = new Date(appointmentDate);
    const startOfDay = new Date(newDateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(newDateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Conflict check on new date and slot
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctor: appointment.doctor._id,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $ne: 'Cancelled' },
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Slot ${timeSlot} on the selected date is unavailable.`,
      });
    }

    const [calcStart, calcEnd] = timeSlot.split(' - ');

    appointment.appointmentDate = newDateObj;
    appointment.timeSlot = timeSlot;
    appointment.startTime = startTime || calcStart;
    appointment.endTime = endTime || calcEnd;
    appointment.status = 'Confirmed';
    if (rescheduleReason) {
      appointment.consultationNotes += `\n[Rescheduled]: ${rescheduleReason}`;
    }

    await appointment.save();

    // Send update email
    sendEmail({
      email: appointment.patient.email,
      subject: `Appointment Rescheduled [${appointment.appointmentId}] - Dr. ${appointment.doctor.name}`,
      message: `Your appointment has been rescheduled to ${newDateObj.toLocaleDateString()} at ${timeSlot}.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h3 style="color: #0284c7;">Appointment Rescheduled</h3>
          <p>Your appointment <strong>${appointment.appointmentId}</strong> with Dr. ${appointment.doctor.name} has been updated to:</p>
          <p><strong>Date:</strong> ${newDateObj.toLocaleDateString()}<br/>
             <strong>Time:</strong> ${timeSlot}<br/>
             <strong>Room:</strong> ${appointment.roomNumber}</p>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an appointment with reason
 * @route   PUT /api/v1/appointments/:id/cancel
 * @access  Private (Patient self, or Staff)
 */
export const cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name email');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    if (
      req.user.role === 'patient' &&
      appointment.patient._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You can only cancel your own appointments.',
      });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel an appointment that has already been completed.',
      });
    }

    appointment.status = 'Cancelled';
    appointment.cancellationReason = cancellationReason || 'Cancelled by patient/hospital';
    await appointment.save();

    // Send cancellation notice email
    sendEmail({
      email: appointment.patient.email,
      subject: `Appointment Cancelled [${appointment.appointmentId}]`,
      message: `Your appointment ${appointment.appointmentId} has been cancelled. Reason: ${appointment.cancellationReason}`,
    });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update appointment consultation status (Completed, No Show, Confirmed)
 * @route   PUT /api/v1/appointments/:id/status
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, consultationNotes } = req.body;

    if (!['Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status provided.',
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = status;
    if (consultationNotes !== undefined) {
      appointment.consultationNotes = consultationNotes;
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}.`,
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send automated reminder email for an upcoming appointment
 * @route   POST /api/v1/appointments/:id/reminder
 * @access  Private (Doctor, Receptionist, Admin)
 */
export const sendAppointmentReminder = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email')
      .populate('doctor', 'name');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h3 style="color: #0284c7;">Friendly Reminder: Upcoming Consultation</h3>
        <p>Dear <strong>${appointment.patient.name}</strong>,</p>
        <p>This is a reminder for your medical consultation <strong>[${appointment.appointmentId}]</strong> with <strong>Dr. ${appointment.doctor.name}</strong>.</p>
        <p><strong>Date:</strong> ${formattedDate}<br/>
           <strong>Time Slot:</strong> ${appointment.timeSlot}<br/>
           <strong>Room / Suite:</strong> ${appointment.roomNumber}</p>
        <p style="font-size: 12px; color: #64748b;">Please arrive 10 minutes prior to your scheduled time.</p>
      </div>
    `;

    const result = await sendEmail({
      email: appointment.patient.email,
      subject: `Reminder: Consultation on ${formattedDate} at ${appointment.timeSlot} [${appointment.appointmentId}]`,
      message: `Reminder for appointment ${appointment.appointmentId} on ${formattedDate} at ${appointment.timeSlot}.`,
      html: emailHtml,
    });

    appointment.reminderSent = true;
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Reminder email dispatched successfully.',
      previewUrl: result?.previewUrl || null,
    });
  } catch (error) {
    next(error);
  }
};
