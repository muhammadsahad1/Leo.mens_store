const mongoose = require('mongoose')
const CartSchema = mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  products: [
    {
      productsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        require: true
      },
      price: {
        type: Number,
        require: true
      },
      quantity: {
        type: Number,
        default: 1
      },
      totalPrice: {
        type: Number,
        require: true
      },
      sizes : {
        type : String
        
      }

    }
  ]

})

const Cartproducts = mongoose.model('Cartproducts',CartSchema);
module.exports = Cartproducts;