import mongoose from 'mongoose';

const parameterResultSchema = new mongoose.Schema({
  parameterName: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  unit: {
    type: String,
    default: '',
    trim: true,
  },
  referenceRange: {
    type: String,
    default: '',
    trim: true,
  },
  flag: {
    type: String,
    enum: ['Normal', 'Low', 'High', 'Critical'],
    default: 'Normal',
  },
  method: {
    type: String,
    default: 'Automated Analyzer / Spectrophotometry',
    trim: true,
  },
});

const labReportAttachmentSchema = new mongoose.Schema({
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    default: 'application/pdf',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const labReportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    labOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      uppercase: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required for lab report'],
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientGender: {
      type: String,
      default: '',
    },
    patientAge: {
      type: Number,
      default: null,
    },
    patientPhone: {
      type: String,
      default: '',
    },
    referringDoctor: {
      type: String,
      default: 'Consulting Physician',
      trim: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTestCatalog',
      required: true,
    },
    testCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    testName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    sampleType: {
      type: String,
      default: 'Blood',
    },
    barcode: {
      type: String,
      default: '',
    },
    sampleCollectedAt: {
      type: Date,
      default: null,
    },
    sampleReceivedAt: {
      type: Date,
      default: null,
    },
    reportDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    results: [parameterResultSchema],
    overallStatus: {
      type: String,
      enum: ['Normal', 'Abnormal', 'Critical Panic Alert'],
      default: 'Normal',
      index: true,
    },
    criticalAlertAcknowledged: {
      type: Boolean,
      default: false,
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedByName: {
      type: String,
      default: '',
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgementNotes: {
      type: String,
      default: '',
      trim: true,
    },
    interpretation: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    attachments: [labReportAttachmentSchema],
    status: {
      type: String,
      enum: ['Draft', 'Result Entered', 'Verified / Approved', 'Delivered'],
      default: 'Result Entered',
      index: true,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifierName: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    isSyncedToEmr: {
      type: Boolean,
      default: false,
    },
    emrDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalDocument',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const LabReport = mongoose.model('LabReport', labReportSchema);

export default LabReport;
