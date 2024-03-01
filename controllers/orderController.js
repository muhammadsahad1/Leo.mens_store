const Order = require("../model/orderModel");
const User = require("../model/userModel");
const Cart = require("../model/cartModel");
const Product = require("../model/productsModel");
const Coupon = require("../model/couponModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// ======================={ place order }======================== \\
var instance = new Razorpay({
  key_id: "rzp_test_fB02vUjG7B86w1",
  key_secret: "GpMMTQeCJms3hyG5Z3thBSDA",
});

const placeOrders = async (req, res) => {
  try {
    const userid = req.session.user._id;
    const userName = req.session.user.name;
    const { payment_method, Amount, index, couponCode } = req.body;
    console.log("payment_method,", payment_method);
    const Usercart = await Cart.findOne({ userid: userid })
      .populate("userid")
      .populate("products.productsId");

    if (couponCode) {
      await Coupon.updateOne(
        { couponCode: couponCode },
        { $push: { userUsed: userid } }
      );
    }

    const product = Usercart.products;
    const user = await User.findOne({ _id: userid });
    const address = user.addresses[index];
    const delivery_address = `${address.name}, ${address.addressline}, ${address.city}, ${address.state} - ${address.pincode}, Phone: ${address.phone}`;

    
    const status = payment_method === "COD" ? "Placed" : "Pending";
    if (Amount >= 1000 && payment_method === "COD") {
      res.json({ message: "Orders above $1000 are not eligible for cash on delivery." });
      return;
    }
    const date = Date.now();
    const order = new Order({
      userId: userid,
      delivery_address: delivery_address,
      user_name: userName,
      total_amount: Amount,
      date: date,
      status: status,
      payment: payment_method,
      products: product,
    });

    console.log("order savee", order);
    const ordersaved = await order.save();

    if (ordersaved.status === "Placed") {
      await Cart.deleteOne({ userid: userid });

      for (let i = 0; i < product.length; i++) {
        let productsId = product[i].productsId;
        let productquantity = product[i].quantity;
        await Product.updateOne(
          { _id: productsId },
          {
            $inc: {
              stockQuantity: -productquantity,
            },
          }
        );
      }
      console.log("quantity decrease ");
      res.json({ success: true });
    } else if (payment_method === "wallet") {
      if (Amount <= user.wallet) {
        console.log("wallet checked");
        await User.updateOne(
          { _id: userid },
          {
            $inc: { wallet: -Amount },
            $push: {
              walletHistory: {
                date: new Date(),
                amount: Amount,
                reason: "Order payment",
              },
            },
          }
        );
        await Order.updateOne({ _id: ordersaved._id }, { $set: { status: "Placed" } });
        for (let i = 0; i < product.length; i++) {
          let productsId = product[i].productsId;
          let productquantity = product[i].quantity;
          await Product.updateOne(
            { _id: productsId },
            {
              $inc: {
                stockQuantity: -productquantity,
              },
            }
          );
        }
        res.json({ success: true })
        console.log("payment walltil  ninn cheythu");
      } else {
        res.json({ message: 'Insufficient balance in your wallet to complete the payment' })
      }
    } else if (ordersaved.status === "Pending") {
      console.log("kitti pending");
      const option = {
        amount: Amount * 100,
        currency: "INR",
        receipt: "" + ordersaved._id,
      };

      instance.orders.create(option, function (err, order) {
        if (err) {
          console.log(err);
        }
        console.log("order is = ", order);
        res.json({ order: order });
      });

    }
  } catch (error) {
    console.log(error);
  }
}


// verify Payment

const verifyPayment = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { payment, order } = req.body;
    const hmac = crypto.createHmac("sha256", "GpMMTQeCJms3hyG5Z3thBSDA");
    hmac.update(
      payment.razorpay_order_id + "|" + payment.razorpay_payment_id
    );
    const hmacvalue = hmac.digest("hex");

    if (hmacvalue === payment.razorpay_signature) {
      const cart = await Cart.findOne({ userid: userId }).populate(
        "products.productsId"
      );
      const products = cart.products;

      for (let i = 0; i < cart.products.length; i++) {
        const productId = products[i].productsId._id;
        const productQty = products[i].quantity;

        await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { "products.$.StockQuantity": -productQty } }
        );
      }
    
      await Order.findByIdAndUpdate(
        { _id: order.receipt },
        { $set: { status: "Placed", paymentId: payment.razorpay_payment_id } });

      await Cart.deleteOne({ userid: userId });
      res.json({ PaymentSuccess: true });
    } else {
      const changedOrder = await Order.findByIdAndUpdate(
        { _id: order.receipt },
        { $set: { status: " pending" } } 
     );

     console.log("changedOrder",changedOrder);
      res.status(400).json({ error: "Invalid payment signature", PaymentSuccess: false });
    }
  } catch (error) {
    console.error("Error occurred during payment verification:", error);
    res.status(500).json({ error: "An error occurred while verifying the payment", PaymentSuccess: false });
  }
};

