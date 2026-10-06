const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  departureDate: {
    type: Date,
    required: true
  },
  departureTime: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    required: true
  },
  totalCapacity: {
    type: Number,
    required: true
  },
  availableCapacity: {
    type: Number,
    required: true
  },
  ETA: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Published', 'Full', 'InProgress', 'Completed', 'Cancelled'],
    default: 'Published'
  }
}, {
  timestamps: true
});

tripSchema.index({ source: 1, destination: 1 });

module.exports = mongoose.model('Trip', tripSchema);
