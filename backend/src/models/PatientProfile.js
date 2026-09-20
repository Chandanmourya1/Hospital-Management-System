import mongoose from 'mongoose';

// Subdocument Schema: Medical History Record
const medicalHistorySchema = new mongoose.Schema(
  {
    condition: {
      type: String,
      required: [true, 'Condition name is required'],
      trim: true,
    },
    diagnosisDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Chronic'],
      default: 'Active',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
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

// Subdocument Schema: Allergy Record
const allergySchema = new mongoose.Schema(
  {
    allergen: {
      type: String,
      required: [true, 'Allergen name is required'],
      trim: true,
    },
    severity: {
      type: String,
      enum: ['Mild', 'Moderate', 'Severe'],
      default: 'Moderate',
    },
    reaction: {
      type: String,
      trim: true,
      default: '',
    },
    identifiedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Subdocument Schema: Treatment, Procedure & Therapy Record
const treatmentHistorySchema = new mongoose.Schema(
  {
    treatmentName: {
      type: String,
      required: [true, 'Treatment or procedure name is required'],
      trim: true,
    },
    treatmentType: {
      type: String,
      enum: [
        'Medication Course',
        'Surgical Procedure',
        'Therapy / Rehab',
        'Diagnostic Intervention',
        'Conservative Care',
        'Other',
      ],
      default: 'Medication Course',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    outcome: {
      type: String,
      enum: ['Successful', 'Ongoing', 'Improved', 'Discontinued', 'Complication'],
      default: 'Ongoing',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const patientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    patientId: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      default: 'Unknown',
    },
    maritalStatus: {
      type: String,
      enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Other'],
      default: 'Single',
    },
    occupation: {
      type: String,
      default: '',
      trim: true,
    },
    emergencyContact: {
      name: { type: String, default: '' },
      relationship: { type: String, default: '' },
      phone: { type: String, default: '' },
      alternatePhone: { type: String, default: '' },
    },
    insurance: {
      provider: { type: String, default: '' },
      policyNumber: { type: String, default: '' },
      groupNumber: { type: String, default: '' },
      expiryDate: { type: Date },
      coverageDetails: { type: String, default: '' },
    },
    allergies: [allergySchema],
    medicalHistory: [medicalHistorySchema],
    treatments: [treatmentHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Static method to generate next sequential Patient ID (e.g. PAT-1001, PAT-1002)
patientProfileSchema.statics.generatePatientId = async function () {
  const existingProfiles = await this.find({ patientId: { $regex: /^PAT-\d+$/ } }).select('patientId');

  let maxNum = 1000;
  for (const profile of existingProfiles) {
    if (profile.patientId) {
      const parsedNum = parseInt(profile.patientId.replace('PAT-', ''), 10);
      if (!isNaN(parsedNum) && parsedNum > maxNum) {
        maxNum = parsedNum;
      }
    }
  }

  return `PAT-${maxNum + 1}`;
};

// Pre-save hook: auto-assign patientId if missing
patientProfileSchema.pre('save', async function (next) {
  if (!this.patientId) {
    this.patientId = await this.constructor.generatePatientId();
  }
  next();
});

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);
export default PatientProfile;

