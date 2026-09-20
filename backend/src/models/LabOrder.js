import mongoose from 'mongoose';

const orderTestItemSchema = new mongoose.Schema({
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
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: [
      'Ordered',
      'Sample Collected',
      'In Lab / Processing',
      'Result Entered',
      'Verified / Approved',
      'Delivered',
      'Cancelled',
    ],
    default: 'Ordered',
  },
});

const labOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    orderType: {
      type: String,
      enum: ['Outpatient (OPD)', 'Inpatient (IPD)', 'Walk-in / Direct', 'Emergency / STAT'],
      default: 'Outpatient (OPD)',
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required for lab order'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    patientPhone: {
      type: String,
      default: '',
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
    referringDoctor: {
      type: String,
      default: 'Consulting Physician',
      trim: true,
    },
    referringDoctorUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    prescriptionNumber: {
      type: String,
      default: '',
      trim: true,
    },
    tests: [orderTestItemSchema],
    priority: {
      type: String,
      enum: ['Routine', 'Urgent', 'Emergency / STAT'],
      default: 'Routine',
      index: true,
    },
    sampleDetails: {
      barcode: {
        type: String,
        uppercase: true,
        trim: true,
        index: true,
      },
      sampleCollectedAt: {
        type: Date,
        default: null,
      },
      collectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      collectorName: {
        type: String,
        default: '',
      },
      sampleCondition: {
        type: String,
        enum: ['Pending', 'Good / Normal', 'Hemolyzed', 'Lipemic', 'Clotted', 'Insufficient Volume'],
        default: 'Pending',
      },
      sampleNotes: {
        type: String,
        default: '',
        trim: true,
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    billingStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Waived'],
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      enum: [
        'Cash',
        'Credit Card',
        'Debit Card',
        'Card',
        'UPI / QR',
        'UPI',
        'Insurance / TPA',
        'Insurance',
        'Hospital Credit',
      ],
      default: 'Cash',
    },
    orderStatus: {
      type: String,
      enum: [
        'Ordered',
        'Sample Collected',
        'In Lab / Processing',
        'Completed',
        'Cancelled',
      ],
      default: 'Ordered',
      index: true,
    },
    clinicalNotes: {
      type: String,
      default: '',
      trim: true,
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const LabOrder = mongoose.model('LabOrder', labOrderSchema);

export default LabOrder;
