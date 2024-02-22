
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, files, cb) {
    cb(null, path.join(__dirname, '../public/assets/img/product/original'))

  }, filename: function (req, file, cb) {

    const name = Date.now() + '-' + file.originalname;
    cb(null, name)

  }

})
const upload = multer({ storage: storage })
module.exports = upload