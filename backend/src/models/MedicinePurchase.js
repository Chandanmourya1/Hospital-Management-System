import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
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
  manufacturingDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  unitCost: {
    type: Number,
    required: true,
    min: [0, 'Unit cost cannot be negative'],
  },
  mrp: {
    type: Number,
    required: true,
    min: [0, 'MRP cannot be negative'],
  },
  taxPercent: {
    type: Number,
    default: 12,
  },
  totalCost: {
    type: Number,
    required: true,
  },
});

const medicinePurchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    supplier: {
      type: String,
      required: [true, 'Supplier / Vendor name is required'],
      trim: true,
    },
    supplierContact: {
      type: String,
      default: '',
      trim: true,
    },
    invoiceNumber: {
      type: String,
      required: [true, 'Vendor invoice / challan number is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial'],
      default: 'Paid',
    },
    paymentMethod: {
      type: String,
      enum: ['Bank Transfer', 'Cheque', 'Cash', 'Credit / Net 30'],
      default: 'Bank Transfer',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('MedicinePurchase', medicinePurchaseSchema);
