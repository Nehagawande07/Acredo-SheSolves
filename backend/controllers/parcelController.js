const Parcel = require('../models/Parcel');

const createParcel = async (req, res) => {
  try {
    const { pickupLocation, destination, receiverName, receiverPhone, weight } = req.body;

    if (!pickupLocation || !destination || !receiverName || !receiverPhone || !weight) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const parcel = await Parcel.create({
      senderId: req.userId,
      pickupLocation,
      destination,
      receiverName,
      receiverPhone,
      weight,
      status: 'Pending'
    });

    res.status(201).json(parcel);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create parcel', error: error.message });
  }
};

const getMyParcels = async (req, res) => {
  try {
    const parcels = await Parcel.find({ senderId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json(parcels);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get parcels', error: error.message });
  }
};

const getParcelById = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get parcel', error: error.message });
  }
};

const updateParcelStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    parcel.status = status;
    await parcel.save();

    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update parcel', error: error.message });
  }
};

const generatePickupOtp = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (parcel.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (parcel.status !== 'Accepted') {
      return res.status(400).json({ message: 'Parcel must be accepted to generate pickup OTP' });
    }

    const pickupOtp = Math.floor(100000 + Math.random() * 900000).toString();
    parcel.pickupOtp = pickupOtp;
    await parcel.save();

    console.log(`Pickup OTP for parcel ${parcel._id}: ${pickupOtp}`);

    res.status(200).json({ message: 'Pickup OTP generated', devOtp: pickupOtp });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate pickup OTP', error: error.message });
  }
};

const verifyPickupOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (!parcel.tripId) {
      return res.status(400).json({ message: 'Parcel is not assigned to any trip' });
    }

    const Trip = require('../models/Trip');
    const trip = await Trip.findById(parcel.tripId);

    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the traveller can verify pickup OTP' });
    }

    if (parcel.pickupOtp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    parcel.status = 'InTransit';
    parcel.pickupOtp = null;
    
    if (trip && trip.status === 'Published') {
      trip.status = 'InProgress';
      await trip.save();
    }
    
    await parcel.save();

    res.status(200).json({ message: 'Pickup verified', parcel });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify pickup OTP', error: error.message });
  }
};

const generateDeliveryOtp = async (req, res) => {
  try {
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (parcel.senderId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (parcel.status !== 'PickupDone') {
      return res.status(400).json({ message: 'Parcel must be picked up to generate delivery OTP' });
    }

    const deliveryOtp = Math.floor(100000 + Math.random() * 900000).toString();
    parcel.deliveryOtp = deliveryOtp;
    await parcel.save();

    console.log(`Delivery OTP for parcel ${parcel._id}: ${deliveryOtp}`);

    res.status(200).json({ message: 'Delivery OTP generated', devOtp: deliveryOtp });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate delivery OTP', error: error.message });
  }
};

const verifyDeliveryOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const parcel = await Parcel.findById(req.params.id);

    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }

    if (parcel.deliveryOtp !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP' });
    }

    parcel.status = 'Delivered';
    parcel.deliveryOtp = null;
    await parcel.save();

    const Trip = require('../models/Trip');
    const trip = await Trip.findById(parcel.tripId);
    if (trip && trip.status === 'InProgress') {
      trip.status = 'Completed';
      await trip.save();
    }

    res.status(200).json({ message: 'Delivery verified', parcel });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify delivery OTP', error: error.message });
  }
};

module.exports = {
  createParcel,
  getMyParcels,
  getParcelById,
  updateParcelStatus,
  generatePickupOtp,
  verifyPickupOtp,
  generateDeliveryOtp,
  verifyDeliveryOtp
};
