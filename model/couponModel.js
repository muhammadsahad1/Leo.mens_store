  
const mongoose = require('mongoose')
const couponSchema = mongoose.Schema({
  
  couponCode : {
    type : String,
    require : true
  },
  
    discountType : {
      type : String,  
      require : true
    },
    startDate : {
      type : String,
      require : true
    },

    expiredDate : {
      type : String,
      require : true
    },

    discountAmount : {
      type : Number ,
      require : true
    },

    minOrderAmount : {
      type : Number ,
      require : true 
    },
    userUsed : {
      type : Array, 
      ref : 'user',
      default : []
    },
    active : {
      type : Boolean,
      default : false
    }
  

})

module.exports = mongoose.model('Coupon',couponSchema)