// continue failedPayment 
const failedPaymentCountinue = async (req,res)=>{
try {

  const {orderId }= req.body
  const order = await Order.findOne({_id:orderId}).populate('userId')
  const option = {
    amount: order.total_amount* 100,
    currency: "INR",
    receipt: "" + order._id,};

  instance.orders.create(option, function (err, order) {
    if (err) {
      console.log(err);
    }
    console.log("order is = ", order);
    res.json({ order: order });
  });
} catch (error) {
  res.status(400).send('your countine payment request is failed')
  console.log(error);
}
}

// CountinueVerify-payment
const CountinueVerifypayment = async (req,res)=>{
  try {
    const userId = req.session.user._id;
    const { payment, order } = req.body;
    const hmac = crypto.createHmac("sha256", "GpMMTQeCJms3hyG5Z3thBSDA");
    hmac.update(
      payment.razorpay_order_id + "|" + payment.razorpay_payment_id
    );
    const hmacvalue = hmac.digest("hex");

    if (hmacvalue === payment.razorpay_signature) {
      const cart = await Cart.findOne({ userid: userId }).populate(
        "products.productsId"
      );
      const products = cart.products;

      for (let i = 0; i < cart.products.length; i++) {
        const productId = products[i].productsId._id;
        const productQty = products[i].quantity;

        await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { "products.$.StockQuantity": -productQty } }
        );
      }
    
      await Order.findByIdAndUpdate(
        { _id: order.receipt },
        { $set: { status: "Placed", paymentId: payment.razorpay_payment_id } });

      await Cart.deleteOne({ userid: userId });
      res.json({ PaymentSuccess: true });
      console.log("successed");
    } else {
      const changedOrder = await Order.findByIdAndUpdate(
        { _id: order.receipt },
        { $set: { status: " pending" } } 
     );

     console.log("changedOrder",changedOrder);
      res.status(400).json({ error: "Invalid payment signature", PaymentSuccess: false });
    }
  } catch (error) {
    res.status(400).send('your countine payment Verification request is failed')
  }
}


// load Order successpage
const loadorderSuccess = async (req, res) => {
  try {
    res.render("orderSuccessPage");
  } catch (error) {
    console.log(error);
  }
};

// order Details

const LoadMyOrders = async (req, res) => {
  try {
    const userid = req.session.user._id;
    const Amount = req.query.id;
    console.log("Amounttttttt",Amount);
    const orderDetails = await Order.find({ userId: userid }).populate("userId").sort({date : -1})
    res.render("myOrder", { order: orderDetails ,Amount:Amount});
  } catch (error) {
    console.log(error);
  }
};

// singleOrder Details

