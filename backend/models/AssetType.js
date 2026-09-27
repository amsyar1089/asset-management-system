const mongoose = require('mongoose');

const assetTypeSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AssetType', assetTypeSchema);
