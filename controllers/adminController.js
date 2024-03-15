const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Products = require("../model/productsModel");
const Catgories = require("../model/categoryModel");
const bcrypt = require("bcrypt");
const { json } = require("express");

// ============================{ LoadAdminLogin & verifyLogin }============================ \\

const adminLogin = (req, res) => {
  try {
    res.render("adminlogin");
  } catch (error) {
    console.log(error);
    res.status(500).Json({ message: "Internal Server Error" });
  }
};

// verify admin

const verifylogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("2", email, password);
    const adminData = await User.findOne({ email: email });

    if (adminData) {
      console.log(adminData);
      if (adminData.isAdmin === true) {
        const passwordMatch = await bcrypt.compare(
          password,
          adminData.password
        );
        if (passwordMatch) {
          req.session.admin = {
            _id: adminData._id,
            email: adminData.email,
            name: adminData.name,
          };
          console.log("your are admin");

          res.redirect("/admin/adminDashboard");
        } else {
          console.log("incorrect password");
          req.flash("error", "Incorrect Password");
          res.redirect("/admin");
        }
      } else {
        console.log("your not a admin");
        req.flash("error", "Your Not Admin");
        res.redirect("/admin");
      }
    } else {
      console.log("you are not register");
      req.flash("error", "Your Are Not Registered ");
      res.redirect("/admin");
    }
  } catch (error) {
    console.log(error);
  }
};

// ================================= { load Dashboard } =============================== \\
const loadDashboard = async (req, res) => {
  try {
    // Aggregate to get total revenue
    const aggregateResult = await Order.aggregate([
      { $match: { "products.status": "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total_amount" },
        },
      },
    ]);
    const totalRevenue = aggregateResult[0]?.totalRevenue || 0;

    // Fetch all orders
    const orders = await Order.find({})
      .populate("userId")
      .populate("products.productsId");

    // Variables to track order statuses
    let delivered = 0;
    let cancelled = 0;
    let returns = 0;
    let placed = 0;

    // Iterate through orders to count statuses
    orders.forEach((order) => {
      order.products.forEach((pro) => {
        if (pro.status == "delivered") {
          delivered++;
        } else if (pro.status == "placed") {
          placed++;
        } else if (pro.status == "returns") {
          returns++;
        } else {
          cancelled++;
        }
      });
    });

    // Count users with wallets
    const walletUser = await User.countDocuments({
      wallet: { $exists: true, $ne: null },
    });

    // Count total orders, products, categories, and verified users
    const orderCount = await Order.countDocuments({});
    const productCount = await Products.countDocuments({});
    const categoryCount = await Catgories.countDocuments({});
    const usersCount = await User.countDocuments({ verified: true });

    // Count orders with payment method COD and razorpay (paypal) excluding cancelled orders
    const CODcount = await Order.countDocuments({ payment: "COD" });
    const razorpayCount = await Order.countDocuments({
      payment: "paypal",
      status: { $ne: "cancelled" },
    });

    // Calculate monthly revenue
    const currentMonth = new Date();
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );

    const monthly = await Order.aggregate([
      {
        $match: {
          "products.status": "delivered",
          date: { $gte: startOfMonth, $lt: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: "$total_amount" },
        },
      },
    ]);

    const monthlyRevenue = monthly.map((value) => value.monthlyRevenue)[0] || 0;

    // Aggregate to get the total quantity sold for each product
    const topProducts = await Order.aggregate([
      { $unwind: "$products" },
      { $match: { "products.status": "delivered" } },
      {
        $group: {
          _id: "$products.productsId",
          totalQuantitySold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 10 },
    ]);
    console.log("topProducts: ", topProducts);

    // Retrieve product details for the top products
    const topProductsDetails = await Products.find({
      _id: { $in: topProducts.map((product) => product._id) },
    }).populate("categoriesId");
    const topCategories = await Order.aggregate([
      { $unwind: "$products" },
      { $match: { "products.status": "delivered" } },
      {
        $lookup: {
          from: "products",
          localField: "products.productsId",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.categoriesId",
          foreignField: "_id",
          as: "categoryDetails",
        },
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$categoryDetails._id",
          categoryName: { $first: "$categoryDetails.name" },
          totalQuantitySold: { $sum: "$products.quantity" },
        },
      },
      { $sort: { totalQuantitySold: -1 }},
      { $limit: 10 },

    ]);
    const monthlyData = Array.from({ length: 12 }).fill(0);
    console.log("topCategories", topCategories);
    res.render("adminDashboard", {
      monthlyData,
      orders,
      totalRevenue,
      orderCount,
      productCount,
      categoryCount,
      usersCount,
      CODcount,
      razorpayCount,
      monthlyRevenue,
      walletUser,
      delivered,
      placed,
      cancelled,
      returns,
      topProducts,
      topProductsDetails,
      topCategories,
    });
  } catch (error) {
    console.log(error);
    // Handle errors
  }
};

//filtering sales Monthly & yearly

