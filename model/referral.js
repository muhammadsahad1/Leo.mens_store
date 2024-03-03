const mongoose = require("mongoose");
const referralSchema = mongoose.Schema({
  
  newUserBonus: {
    type: Number,
    required: true,
    default: 0,
  },
  referredUserBonus: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model("referral", referralSchema);
