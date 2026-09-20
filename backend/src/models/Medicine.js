import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Batch quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0,
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative'],
  },
  mrp: {
    type: Number,
    required: [true, 'MRP / Selling price is required'],
    min: [0, 'MRP cannot be negative'],
  },
  manufacturingDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    index: true,
  },
  supplier: {
    type: String,
    default: 'Central Distributor',
    trim: true,
  },
});

const medicineSchema = new mongoose.Schema(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Medicine brand name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic composition name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Antibiotic',
        'Analgesic / Antipyretic',
        'Antidiabetic',
        'Cardiovascular',
        'Antacid / PPI',
        'Respiratory',
        'Antihistamine',
        'Vitamins / Minerals',
        'Emergency / Critical',
        'Other',
      ],
      default: 'Other',
      index: true,
    },
    dosageForm: {
      type: String,
      enum: [
        'Tablet',
        'Capsule',
        'Syrup',
        'Injection',
        'Ointment',
        'Inhaler',
        'Drops',
        'IV Fluid',
        'Suspension',
        'Other',
      ],
      default: 'Tablet',
      index: true,
    },
    strength: {
      type: String,
      default: '',
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true,
    },
    rackLocation: {
      type: String,
      default: 'General Shelf A-1',
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, 'Cost price per unit is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    mrp: {
      type: Number,
      required: [true, 'Maximum Retail Price (MRP) is required'],
      min: [0, 'MRP cannot be negative'],
    },
    taxPercent: {
      type: Number,
      default: 12, // 12% standard GST on pharmaceuticals
      min: 0,
      max: 100,
    },
    reorderLevel: {
      type: Number,
      default: 50,
      min: [0, 'Reorder level cannot be negative'],
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    batches: [batchSchema],
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: auto-compute currentStock from batches
medicineSchema.pre('save', function (next) {
  if (this.batches && Array.isArray(this.batches)) {
    this.currentStock = this.batches.reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
  }
  next();
});

export default mongoose.model('Medicine', medicineSchema);
