const User = require("../model/userModel");
const Order = require("../model/orderModel");
const Products = require("../model/productsModel");
const Catgories = require("../model/categoryModel");
const bcrypt = require("bcrypt");

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
    const orders = await Order.find({})
      .populate("userId")
      .populate("products.productsId");
    let delivered = 0;
    let cancelled = 0;
    let returns = 0;
    let placed = 0;
    orders.map((order) => {
      order.products.map((pro) => {
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
    const orderCount = await Order.find({}).count();
    const productCount = await Products.find({}).count();
    const categoryCount = await Catgories.find({}).count();
    const usersCount = await User.find({ verified: true }).count();
    const CODcount = await Order.countDocuments({ payment: "COD" });
    const razorpayCount = await Order.countDocuments({
      payment: "paypal",
      status: { $ne: "cancelled" },
    });
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

    res.render("adminDashboard", {
      orders,
      totalRevenue,
      orderCount,
      productCount,
      categoryCount,
      usersCount,
      CODcount,
      razorpayCount,
      monthlyRevenue,
      delivered,
      placed,
      cancelled,
      returns,
    });
  } catch (error) {
    console.log(error);
  }
};

// ============================={ LoadUser Management }======================== \\

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

    console.log(user_id);
    const userData = await User.findOne({ _id: user_id });

    console.log(userData, "control user.....");

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
    console.log(req.body);
    const { orderId, productId, status, userId } = req.body;
    const orderData = await Order.findOneAndUpdate(
      { _id: orderId, userId: userId, "products.productsId": productId },
      {
        $set: { "products.$.status": status },
      }
    );
    console.log("orderrdataa", orderData);
    console.log(orderData);
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
    console.log(req.body);
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const findorders = await Order.find({
      date: { $gte: startDate, $lt: endDate },
    })
      .populate("userId")
      .populate("products.productsId");

    console.log("fOrder", findorders);
    res.render("report", { orders: findorders });
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
