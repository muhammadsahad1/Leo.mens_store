const mongoose = require('mongoose')
let ObjectId = mongoose.Schema.Types.ObjectId
const TokenSchema = mongoose.Schema({

  Token :{
    type : String,
    require :true
  },
  UserId : {
    type :ObjectId,
    ref : 'User',
    require : true
  },
  createdAt :{
    type : Date,
    default : Date.now
  }
})

TokenSchema.index({ createdAt : 1} , { expireAfterSeconds : 120})
const Token = mongoose.model('Token',TokenSchema)
module .exports = Token