const filterSales = async (req, res) => {
  try {
    const { data } = req.body;
    const desiredMonth = data;
    const startDate = new Date(desiredMonth + "-01T00:00:00Z");
    const endDate = new Date(
      new Date(desiredMonth + "-01T00:00:00Z").getFullYear(),
      new Date(desiredMonth + "-01T00:00:00Z").getMonth() + 1,
      0
    );

    const monthData = await Order.aggregate([
      {
        $match: {
          status: "Placed",
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%d",
              date: "$date",
            },
          },
          totalAmount: { $sum: "$total_amount" },
        },
      },
    ]);

    const newData = Array.from({ length: 30 }).fill(0);
    monthData.forEach((item) => {
      const monthlyIndex = parseInt(item._id, 10) - 1;
      if (monthlyIndex >= 0 && monthlyIndex < 30) {
        newData[monthlyIndex] = item.totalAmount;
      }
    });
    console.log("newData", newData);
    res.json({ newData, data });
  } catch (error) {
    res.status(404).send("Your filter request has failed");
  }
};

// ============================={ LoadUser Management } ======================== \\

const loadUserMangement = async (req, res) => {
  try {
    let page = 1;
    if (req.query.id) {
      page = req.query.id;
    }

    let limit = 6;
    let previous = page > 1 ? page - 1 : 1;
    let next = page + 1;

    const count = await User.find({ isAdmin: false }).count();
    const totalpages = Math.ceil(count / limit);
    if (next > totalpages) {
      next = totalpages;
    }

    const userData = await User.find({ isAdmin: false })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    res.render("userManagement", {
      users: userData,
      page: page,
      next: next,
      previous: previous,
      totalpages: totalpages,
    });
  } catch (error) {
    console.log(error);
  }
};

// ======================== { user blocking } ==================== \\

const userBlock = async (req, res) => {
  try {
    const user_id = req.body.id;
    const userData = await User.findOne({ _id: user_id });

    if (userData.isBlocked) {
      await User.findByIdAndUpdate(
        { _id: user_id },
        {
          $set: {
            isBlocked: false,
          },
        }
      );
    } else {
      await User.findByIdAndUpdate(
        { _id: user_id },
        {
          $set: {
            isBlocked: true,
          },
        }
      );
    }
    res.json({ block: true });
  } catch (error) {
    console.log(error);
  }
};
// orderdetails
const loadOrderDetails = async (req, res) => {
  try {
    let page = 1;
    if (req.query.id) {
      page = req.query.id;
    }

    let limit = 6;
    let previous = page > 1 ? page - 1 : 1;
    let next = page + 1;

    const count = await User.find({ isAdmin: false }).count();
    const totalpages = Math.ceil(count / limit);
    if (next > totalpages) {
      page = totalpages;
    }

    const order = await Order.find({})
      .sort({ date: -1 })
      .populate("userId")
      .populate("products.productsId");
    res.render("orderDetails", {
      order: order,
      previous,
      page,
      next,
      totalpages,
    });
  } catch (error) {
    console.log(error);
  }
};

// ========================={ singleOrder detail }=================== \\

const singleorderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const orderdetails = await Order.findOne({ _id: orderId })
      .populate("products.productsId")
      .populate("userId");
    res.render("singleOrderdetails", { order: orderdetails });
  } catch (error) {
    res.status(400).send("your request is failed");
    console.log(error);
  }
};

// change singleOrderProduct
const changeProductStatus = async (req, res) => {
  try {
    const { orderId, productId, status, userId } = req.body;
    const orderData = await Order.findOneAndUpdate(
      { _id: orderId, userId: userId, "products.productsId": productId },
      {
        $set: { "products.$.status": status },
      }
    );

    res.json({ change: true });
  } catch (error) {
    res.status(400).send("change status falied");
    console.log(error);
  }
};

// Load SalesPage
const LoadSalesPage = async (req, res) => {
  try {
    res.render("sales");
  } catch (error) {
    res.status(400).send("your SalesPage request is failed");
    console.log(error);
  }
};

// ================================{ createSalesReport }======================= \\
const createSalesReport = async (req, res) => {
  try {
     const startDate = new Date(req.body.startDate);
     const endDate = new Date(req.body.endDate);
 
     if (startDate > endDate) {
       // Redirect back to the form page with a query parameter for the message
       return res.redirect(`/admin/sales?message=Start date must be on or before the end date`);
     } else {
       const findorders = await Order.find({
         date: { $gte: startDate, $lt: endDate },
       })
       .populate("userId")
       .populate("products.productsId");
       
       let totalSales = 0
       findorders.forEach(orders =>{
        totalSales += orders.total_amount
       })
       
       res.render("report", { orders: findorders ,totalSales:totalSales});
     }
  } catch (error) {
     res.status(404).send("Your Create Sales Report request failed");
  }
 };
 
 

// adminLogout
const adminlogout = async (req, res) => {
  try {
    req.session.admin = false;
    res.redirect("/admin");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  adminLogin,
  loadDashboard,
  filterSales,
  verifylogin,
  loadUserMangement,
  loadOrderDetails,
  singleorderDetails,
  changeProductStatus,
  createSalesReport,
  LoadSalesPage,
  userBlock,
  adminlogout,
};
