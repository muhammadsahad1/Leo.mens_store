// loadCoupon list
const Coupon = require("../model/couponModel");
const User = require("../model/userModel");
const Cart = require("../model/cartModel");

// load couponList

const loadCouponlist = async (req, res) => {
  try {
    const coupon = await Coupon.find({}).sort({startDate : -1})
    res.render("couponPage", { coupon: coupon });
  } catch (error) {
    res.status(404).send("here loadCopan list is failed");
    console.log(error);
  }
};

// adding coupon

const addCoupon = async (req, res) => {
  try {
    console.log("bopdyyyy", req.body);
    const {
      code,
      discountType,
      startDate,
      expirationDate,
      discountAmount,
      minOrderAmount,
    } = req.body;

    const newCoupon = new Coupon({
      couponCode: code,
      discountType: discountType,
      startDate: startDate,
      expiredDate: expirationDate,
      discountAmount: discountAmount,
      minOrderAmount: minOrderAmount,
      active: true,
    });
    console.log("new coupon",newCoupon);
    const newCouponSaved = await newCoupon.save();

    console.log("newCoupon", newCouponSaved);
    res.status(200).json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(404).send("Add coupon request has failed");
  }
};

// Deleting COupons
const deleteCoupon = async (req, res) => {
  try {
    console.log(req.body);
    const { CouponId } = req.body;
    await Coupon.deleteOne({ _id: CouponId });
    res
      .status(200)
      .json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete coupon" });
  }
};

//  ========================={ UI }====================== //

// apply coupon
const applyCoupon = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const currentUser = await User.findOne({ _id: userId });
    const { couponCode } = req.body;
    const userCart = await Cart.findOne({ userid: userId }).populate(
      "products.productsId"
    );
    const product = userCart.products;
    const usedCoupon = await Coupon.findOne({
      couponCode: couponCode,
      userUsed: { $in: [userId] },
    });

    if (usedCoupon) {
      console.log("already used coupon");

      return res.json({ used: true, message: "Coupon is already used" }); // Return to avoid multiple responses
    }

    const currentCoupon = await Coupon.findOne({
      couponCode: couponCode,
    });

    console.log("currentcoupon",currentCoupon);
    const totalAmount = product.reduce(
      (total, product) => total + product.totalPrice,
      0
    );

    console.log(currentCoupon.discountType);
    let lastPrice = 0
    const discountType = currentCoupon.discountType
    if(discountType === "fixed"){

      lastPrice = totalAmount - currentCoupon.discountAmount;

      if (currentCoupon) {
        const today = new Date();
        const couponStartDate = new Date(currentCoupon.startDate);
        const couponEndDate = new Date(currentCoupon.expiredDate);
  
        if (today >= couponStartDate && today <= couponEndDate) {
          // Coupon is valid
          if (totalAmount >= currentCoupon.minOrderAmount) {
      
            const changeTotalPrice = totalAmount - currentCoupon.discountAmount;
        
            return res.json({
              success: true,
              subtotal: changeTotalPrice,
              message: "Coupon applied successfully",
            }); // Return to avoid multiple responses
          } else {
            return res.json({
              limit: true,
              message: `Total amount must be above ${currentCoupon.minOrderAmount}`,
            });
          }
        } else {
          return res.json({ expired: true, message: "Coupon is expired" });
        }
      } else {
        return res.json({ CodeErr: true, message: "Coupon not found" });
      }

    }else if(discountType === "percentage")

    if (currentCoupon) {
      const today = new Date();
      const couponStartDate = new Date(currentCoupon.startDate);
      const couponEndDate = new Date(currentCoupon.expiredDate);

      if (today >= couponStartDate && today <= couponEndDate) {
        // Coupon is valid
        if (totalAmount >= currentCoupon.minOrderAmount) {
    
          const changeTotalPrice = totalAmount - currentCoupon.discountAmount;
      
          return res.json({
            success: true,
            subtotal: changeTotalPrice,
            message: "Coupon applied successfully",
          }); // Return to avoid multiple responses
        } else {
          return res.json({
            limit: true,
            message: `Total amount must be above ${currentCoupon.minOrderAmount}`,
          });
        }
      } else {
        return res.json({ expired: true, message: "Coupon is expired" });
      }
    } else {
      return res.json({ CodeErr: true, message: "Coupon not found" });
    }
  } catch (error) {
    console.error(error);
    return res.json({ CodeErr: true, message: "Coupon not found" });
  }
};

// updating coupon editing
const updateCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      startDate,
      expirationDate,
      discountAmount,
      minOrderAmount,
      couponId,
    } = req.body;
    console.log("req.body", req.body);
    const find = {
      _id: couponId,
    };
    const update = {
      couponCode: code,
      discountType: discountType,
      startDate: startDate,
      expiredDate: expirationDate,
      discountAmount: discountAmount,
      minOrderAmount: minOrderAmount,
    };

    const updatedCoupon = await Coupon.updateOne(find, update);
    console.log("updated ayiii",updatedCoupon);
    res.json({ success: true });
  } catch (error) {
    console.log();
  }
};

// UI coupons lists

const couponLists = async(req,res)=>{
  try {
    const couponList = await Coupon.find({})
    res.render('coupons',{couponList : couponList})
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  loadCouponlist,
  addCoupon,
  deleteCoupon,
  applyCoupon,
  updateCoupon,
  couponLists
};
