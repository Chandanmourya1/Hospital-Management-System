import mongoose from 'mongoose';

const billItemSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  medicineName: {
    type: String,
    required: true,
    trim: true,
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true,
  },
  expiryDate: {
    type: Date,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative'],
  },
  taxPercent: {
    type: Number,
    default: 12,
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  itemTotal: {
    type: Number,
    required: true,
  },
});

const pharmacyBillSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    billType: {
      type: String,
      enum: ['Outpatient (OPD)', 'Inpatient (IPD)', 'Walk-in / Retail'],
      default: 'Walk-in / Retail',
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    patientName: {
      type: String,
      required: [true, 'Patient or customer name is required'],
      trim: true,
    },
    patientPhone: {
      type: String,
      default: '',
      trim: true,
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OpdVisit',
      default: null,
    },
    prescriptionNumber: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    doctorName: {
      type: String,
      default: 'Attending Physician',
      trim: true,
    },
    items: [billItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTax: {
      type: Number,
      default: 0,
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
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Refunded'],
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Credit Card', 'Debit Card', 'Card', 'UPI / QR', 'UPI', 'Insurance / TPA', 'Insurance', 'Bank Transfer'],
      default: 'Cash',
    },
    billedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dispensedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('PharmacyBill', pharmacyBillSchema);
