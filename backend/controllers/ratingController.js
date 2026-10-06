const Rating = require('../models/Rating');
const User = require('../models/User');

const createRating = async (req, res) => {
  try {
    const { toUserId, tripId, stars, review } = req.body;

    if (!toUserId || !tripId || !stars) {
      return res.status(400).json({ message: 'To user ID, trip ID, and stars are required' });
    }

    if (req.userId === toUserId) {
      return res.status(400).json({ message: 'Cannot rate yourself' });
    }

    const existingRating = await Rating.findOne({
      fromUserId: req.userId,
      toUserId,
      tripId
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this user for this trip' });
    }

    const rating = await Rating.create({
      fromUserId: req.userId,
      toUserId,
      tripId,
      stars,
      review: review || ''
    });

    const allRatings = await Rating.find({ toUserId });
    const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0);
    const averageRating = totalStars / allRatings.length;

    await User.findByIdAndUpdate(toUserId, {
      averageRating,
      totalRatings: allRatings.length
    });

    res.status(201).json(rating);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create rating', error: error.message });
  }
};

const getUserRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ toUserId: req.params.userId })
      .populate('fromUserId', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json(ratings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get ratings', error: error.message });
  }
};

module.exports = {
  createRating,
  getUserRatings
};
