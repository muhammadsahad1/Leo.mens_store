const mongoose = require('mongoose')


module.exports = {
  connectDB: (() => {

    mongoose.connect('mongodb+srv://muhammadsahad2022:sahad123@cluster0.aigq9jx.mongodb.net/', {

    }).then(() => {
      console.log("connect to Database");
    }).catch((error) => {
      console.log(error);
    })
  })
}