
const mongoose = require('mongoose')

const userSchema = mongoose.Schema({

  name: {

    type: String,
    require: true

  },

  email: {

    type: String,
    require: true

  },

  mobile: {

    type: String,
    require: true

  },

  password: {

    type: String,
    require: true

  },

  isAdmin: {

    type: Boolean,
    require: true

  },

  isBlocked: {

    type: Boolean

  },
  verified: {

    type: Boolean

  },

  addresses: [    
    {
    name: { type: String },
    addressline: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: Number },
    phone: { type: Number }

  }   
],
  createdAt: {

    type: Date,
    dafault: Date.now

  },
  wallet : {
    type : Number ,
    default : 0
  },
  walletHistory :[{
    date : {
      type :Date, 
    },
    amount : {
      type : Number ,
    },
    reason : {
      type :String ,
    }
  }]

})

module.exports = mongoose.model('User', userSchema)
