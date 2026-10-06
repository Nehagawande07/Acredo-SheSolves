const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true   // do log same phone number se register nahi kar sakte
  },
  email: {
    type: String,
    default: null   // optional hai, isliye required nahi
  },
  profilePhoto: {
    type: String,
    default: null   // photo ka URL/path store hoga, upload baad mein banayenge
  },
  isPhoneVerified: {
    type: Boolean,
    default: false   // OTP verify hone tak false rahega
  },
  idDocumentUrl: {
    type: String,
    default: null   // Gov ID photo ka path (SRS ke hisaab se)
  },
  idVerified: {
    type: Boolean,
    default: false
  },
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true   // ye automatically createdAt aur updatedAt add kar deta hai
});

module.exports = mongoose.model('User', userSchema);