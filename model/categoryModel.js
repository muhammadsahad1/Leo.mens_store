const mongoose = require('mongoose')

const categorySchema = mongoose.Schema({
  name : {
    type: String,
    required : true
  },
  description : String,
  isList: {
    type:Boolean,
  }
})

module.exports = mongoose.model('categories',categorySchema)