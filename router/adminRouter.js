
const express = require('express')
const session = require('express-session')
const admin_route = express();
const admin_Controllers = require('../controllers/adminController')
const coupon_Controllers = require('../controllers/couponController')
const products_Controllers = require('../controllers/productsController')
const category_Controllers = require('../controllers/categoriesController')
const AdminAuth = require('../middleware/adminauth')
const multer = require('../middleware/multerConfig')
const config = require('../config/config')

const nocache = require('nocache');

admin_route.use(nocache())
admin_route.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: false }))
admin_route.use(express.json())
admin_route.use(express.urlencoded({ extended: true }))

admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin')


admin_route
  .get('/',AdminAuth.islogout, admin_Controllers.adminLogin) 
  .post('/', admin_Controllers.verifylogin)
  .get('/adminDashboard',AdminAuth.islogin,admin_Controllers.loadDashboard)
  .get('/logout',AdminAuth.islogin, admin_Controllers.adminlogout)

  // ========================{ Load UserManagement }===================== \\

  .get('/ums',AdminAuth.islogin, admin_Controllers.loadUserMangement)
  .post('/userBlock',admin_Controllers.userBlock)


  // ======================={ Products } ======================== \\

  .get('/products',AdminAuth.islogin, products_Controllers.loadproducts)
  .post('/listproducts',products_Controllers.listUnlistproducts)
  .get('/addproducts',AdminAuth.islogin, products_Controllers.loadaddproducts)
  .post('/addproducts',multer.array('images'),products_Controllers.addproducts)
  .get('/editproducts',AdminAuth.islogin, products_Controllers.loadEditProductPage)
  .post('/editproducts',multer.array('images'),products_Controllers.editProducts)


// ======================== { category } ========================= \\

.get('/category', category_Controllers.loadcategory)
.get('/addcategory', category_Controllers.loadaddcategory)
.post('/addcategory',category_Controllers.insertCategory)
.post('/listcategory',category_Controllers.listUnlistcategory)
.get('/edit-category', category_Controllers.loadeditcategorypage)
.post('/edit-category',category_Controllers.editcategory)


// ======================{ order } ================\\
.get('/orderDetails',admin_Controllers.loadOrderDetails)
.get('/single-orderDetails',admin_Controllers.singleorderDetails)
.post('/changeOrderStatus',admin_Controllers.changeProductStatus)

// ======================={ sales }==================\\
.get('/sales',admin_Controllers.LoadSalesPage)
.post('/createReport',admin_Controllers.createSalesReport)

// ======================={ coupon }==================\\
.get('/couponPage',coupon_Controllers.loadCouponlist)
.post('/addCoupon',coupon_Controllers.addCoupon)
.post('/deletCoupon',coupon_Controllers.deleteCoupon)


module.exports = admin_route ;