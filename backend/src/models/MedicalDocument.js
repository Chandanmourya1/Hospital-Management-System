import mongoose from 'mongoose';

const medicalDocumentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required for medical document'],
      index: true,
    },
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
    },
    title: {
      type: String,
      required: [true, 'Document or test title is required'],
      trim: true,
    },
    documentType: {
      type: String,
      enum: [
        'Diagnostic Report',
        'Pathology / Lab',
        'Radiology / Scan',
        'Prescription',
        'Discharge Summary',
        'Referral Letter',
        'Consent Form',
        'Other',
      ],
      default: 'Diagnostic Report',
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Pathology',
        'Radiology',
        'Cardiology',
        'Surgery',
        'General',
        'External Record',
        'Other',
      ],
      default: 'General',
      index: true,
    },
    documentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    facility: {
      type: String,
      default: 'MedCare Multi-Speciality Hospital',
      trim: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL/path is required'],
    },
    fileName: {
      type: String,
      required: [true, 'Original file name is required'],
    },
    fileType: {
      type: String,
      default: 'application/pdf',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    findings: {
      type: String,
      trim: true,
      default: '',
    },
    isAbnormal: {
      type: Boolean,
      default: false,
      index: true,
    },
    abnormalDetails: {
      type: String,
      trim: true,
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a patient's documents by category and date
medicalDocumentSchema.index({ patient: 1, category: 1, documentDate: -1 });

const MedicalDocument = mongoose.model('MedicalDocument', medicalDocumentSchema);

export default MedicalDocument;
