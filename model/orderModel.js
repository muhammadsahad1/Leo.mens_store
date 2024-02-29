// const Product = require('../model/productsModel')
const mongoose = require("mongoose");
const OrderSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  delivery_address: {
    type: String,
    required: true,
  },
  user_name: {
    type: String,
    required: true,
  },
  total_amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },

  status: {
    type: String,
  },
  statusLevel: {
    type: Number,
    default: 0,
  },
  payment: {
    type: String,
    required: true,
  },
  cancellationReason: {
    type: String,
    default: "none",
  },
  returnReason: {
    type: String,
    default: "none",
  },
  paymentId: {
    type: String,
  },
  products: [
    {
      productsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },

      quantity: {
        type: Number,
        default: 1,
      },
      totalPrice: {
        type: Number,
        default: 0,
      },
      sizes: {
        type: String,
      },
      cancellationReason: {
        type: String,
        default: "none",
      },
      returnReason: {
        type: String,
        default: "none",
      },

      status: {
        type: String,
        default: "placed",
      },
    },
  ],
});
const OrderModel = mongoose.model("OrderSchema", OrderSchema);

module.exports = OrderModel;