const SingleOrderDetail = async (req, res) => {
  try {
    const userId = req.session.user._id;
    if (userId) {
      const { orderId } = req.query;
      
      const SingleOrder = await Order.findById({ _id: orderId })
        .populate("userId")
        .populate("products.productsId");

      console.log("singleOrder" + SingleOrder);
      res.render("orderDetails", { myOrder: SingleOrder ,order : SingleOrder});
    }
  } catch (error) {
    console.log(error);
  }
};

// single productOrderDetail

const singleOrderProduct = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId, index, orderId } = req.query;

    const detalis = await Order.findOne({ _id: orderId, userId: userId })
      .populate("userId")
      .populate("products.productsId");

    const address = detalis.delivery_address;
    const product = await detalis.products.find(
      (product, i) => i == parseInt(index)
    );

    res.render("singleOrderProduct", {
      address: address,
      product: product,
      productId: productId,
      orderId: orderId,
      order: detalis,
      index: index,
    });
  } catch (error) {
    res.status(400).send("single product order detail request is failed");
    console.log(error);
  }
};

// cancel orderProduct

const cancelOrder = async (req, res) => {
  try {
    const { orderId, productId, cancellationReason } = req.body;

    const orderdetails = await Order.findOneAndUpdate(
      { _id: orderId, "products.productsId": productId },
      {
        $set: {
          "products.$.status": "cancelled",
          "products.$.cancellationReason": cancellationReason,
        },
      }
    );

    const productdetail = await Order.findOne(
      { _id: orderId, "products.productsId": productId },
      { "products.$": 1 }
    );

    const productQty = productdetail.products[0].quantity;
    console.log(productQty);
    await Product.updateOne(
      { _id: productId },
      { $inc: { stockQuantity: productQty } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(404).send("Cancel order Product request failed");
    console.error(error);
  }
};

// return order
const returnReason = async (req, res) => {
  try {
    console.log("ssssssss");
    const { orderId, productId, returnReason } = req.body;
    await Order.findOneAndUpdate(
      { _id: orderId, "products.productsId": productId },
      {
        $set: {
          "products.$.returnReason": returnReason,
          "products.$.status": "ReturnedRequested",
        },
      }
    );
    console.log("passed");
    res.json({ reason: true });
  } catch (error) {
    res.status(400).send("request is failed");
  }
};

// return conformation
const returnConfirm = async (req, res) => {
  try {
    const { orderId, productId, status, userId } = req.body;
    const orderData = await Order.findOne({ _id: orderId });
    const products = orderData.products;

    if (status === "Requestcancel") {
      await Order.updateOne(
        { _id: orderId, "products.productsId": productId },
        {
          $set: {
            "products.$.status": "delivered",
          },
        }
      );
    } else if (status === "Requestapproved") {
      await Order.updateOne(
        { _id: orderId, "products.productsId": productId },
        {
          $set: {
            "products.$.status": status,
          },
        }
      );
    }
    for (let i = 0; i < products.length; i++) {
      let proId = products[i].productsId;
      let qtyCount = products[i].quantity;
      await Product.updateOne(
        { _id: proId },
        { $inc: { stockQuantity: qtyCount } }
      );
    }
    const totalOrderAmount = orderData.total_amount;
    await User.updateOne(
      { _id: userId },
      {
        $inc: { wallet: totalOrderAmount },
        $push: {
          walletHistory: {
            date: new Date(),
            amount: totalOrderAmount,
            reason: "Order returned",
          },
        },
      }
    );
    res.json({ isOk: true });
  } catch (error) {
    res.status(404).send("returnConfirmation request is failed");
    console.log(error);
  }
};



module.exports = {
  placeOrders,
  verifyPayment,
  failedPaymentCountinue,
  CountinueVerifypayment,
  loadorderSuccess,
  LoadMyOrders,
  SingleOrderDetail,
  singleOrderProduct,
  cancelOrder,
  returnReason,
  returnConfirm,
  // loadSingleOrder
};
