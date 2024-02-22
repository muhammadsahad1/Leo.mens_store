
const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const walletSchema = mongoose.Schema({
  userId : {
    type : ObjectId,
    ref : 'user',
    require : true
  },
  amount : {
    type : Number,
    default : 0
  },
  walletHistory : {
    type : Array,
    
  }
})

module.exports = mongoose.model('wallet',walletSchema)