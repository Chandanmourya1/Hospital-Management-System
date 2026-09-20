import mongoose from 'mongoose';

const testParameterSchema = new mongoose.Schema({
  name: {
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
  minNormal: {
    type: Number,
    default: null,
  },
  maxNormal: {
    type: Number,
    default: null,
  },
  criticalLow: {
    type: Number,
    default: null,
  },
  criticalHigh: {
    type: Number,
    default: null,
  },
});

const labTestCatalogSchema = new mongoose.Schema(
  {
    testCode: {
      type: String,
      required: [true, 'Test code is required (e.g. CBC-01)'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    testName: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Hematology',
        'Biochemistry',
        'Microbiology & Serology',
        'Clinical Pathology',
        'Immunology & Endocrinology',
        'Histopathology / Cytology',
        'Other',
      ],
      default: 'Biochemistry',
      index: true,
    },
    department: {
      type: String,
      default: 'Central Diagnostic Laboratory',
      trim: true,
    },
    sampleType: {
      type: String,
      required: [true, 'Sample/specimen type is required (e.g. EDTA Whole Blood, Serum)'],
      trim: true,
    },
    sampleVolume: {
      type: String,
      default: '3 - 5 ml',
      trim: true,
    },
    fastingRequired: {
      type: Boolean,
      default: false,
    },
    turnaroundHours: {
      type: Number,
      default: 12,
      min: 1,
    },
    price: {
      type: Number,
      required: [true, 'Test price is required'],
      min: [0, 'Price cannot be negative'],
    },
    parameters: [testParameterSchema],
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Search indexes
labTestCatalogSchema.index({ testName: 'text', testCode: 'text', description: 'text' });

const LabTestCatalog = mongoose.model('LabTestCatalog', labTestCatalogSchema);

export default LabTestCatalog;
