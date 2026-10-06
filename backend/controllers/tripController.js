const Trip = require('../models/Trip');

const createTrip = async (req, res) => {
  try {
    const { source, destination, departureDate, departureTime, vehicleType, totalCapacity, ETA } = req.body;

    if (!source || !destination || !departureDate || !departureTime || !vehicleType || !totalCapacity || !ETA) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const trip = await Trip.create({
      userId: req.userId,
      source,
      destination,
      departureDate,
      departureTime,
      vehicleType,
      totalCapacity,
      availableCapacity: totalCapacity,
      ETA,
      status: 'Published'
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create trip', error: error.message });
  }
};

const getMyTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trips', error: error.message });
  }
};

const getAvailableTrips = async (req, res) => {
  try {
    const { source, destination } = req.query;

    const query = { status: 'Published', availableCapacity: { $gt: 0 } };
    if (source) query.source = source;
    if (destination) query.destination = destination;

    const trips = await Trip.find(query).sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get available trips', error: error.message });
  }
};

const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get trip', error: error.message });
  }
};

const updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this trip' });
    }

    trip.status = status;
    await trip.save();

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update trip', error: error.message });
  }
};

module.exports = {
  createTrip,
  getMyTrips,
  getAvailableTrips,
  getTripById,
  updateTripStatus
};
