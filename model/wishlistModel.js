const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const wishlistSchema = mongoose.Schema({
  user: {
    type: ObjectId,
    ref: "User",
    require: true,
  },
  products: [
    {
      productId: {
        type: ObjectId,
        ref: "products",
        require: true,
      },
    },
  ],
});





module.exports = mongoose.model('wishlist',wishlistSchema)