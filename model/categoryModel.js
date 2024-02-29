const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId
const categorySchema = mongoose.Schema({
  name : {
    type: String,
    required : true
  },
  description : String,
  isList: {
    type:Boolean,
  },
  offer: {
    type: ObjectId,
    ref : 'Offers',
    required: true
}
})

module.exports = mongoose.model('categories',categorySchema)