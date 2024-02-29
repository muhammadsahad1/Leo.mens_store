const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const offerSchema = mongoose.Schema({
  title: {
    type: String,
    require: true,
  },
  description: {
    type: String,
    require: true,
  },
  discountType: {
    type: String,
    require: true,
  },
  discountAmount: {
    type: Number,
    require: true,
  },
  startDate: {
    type: String,
    require: true,
  },
  endDate: {
    type: String,
    require: true,
  },

  usageLimit: {
    type: Number,
  },
  usageCount: {
    type: Number,
    default: 0,
  }, 
  active: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Offers", offerSchema);
