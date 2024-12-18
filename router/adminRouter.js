
const express = require('express')
const session = require('express-session')
const admin_route = express();
const admin_Controllers = require('../controllers/adminController')
const coupon_Controllers = require('../controllers/couponController')
const products_Controllers = require('../controllers/productsController')
const category_Controllers = require('../controllers/categoriesController')
const Order_controller = require('../controllers/orderController')
const Offer_controller = require('../controllers/offerController')
const AdminAuth = require('../middleware/adminauth')
const multer = require('../middleware/multerConfig')
const config = require('../config/config')
const flash = require('express-flash')
// const flash = require('connect-flash');
const nocache = require('nocache');

admin_route.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

admin_route.use(flash())
admin_route.use(nocache())
admin_route.use(session({ secret: config.sessionSecret, resave: false, saveUninitialized: false }))
admin_route.use(express.json())
admin_route.use(express.urlencoded({ extended: true }))

admin_route.set('view engine', 'ejs')
admin_route.set('views', './views/admin')


admin_route
  .get('/', AdminAuth.islogout, admin_Controllers.adminLogin)
  .post('/', admin_Controllers.verifylogin)
  .get('/adminDashboard', AdminAuth.islogin, admin_Controllers.loadDashboard)
  .get('/logout', AdminAuth.islogin, admin_Controllers.adminlogout)

  // ========================{ Load UserManagement }===================== \\

  .get('/ums', AdminAuth.islogin, admin_Controllers.loadUserMangement)
  .post('/userBlock', admin_Controllers.userBlock)


  // ======================={ Products } ======================== \\

  .get('/products', AdminAuth.islogin, products_Controllers.loadproducts)
  .post('/listproducts', products_Controllers.listUnlistproducts)
  .get('/addproducts', products_Controllers.loadaddproducts)
  .post('/addproducts', multer.array('images'), products_Controllers.addproducts)
  .get('/editproducts', AdminAuth.islogin, products_Controllers.loadEditProductPage)
  .post('/editproducts', multer.array('images'), products_Controllers.editProducts)


  // ======================== { category } ========================= \\

  .get('/category', AdminAuth.islogin, category_Controllers.loadcategory)
  .get('/addcategory', AdminAuth.islogin, category_Controllers.loadaddcategory)
  .post('/addcategory', category_Controllers.insertCategory)
  .post('/listcategory', category_Controllers.listUnlistcategory)
  .get('/edit-category', AdminAuth.islogin, category_Controllers.loadeditcategorypage)
  .post('/edit-category', category_Controllers.editcategory)


  // ======================{ order } ================\\
  .get('/orderDetails', AdminAuth.islogin, admin_Controllers.loadOrderDetails)
  .get('/single-orderDetails', AdminAuth.islogin, admin_Controllers.singleorderDetails)
  .post('/changeOrderStatus', admin_Controllers.changeProductStatus)

  // ======================={ sales }==================\\
  .get('/sales', AdminAuth.islogin, admin_Controllers.LoadSalesPage)
  .post('/createReport', admin_Controllers.createSalesReport)
  .post('/filter-sales', admin_Controllers.filterSales)

  // ======================={ coupon }==================\\
  .get('/couponPage', AdminAuth.islogin, coupon_Controllers.loadCouponlist)
  .post('/addCoupon', coupon_Controllers.addCoupon)
  .post('/deletCoupon', coupon_Controllers.deleteCoupon)
  .post('/updateCoupon', coupon_Controllers.updateCoupon)

  // =============={ Request from customer }==============\\
  .post('/returnConf', Order_controller.returnConfirm)


  //==============={ offer Managment }===================\\
  .get('/offerPage', AdminAuth.islogin, Offer_controller.loadOffers)
  .post('/addOffer', Offer_controller.addingOffer)
  .post('/applyOfferCat', Offer_controller.applyOfferCat)
  .post('/deletOffer', Offer_controller.deletOffer)
  .post('/applyOffer', Offer_controller.applyOffer)
  .post('/updateOffer', Offer_controller.updateOffer)

//================{ Referral Management }================\\
module.exports = admin_route;