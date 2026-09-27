const mongoose = require('mongoose');

// Auto-increment counter for asset NO field
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

const assetSchema = new mongoose.Schema({
  no: {
    type: Number,
    unique: true,
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true,
    uppercase: true,
  },
  assetType: {
    type: String,
    trim: true,
    default: '',
    // e.g. PC, Notebook, Printer, Scanner, etc.
  },
  location: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
    // e.g. WAD 1A, WAD 1B, WAD 2A, FARMASI, etc.
  },
  subLocation: {
    type: String,
    trim: true,
    uppercase: true,
    // e.g. KAUNTER, BILIK SISTER, BILIK LASER, UNIT HEMATOLOGI
  },
  building: {
    type: String,
    trim: true,
    uppercase: true,
    enum: ['ACC', 'KWKK', 'MB', ''],
    default: 'MB',
    // ACC = Hospital Canselori, KWKK = Kampus Kesihatan, MB = Main Building
  },
  model: {
    type: String,
    trim: true,
    uppercase: true,
    default: '',
    // e.g. LENOVO THINKCENTRE M710T
  },
  dateTagged: {
    type: Date,
  },
  remarks: {
    type: String,
    enum: ['OK', 'Missing', 'Under Maintenance', 'Disposed', 'Faulty', 'Belum Sign', ''],
    default: 'OK',
  },
  // Additional useful fields
  purchaseDate: {
    type: Date,
  },
  warrantyExpiry: {
    type: Date,
  },
  assignedTo: {
    type: String,
    trim: true,
  },
  ipAddress: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

// Auto-increment 'no' field before saving
assetSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'assetNo' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.no = counter.seq;
  }
  next();
});

// Unique index on serialNumber — case-insensitive to prevent duplicates like 'abc' vs 'ABC'
assetSchema.index(
  { serialNumber: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

// Index for fast search on model and location
assetSchema.index({ model: 'text', location: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
