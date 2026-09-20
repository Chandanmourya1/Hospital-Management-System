import mongoose from 'mongoose';

// Bed Subdocument Schema
const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: [true, 'Bed number is required (e.g. Bed 1, Bed 2)'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance', 'Cleaning'],
      default: 'Available',
      index: true,
    },
    currentAdmission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IpdAdmission',
      default: null,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: true }
);

// Ward & Room Schema
const wardRoomSchema = new mongoose.Schema(
  {
    wardName: {
      type: String,
      required: [true, 'Ward name is required'],
      trim: true,
    },
    wardType: {
      type: String,
      enum: ['General', 'Semi-Private', 'Private', 'ICU', 'Emergency', 'Pediatric'],
      required: [true, 'Ward type is required'],
      index: true,
    },
    floor: {
      type: String,
      default: '1st Floor',
      trim: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number / identifier is required (e.g. GW-101, ICU-201)'],
      unique: true,
      trim: true,
      index: true,
    },
    dailyRate: {
      type: Number,
      required: [true, 'Daily bed rate is required'],
      min: [0, 'Daily rate cannot be negative'],
    },
    beds: [bedSchema],
    isOperational: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property for total beds count
wardRoomSchema.virtual('totalBeds').get(function () {
  return this.beds ? this.beds.length : 0;
});

// Virtual property for available beds count
wardRoomSchema.virtual('availableBeds').get(function () {
  return this.beds ? this.beds.filter((b) => b.status === 'Available').length : 0;
});

// Virtual property for occupied beds count
wardRoomSchema.virtual('occupiedBeds').get(function () {
  return this.beds ? this.beds.filter((b) => b.status === 'Occupied').length : 0;
});

wardRoomSchema.set('toJSON', { virtuals: true });
wardRoomSchema.set('toObject', { virtuals: true });

const WardRoom = mongoose.model('WardRoom', wardRoomSchema);

export default WardRoom;
