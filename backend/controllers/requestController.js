const Request = require('../models/Request');
const Parcel = require('../models/Parcel');
const Trip = require('../models/Trip');

const createRequest = async (req, res) => {
  try {
    const { parcelId, tripId } = req.body;

    if (!parcelId || !tripId) {
      return res.status(400).json({ message: 'Parcel ID and Trip ID are required' });
    }

    const parcel = await Parcel.findById(parcelId);
    const trip = await Trip.findById(tripId);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (parcel.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to create request for this parcel' });
    }

    if (trip.userId.toString() === req.userId) {
      return res.status(400).json({ message: 'Cannot request your own trip' });
    }

    if (trip.status !== 'Published') {
      return res.status(400).json({ message: 'Trip is not available for requests' });
    }

    if (trip.availableCapacity < parcel.weight) {
      return res.status(400).json({ message: 'Not enough capacity available' });
    }

    const existingRequest = await Request.findOne({ parcelId, tripId });
    if (existingRequest) {
      return res.status(400).json({ message: 'Request already exists for this parcel and trip' });
    }

    const request = await Request.create({
      parcelId,
      tripId,
      travellerId: trip.userId,
      status: 'Pending'
    });

    res.status(201).json(request);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Request already exists for this parcel and trip' });
    }
    res.status(500).json({ message: 'Failed to create request', error: error.message });
  }
};

const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ travellerId: req.userId })
      .populate('parcelId')
      .populate('tripId')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get requests', error: error.message });
  }
};

const getRequestsForMyParcels = async (req, res) => {
  try {
    const myParcels = await Parcel.find({ senderId: req.userId }).select('_id');
    const parcelIds = myParcels.map(p => p._id);

    const requests = await Request.find({ parcelId: { $in: parcelIds } })
      .populate('parcelId')
      .populate('tripId')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get requests', error: error.message });
  }
};

const respondToRequest = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.travellerId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    request.status = status;
    request.respondedAt = new Date();

    if (status === 'Accepted') {
      const parcel = await Parcel.findById(request.parcelId);
      const trip = await Trip.findById(request.tripId);

      if (trip.availableCapacity < parcel.weight) {
        return res.status(400).json({ message: 'Not enough capacity available' });
      }

      trip.availableCapacity -= parcel.weight;
      if (trip.availableCapacity === 0) {
        trip.status = 'Full';
      } else if (trip.status === 'Published') {
        trip.status = 'InProgress';
      }
      await trip.save();

      parcel.tripId = trip._id;
      parcel.status = 'Accepted';
      await parcel.save();
    }

    await request.save();
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to request', error: error.message });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getRequestsForMyParcels,
  respondToRequest
};
