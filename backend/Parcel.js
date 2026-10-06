const mongoose = require('mongoose');

const parcelSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  pickupLocation: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  receiverName: {
    type: String,
    required: true
  },
  receiverPhone: {
    type: String,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  parcelImages: {
    type: [String],
    default: []
  },
  pickupOtp: {
    type: String,
    default: null
  },
  deliveryOtp: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Matched', 'Accepted', 'PickupDone', 'InTransit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Parcel', parcelSchema);
