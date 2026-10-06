const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  parcelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Parcel',
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  travellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Expired'],
    default: 'Pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

requestSchema.index({ parcelId: 1, tripId: 1 }, { unique: true });

module.exports = mongoose.model('Request', requestSchema);
