const express = require("express");
const user_route = express();
const users_controller = require("../controllers/userController");
const product_controller = require("../controllers/productsController");
const Cart_controller = require("../controllers/cartController");
const Order_controller = require("../controllers/orderController");
const Coupon_Controller = require("../controllers/couponController");
const Count = require('../middleware/cartwishlistCount')
const Wishlist_controller = require("../controllers/wishlistController");
const session = require("express-session");
const config = require("../config/config");
const auth = require("../middleware/auth");
const nocache = require("nocache");
const flash = require("express-flash");
// const flash = require('connect-flash');

user_route.set("view engine", "ejs");
user_route.set("views", "./views/users");

user_route.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);
const path = require("path");
user_route.use(nocache());
user_route.use(express.static(path.join(__dirname, "public/assets")));
user_route
  .use(flash())

  .use(express.json())
  .use(express.urlencoded({ extended: true }));

user_route.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.logedIn = req.session.user ? true : false;
  next();
});
user_route.use((req, res, next) => {
  res.locals.messages = req.flash();
  next();
});

user_route
  .get("/",Count.wishlistCartCount, users_controller.loadhome)

  // Login page
  .get("/login", users_controller.loadLogin)
  .post("/login", auth.islogin, users_controller.verifyLogin)

  // register page
  .get("/register", users_controller.loadRegister)
  .post("/register", users_controller.insertuser)

  // otp page & verification
  .get("/otp", users_controller.loadOtp)
  .post("/otp", users_controller.userVerifyotp)
  .post("/resend", users_controller.resendOtp)

  // forget password
  .get("/forgetPassword", users_controller.loadforgotpass)
  .post("/forgetPassword", users_controller.forgetPassword)
  .get("/reset-password/:userId/:token", users_controller.loadresetPass)
  .post("/reset-password", users_controller.resetpassword)

  // Shop page showing products & details
  .get("/productsshop",Count.wishlistCartCount, product_controller.loadshoppage)
  .get("/productdetails",Count.wishlistCartCount, product_controller.productdetailspage)

  // user profile & address manage
  .get("/Userprofile",Count.wishlistCartCount, users_controller.loadProfilepage)
  .post("/edit-profile", users_controller.editProfile)
  .post("/change-password", users_controller.changePassword)
  .get("/manageAddress",Count.wishlistCartCount, users_controller.loadaddressManage)
  .post("/Add-address", users_controller.AddAddress)
  .delete("/deletaddress", users_controller.deletaddress)
  .post("/update-address", users_controller.updateaddress)

  // wallet
  .get("/wallet",Count.wishlistCartCount, users_controller.LoadWallet)
  .post("/addMoneyTowallet", users_controller.credingMoneytoWallet)

  // .post('/addMoneyToWallet',users_controller.addMoneywallet)

  // Usercart
  .get("/Cartpage",Count.wishlistCartCount, Cart_controller.loadcart)
  .post("/Add-to-Cart", Cart_controller.AddCart)
  .post("/remove-cartproduct", Cart_controller.cartRemover)
  .post("/updateQuantity", Cart_controller.updateQuantity)

  // process to checkout
  .get("/checkout",Count.wishlistCartCount, Cart_controller.loadCheckout)

  // after failure online payment
  .post("/countinuePayment", Order_controller.failedPaymentCountinue)
  .post("/CountinueVerify-payment", Order_controller.CountinueVerifypayment)
  // place order
  .post("/place-Order", Order_controller.placeOrders)
  .get("/orderSuccessPage", auth.islogin,Count.wishlistCartCount, Order_controller.loadorderSuccess)
  .post("/verify-payment", Order_controller.verifyPayment)

  // User Order
  .get("/myOrder", auth.islogin, Count.wishlistCartCount, Order_controller.LoadMyOrders)
  .get("/single-product", auth.islogin, Count.wishlistCartCount, Order_controller.singleOrderProduct)
  .post("/cancel-product", Order_controller.cancelOrder)
  .post("/return-reason", Order_controller.returnReason)
  .get("/single-orderDetails", auth.islogin, Count.wishlistCartCount, Order_controller.SingleOrderDetail)

  // invoice
  .get("/invoice", auth.islogin, Count.wishlistCartCount, users_controller.LoadInvoicePage)

  // Get wishlist
  .get("/wishlist", auth.islogin, Count.wishlistCartCount, Wishlist_controller.LoadWishlist)
  .post("/addWishlist", Wishlist_controller.AddWishlist)
  .post("/removeWishlist", Wishlist_controller.removeWishlist)
  .get("/getWishlist", auth.islogin,  Wishlist_controller.getWishlist)

  //applyCOupon
  .post("/applyCouponCode", Coupon_Controller.applyCoupon)

  // payment policy
  .get("/payment-policy",Count.wishlistCartCount, Order_controller.loadPolicyPage)
  
  // coupon
  .get('/coupons',auth.islogin, Count.wishlistCartCount,Coupon_Controller.couponLists)
  // contact
  .get("/contact",Count.wishlistCartCount, users_controller.contactPage)
  
  // about
  .get("/about",Count.wishlistCartCount, users_controller.about)

  // logout
  .get("/logout", users_controller.userlogout); 

module.exports = user_route;