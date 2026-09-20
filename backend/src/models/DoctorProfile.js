import mongoose from 'mongoose';

// Subdocument: Weekly Schedule Slot
const scheduleSlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    startTime: {
      type: String,
      default: '09:00', // 24-hr format HH:MM
    },
    endTime: {
      type: String,
      default: '17:00',
    },
    maxPatients: {
      type: Number,
      default: 20,
    },
  },
  { _id: false }
);

// Subdocument: Qualification
const qualificationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true },
    institution: { type: String, required: true },
    year: { type: Number, required: true },
  },
  { _id: false }
);

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    doctorId: {
      type: String,
      unique: true,
      index: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: [
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
      ],
      default: 'General Medicine',
    },
    licenseNumber: {
      type: String,
      required: [true, 'Medical license number is required'],
      trim: true,
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: [0, 'Consultation fee cannot be negative'],
    },
    experienceYears: {
      type: Number,
      default: 1,
      min: [0, 'Experience years cannot be negative'],
    },
    roomNumber: {
      type: String,
      default: 'Consultation Room 101',
      trim: true,
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'In Consultation', 'On Leave', 'Offline'],
      default: 'Available',
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
    },
    availableDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
    weeklySchedule: [scheduleSlotSchema],
    qualifications: [qualificationSchema],
    slotDurationMinutes: {
      type: Number,
      default: 30,
      enum: [15, 20, 30, 45, 60],
    },
    bio: {
      type: String,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Static method to generate next sequential Doctor ID (e.g. DOC-1001, DOC-1002)
doctorProfileSchema.statics.generateDoctorId = async function () {
  const lastDoc = await this.findOne({ doctorId: { $regex: /^DOC-\d+$/ } }).sort({
    doctorId: -1,
  });

  if (!lastDoc || !lastDoc.doctorId) {
    return 'DOC-1001';
  }

  const lastNumStr = lastDoc.doctorId.replace('DOC-', '');
  const nextNum = parseInt(lastNumStr, 10) + 1;
  return `DOC-${nextNum}`;
};

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
export default DoctorProfile;
