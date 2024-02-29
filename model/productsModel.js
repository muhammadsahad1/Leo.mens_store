const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId;

const productsSchema = mongoose.Schema({
    previousPrice: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    images: {
        type: Array,
        validate: [limit, "you can pass 4 images"]
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    sizes: {
        type: Array
    },
    offer: {
        type: ObjectId,
        ref : 'Offers',
        
        
    },
    discountAmount: {
        type: Number,
        default: 0 // Default value set to 0
    },
    categoriesId: {
        type: ObjectId,
        ref: 'categories',
        required: true
    },
    stockQuantity: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    isListed: {
        type: Boolean,
        required: true
    }
});

function limit(val){
return val.length <= 4
}

module.exports = mongoose.model('products', productsSchema)
