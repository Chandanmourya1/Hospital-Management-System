import mongoose from 'mongoose';

// Subdocument Schema: Prescription Medication Item
const prescribedMedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
  },
  dosage: {
    type: String,
    required: [true, 'Dosage is required (e.g. 500mg, 1 tablet)'],
    trim: true,
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required (e.g. 1-0-1, Twice daily)'],
    trim: true,
  },
  duration: {
    type: String,
    required: [true, 'Duration is required (e.g. 5 days, 2 weeks)'],
    trim: true,
  },
  instructions: {
    type: String,
    default: 'After food',
    trim: true,
  },
});

// Subdocument Schema: Digital Prescription
const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    required: true,
    index: true,
  },
  medicines: [prescribedMedicineSchema],
  investigationsRecommended: [{
    type: String,
    trim: true,
  }],
  dietaryAdvice: {
    type: String,
    default: '',
    trim: true,
  },
  generalNotes: {
    type: String,
    default: '',
    trim: true,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
});

// Main OPD Visit Schema
const opdVisitSchema = new mongoose.Schema(
  {
    visitId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient user reference is required'],
      index: true,
    },
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Consulting doctor reference is required'],
      index: true,
    },
    doctorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    department: {
      type: String,
      required: [true, 'Clinical department is required'],
      trim: true,
    },
    visitDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['Waiting', 'In Consultation', 'Completed', 'Cancelled'],
      default: 'Waiting',
      index: true,
    },
    // Vital Signs Triage
    vitals: {
      bloodPressure: { type: String, default: '' }, // e.g. 120/80
      heartRate: { type: Number, default: null }, // bpm
      temperature: { type: Number, default: null }, // Fahrenheit
      respiratoryRate: { type: Number, default: null }, // breaths/min
      spO2: { type: Number, default: null }, // percentage
      weight: { type: Number, default: null }, // kg
      height: { type: Number, default: null }, // cm
      bmi: { type: Number, default: null }, // auto-calculated kg/m^2
      recordedAt: { type: Date, default: Date.now },
    },
    // Clinical Encounter Details
    chiefComplaints: {
      type: String,
      required: [true, 'Chief complaints must be specified during registration'],
      trim: true,
    },
    symptomsDuration: {
      type: String,
      default: '',
      trim: true,
    },
    physicalExamination: {
      type: String,
      default: '',
      trim: true,
    },
    diagnosis: {
      type: String,
      default: '',
      trim: true,
    },
    clinicalNotes: {
      type: String,
      default: '',
      trim: true,
    },
    // Digital Prescription Subdocument
    prescription: {
      type: prescriptionSchema,
      default: null,
    },
    // Follow-up consultation recommendation
    followUp: {
      recommended: { type: Boolean, default: false },
      followUpDate: { type: Date, default: null },
      instructions: { type: String, default: '' },
      appointmentCreated: { type: Boolean, default: false },
      appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null,
      },
    },
    consultationFee: {
      type: Number,
      default: 500,
    },
    billingStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Waived'],
      default: 'Paid',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding doctor's daily queue
opdVisitSchema.index({ doctor: 1, visitDate: 1, status: 1 });

// Static method to generate next sequential OPD Visit ID (e.g. OPD-1001, OPD-1002)
opdVisitSchema.statics.generateVisitId = async function () {
  const lastVisit = await this.findOne({ visitId: /^OPD-\d+$/ })
    .sort({ visitId: -1 })
    .select('visitId')
    .lean();

  if (!lastVisit || !lastVisit.visitId) {
    return 'OPD-1001';
  }

  const matches = lastVisit.visitId.match(/^OPD-(\d+)$/);
  if (matches && matches[1]) {
    const nextNum = parseInt(matches[1], 10) + 1;
    return `OPD-${nextNum}`;
  }

  return 'OPD-1001';
};

// Static method to generate next sequential Prescription ID (e.g. RX-1001, RX-1002)
opdVisitSchema.statics.generatePrescriptionId = async function () {
  const lastVisitWithRx = await this.findOne({ 'prescription.prescriptionId': /^RX-\d+$/ })
    .sort({ 'prescription.prescriptionId': -1 })
    .select('prescription.prescriptionId')
    .lean();

  if (!lastVisitWithRx || !lastVisitWithRx.prescription?.prescriptionId) {
    return 'RX-1001';
  }

  const matches = lastVisitWithRx.prescription.prescriptionId.match(/^RX-(\d+)$/);
  if (matches && matches[1]) {
    const nextNum = parseInt(matches[1], 10) + 1;
    return `RX-${nextNum}`;
  }

  return 'RX-1001';
};

// Static method to calculate the next queue token for a doctor on a specific date
opdVisitSchema.statics.getNextTokenNumber = async function (doctorId, targetDate) {
  const dateObj = new Date(targetDate);
  const startOfDay = new Date(dateObj);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(dateObj);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const count = await this.countDocuments({
    doctor: doctorId,
    visitDate: { $gte: startOfDay, $lte: endOfDay },
  });

  return count + 1;
};

const OpdVisit = mongoose.model('OpdVisit', opdVisitSchema);

export default OpdVisit;
