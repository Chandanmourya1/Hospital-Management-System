import mongoose from 'mongoose';

// Subdocument Schema: Daily Doctor Progress Round & Medication Order
const doctorRoundSchema = new mongoose.Schema(
  {
    roundDate: {
      type: Date,
      default: Date.now,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clinicalObservations: {
      type: String,
      required: [true, 'Clinical observations are required for doctor rounds'],
      trim: true,
    },
    patientCondition: {
      type: String,
      enum: ['Stable', 'Improving', 'Critical', 'Guarded'],
      default: 'Stable',
    },
    medicationOrders: [
      {
        name: { type: String, required: true, trim: true },
        dosage: { type: String, required: true, trim: true },
        route: {
          type: String,
          enum: ['Oral', 'IV (Intravenous)', 'IM (Intramuscular)', 'Subcutaneous', 'Inhalation', 'Topical'],
          default: 'Oral',
        },
        frequency: { type: String, required: true, trim: true }, // e.g. 1-0-1, Q8H
        instructions: { type: String, default: 'As directed', trim: true },
        status: {
          type: String,
          enum: ['Active', 'Completed', 'Discontinued'],
          default: 'Active',
        },
      },
    ],
    investigationsOrdered: [
      {
        type: String,
        trim: true,
      },
    ],
    dietaryInstructions: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true, timestamps: true }
);

// Subdocument Schema: Periodic Nursing Care Log & Fluid Balance Chart
const nursingRecordSchema = new mongoose.Schema(
  {
    recordedAt: {
      type: Date,
      default: Date.now,
    },
    nurseName: {
      type: String,
      required: [true, 'Nurse name is required'],
      trim: true,
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night'],
      default: 'Morning',
    },
    vitals: {
      bloodPressure: { type: String, default: '' },
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null },
      respiratoryRate: { type: Number, default: null },
      spO2: { type: Number, default: null },
      bloodSugar: { type: Number, default: null }, // RBS mg/dL
    },
    intakeOutput: {
      oralIntakeMl: { type: Number, default: 0 },
      ivFluidsMl: { type: Number, default: 0 },
      urineOutputMl: { type: Number, default: 0 },
      drainOutputMl: { type: Number, default: 0 },
    },
    painScale: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    nursingNotes: {
      type: String,
      required: [true, 'Nursing shift observations are required'],
      trim: true,
    },
  },
  { _id: true, timestamps: true }
);

// Main IPD Admission Schema
const ipdAdmissionSchema = new mongoose.Schema(
  {
    admissionId: {
      type: String,
      required: true,
      unique: true,
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
    attendingDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Attending doctor reference is required'],
      index: true,
    },
    attendingDoctorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
    },
    department: {
      type: String,
      required: [true, 'Hospital department is required'],
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    admissionType: {
      type: String,
      enum: ['Emergency', 'OPD Referral', 'Direct Admission', 'Transfer'],
      default: 'Direct Admission',
    },
    provisionalDiagnosis: {
      type: String,
      required: [true, 'Provisional clinical diagnosis is required'],
      trim: true,
    },
    chiefComplaints: {
      type: String,
      required: [true, 'Admission chief complaints are required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Admitted', 'Under Treatment', 'Discharged', 'Transferred', 'LAMA'],
      default: 'Admitted',
      index: true,
    },
    // Active Bed Allocation & History
    bedAllocation: {
      ward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WardRoom',
        required: true,
      },
      wardName: { type: String, required: true },
      roomNumber: { type: String, required: true },
      bedNumber: { type: String, required: true },
      dailyRate: { type: Number, required: true },
      allocatedAt: { type: Date, default: Date.now },
      transferHistory: [
        {
          fromWard: String,
          fromRoom: String,
          fromBed: String,
          toWard: String,
          toRoom: String,
          toBed: String,
          transferredAt: { type: Date, default: Date.now },
          reason: String,
          transferredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
        },
      ],
    },
    // Initial Triage Baseline Vitals
    initialVitals: {
      bloodPressure: { type: String, default: '' },
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null },
      respiratoryRate: { type: Number, default: null },
      spO2: { type: Number, default: null },
      weight: { type: Number, default: null },
      height: { type: Number, default: null },
      bmi: { type: Number, default: null },
      recordedAt: { type: Date, default: Date.now },
    },
    // Doctor Progress Rounds & Inpatient Orders
    doctorRounds: [doctorRoundSchema],
    // Nursing Care Charts & Fluid Logs
    nursingRecords: [nursingRecordSchema],
    // Discharge Summary & Medical Clearance
    dischargeDetails: {
      dischargeDate: { type: Date, default: null },
      dischargingDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      finalDiagnosis: { type: String, default: '', trim: true },
      courseInHospital: { type: String, default: '', trim: true },
      conditionAtDischarge: {
        type: String,
        enum: ['Recovered', 'Improved', 'Referred', 'LAMA - Against Medical Advice'],
        default: 'Improved',
      },
      dischargeMedications: [
        {
          name: { type: String, required: true },
          dosage: { type: String, required: true },
          frequency: { type: String, required: true },
          duration: { type: String, required: true },
          instructions: { type: String, default: 'After food' },
        },
      ],
      dietaryAndActivityAdvice: { type: String, default: '', trim: true },
      followUpAdvice: {
        recommendedDate: { type: Date, default: null },
        instructions: { type: String, default: '', trim: true },
      },
      billingSummary: {
        totalDays: { type: Number, default: 1 },
        bedChargesPerDay: { type: Number, default: 0 },
        totalBedCharges: { type: Number, default: 0 },
        treatmentAndNursingCharges: { type: Number, default: 0 },
        totalBillAmount: { type: Number, default: 0 },
        paymentStatus: {
          type: String,
          enum: ['Pending', 'Settled', 'Insurance Claimed'],
          default: 'Pending',
        },
      },
      dischargeSlipGenerated: { type: Boolean, default: false },
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Static method to generate next sequential IPD Admission ID (e.g. IPD-1001, IPD-1002)
ipdAdmissionSchema.statics.generateAdmissionId = async function () {
  const lastAdmission = await this.findOne({ admissionId: /^IPD-\d+$/ })
    .sort({ admissionId: -1 })
    .select('admissionId')
    .lean();

  if (!lastAdmission || !lastAdmission.admissionId) {
    return 'IPD-1001';
  }

  const matches = lastAdmission.admissionId.match(/^IPD-(\d+)$/);
  if (matches && matches[1]) {
    const nextNum = parseInt(matches[1], 10) + 1;
    return `IPD-${nextNum}`;
  }

  return 'IPD-1001';
};

const IpdAdmission = mongoose.model('IpdAdmission', ipdAdmissionSchema);

export default IpdAdmission;
