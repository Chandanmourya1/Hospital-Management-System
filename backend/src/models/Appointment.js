import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient user reference is required'],
    },
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor user reference is required'],
    },
    doctorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required (e.g. 09:30 - 10:00)'],
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Completed', 'Cancelled', 'Rescheduled', 'No Show'],
      default: 'Confirmed',
      index: true,
    },
    bookingType: {
      type: String,
      enum: ['Online', 'Walk-in', 'Phone'],
      default: 'Online',
    },
    reasonForVisit: {
      type: String,
      required: [true, 'Please describe reason for consultation'],
      trim: true,
      maxlength: 500,
    },
    consultationNotes: {
      type: String,
      default: '',
      trim: true,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    consultationFee: {
      type: Number,
      default: 500,
    },
    roomNumber: {
      type: String,
      default: 'Clinic Room 101',
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help quickly prevent double-booking
appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });

// Static method to generate next sequential Appointment ID (e.g. APT-1001, APT-1002)
appointmentSchema.statics.generateAppointmentId = async function () {
  const lastApt = await this.findOne({ appointmentId: { $regex: /^APT-\d+$/ } }).sort({
    appointmentId: -1,
  });

  if (!lastApt || !lastApt.appointmentId) {
    return 'APT-1001';
  }

  const lastNumStr = lastApt.appointmentId.replace('APT-', '');
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `APT-${nextNum}`;
};

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
