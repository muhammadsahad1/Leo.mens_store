const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const userOtpverificaton = require("../model/userOtpVerification");
const Products = require("../model/productsModel");
const Token = require("../model/tokenModel");
const Order = require("../model/orderModel");

// ================= LoadHome

const loadhome = async (req, res) => {
  try {
    const showproducts = await Products.find({ isListed: true }).populate(
      "categoriesId");
    const id = req.session.user;
    const user = await User.findOne({ _id: id });
    res.render("home", { products: showproducts, user: user });
  } catch (error) {
    console.log(error);
  }
};

// =============================================={ User Login }========================================== \\

const loadLogin = (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error);
  }
};

// ============================================== User signup & otp verification ========================================== \\

// user register page

const loadRegister = (req, res) => {
  try {
    res.render("register");
  } catch (error) {
    console.log(error);
  }
};
// password hased
const securepassword = async (password) => {
  try {
    const securepass = await bcrypt.hash(password, 10);
    return securepass;
  } catch (error) {
    console.log(error.message);
  }
};

// ===================== insertuser

const insertuser = async (req, res) => {
  try {
    const user_name = await User.findOne({ name: req.body.name });
    const user_email = await User.findOne({ email: req.body.email });
    const confirmpass = req.body.confirm_password;
    const password = req.body.password;
    console.log(confirmpass, password);

    if (password !== confirmpass) {
      req.flash("passErr", "must match to password");
      console.log("not matching");
      res.redirect("/register");
    }

    console.log(confirmpass);
    if (user_name) {
      console.log("name is already exists");

      req.flash("nameerror", "Name is already exists");
      res.redirect("/register");
    } else if (user_email) {
      console.log("email is already exists");

      req.flash("emailerror", "sorry, email is already exists ");
      res.redirect("/register");
    } else {
      const securepass = await securepassword(req.body.password);
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        mobile: req.body.mobile,
        password: securepass,
        createdAt: Date.now(),
        isAdmin: false,
        isBlocked: false,
        verified: false,
      });
      await user.save();
      sentOtpVerificaton(user, res);
    }
  } catch (error) {
    console.log(error);
  }
};

// ===================== otpverification
const sentOtpVerificaton = async ({ email }, res) => {
  try {
    const transpoter = nodemailer.createTransport({
      service: "gmail",
      host: "smpt.gmail.com",
      port: 587,
      secure: true,
      auth: {
        user: "muhammadsahad2022@gmail.com",
        pass: "rrmd vujf rccg dwae",
      },
    });

    const otp = `${Math.floor(1000 + Math.random() * 9000)}`;

    // mail options
    const mailopton = {
      from: "muhammadsahad2022.gmail.com",
      to: email,
      subject: "Verify your email",
      html: `Your otp is :${otp}`,
    };

    // hashOtp
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newOtpverificaton = await new userOtpverificaton({
      email: email,
      otp: hashedOtp,
    });

    // ===================== save otp
    console.log(newOtpverificaton);

    await newOtpverificaton.save();
    await transpoter.sendMail(mailopton);

    res.redirect(`/otp?email=${email}`);
  } catch (error) {
    console.log(error.message);
  }
};

// =================== user Otp page

const loadOtp = (req, res) => {
  try {
    const email = req.query.email;
    console.log(email);
    res.render("otp", { email: email });
  } catch (error) {
    console.log(error);
  }
};

// ============================= verify otp

const userVerifyotp = async (req, res) => {
  try {
    const email = req.body.email;
    console.log("email", email);

    const OTP =
      req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4;

    const userOtpVerification = await userOtpverificaton.findOne({
      email: email,
    });
    console.log("userOtpverificaton", userOtpVerification);

    if (!userOtpVerification) {
      console.log("otp is expired");

      req.flash("otpexpired", "Otp is expired try again verify");
      req.flash("notvalid", "register again its not a valid email");
      res.redirect("/register");

      return;
    }

    const { otp: hashedOtp } = userOtpVerification;
    const validOtp = await bcrypt.compare(OTP, hashedOtp);

    if (validOtp) {
      console.log("valid");
      const userData = await User.findOne({ email: email });
      if (userData) {
        await User.findByIdAndUpdate(
          {
            _id: userData._id,
          },
          {
            $set: {
              verified: true,
            },
          }
        );
      }

      //  delete the otprecord

      const user = await User.findOne({ email: email });
      await userOtpVerification.deleteOne({ email: email });
      if (user.verified) {
        if (!user.isBlocked) {
          req.session.user = {
            _id: user._id,
            email: user.email,
            name: user.name,
          };
          console.log(req.session.user);
          console.log(user.name);
          req.flash("successmsg", "Hey, Sign up successfull");
          res.redirect("/login");
        } else {
          console.log("you were blocked from this site");

          req.flash("userblock", "you were blocked from this site");

          res.redirect("/register");
        }
      }
    } else {
      console.log("reason");
      console.log("otp is incorrect you have again verify");

      req.flash("incorrectOtp", "otp is incorrect you have try again");
      res.redirect("/register");
    }
  } catch (error) {
    console.log(error);
  }
};

// ==================== resent otp

const resendOtp = async (req, res) => {
  try {
    const Useremail = req.query.email;
    await userOtpverificaton.deleteMany({ email: Useremail });
    if (Useremail) {
      console.log("::", Useremail);
      sentOtpVerificaton(
        {
          email: Useremail,
        },
        res
      );
    } else {
      console.log("user email not providing in query");
    }
  } catch (error) {
    console.log(error);
  }
};

// =================================={ VerifyLogin }============================= \\

const verifyLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    console.log("user : ", user);
    if (user) {
      const passMatch = await bcrypt.compare(password, user.password);
      if (passMatch) {
        if (user.verified) {
          console.log("userrrrr");
          if (!user.isBlocked) {
            req.session.user = {
              _id: user.id,
              email: user.email,
              name: user.name,
              mobile: user.mobile,
            };
            console.log(req.session.user);
            console.log("Welcome to Home : ", user.name);
            res.redirect("/");
          } else {
            console.log("user blocked from this site");
            req.flash("userBlock", "your were blocked from this site");
            res.redirect("/login");
          }
        } else {
          console.log(".");
          sentOtpVerificaton(user, res);
        }
      } else {
        console.log("incorrect password");
        req.flash("incorrectpass", "password incorrect");
        res.redirect("/login");
      }
    } else {
      console.log("User Not Found");
      req.flash("notfound", "user not found");
      res.redirect("/login");
    }
  } catch (error) {
    console.log(error);
  }
};

// ========================================= { user profile } ============================ \\

const loadProfilepage = async (req, res) => {
  try {
    const userid = req.session.user._id;
    const finduser = await User.findById(userid);
    res.render("Userprofile", { user: finduser });
  } catch (error) {
    console.log(error);
  }
};

// =================== manageaddress

const loadaddressManage = async (req, res) => {
  try {
    const userid = req.session.user._id;
    const user = await User.findById(userid);
    const address = user.addresses;
    res.render("manageAddress", { user: user, address: address });
  } catch (error) {
    console.log(error);
  }
};

// insert Address

const AddAddress = async (req, res) => {
  try {
    const id = req.session.user._id;
    const { fullname, address, city, state, postcode, phone, email } = req.body;
    console.log("getting data from body" + fullname);
    console.log("phone : ", phone);
    await User.updateOne(
      { email: email },
      {
        $push: {
          addresses: {
            name: fullname,
            addressline: address,
            city: city,
            state: state,
            pincode: postcode,
            phone: phone,
          },
        },
      }
    );
    // console.log("user emaill : " + useremail);
    console.log("worked");
    res.json({ add: true });
  } catch (error) {
    console.log(error);
  }
};

// deleteAddress

const deletaddress = async (req, res) => {
  try {
    const { userId, addressId } = req.body;
    if (!userId) {
      console.log("there is no user ID");
    } else {
      await User.findByIdAndUpdate(
        { _id: userId, "addresses._id": addressId },
        { $pull: { addresses: { _id: addressId } } }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).send("request is failed ");
    console.log(error);
  }
};

// Edit Address
const updateaddress = async (req, res) => {
  try {
    const { name, addressline, city, state, pincode, phone, addressId } =
      req.body;
    console.log("req body :", req.body);

    const find = {
      "addresses._id": addressId,
    };

    const update = {
      "addresses.$.name": name,
      "addresses.$.addressline": addressline,
      "addresses.$.city": city,
      "addresses.$.state": state,
      "addresses.$.pincode": pincode,
      "addresses.$.phone": phone,
    };

    await User.updateOne(find, update);
    res.json({ success: true });
    console.log("updated");
  } catch (error) {
    res.status(400).send("edit request is failed");
    console.log(error);
  }
};

// editProfile

const editProfile = async (req, res) => {
  try {
    const email = req.session.user.email;
    console.log(req.body);
    const Newname = req.body.name;
    const Newphone = req.body.phone;

    const existsUser = await User.findOne({ name: Newname });
    const user = await User.findOneAndUpdate(
      { email: email },
      { $set: { name: Newname, mobile: Newphone } },
      { new: true }
    );
    if (!user.name === Newname || user.name === Newname) {
      res.json({ edited: true, user: user });
      console.log("workeddd updated");
      console.log(Newname);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ edited: false, message: "Internal server error" });
  }
};

// UserProfile reset password

const changePassword = async (req, res) => {
  try {
    const { userEmail, OldPass, ConfirmPass } = req.body;
    const user = await User.findOne({ email: userEmail });
    console.log("user =", user);
    const matchpassword = await bcrypt.compare(OldPass, user.password);
    if (!matchpassword) {
      res.json({ reseted: false });
    } else {
      const passwordSame = await bcrypt.compare(OldPass, ConfirmPass);
      if (passwordSame || ConfirmPass === OldPass) {
        res.json({ reseted: false });
      } else {
        const securepass = await securepassword(ConfirmPass);
        await User.updateOne(
          { email: userEmail },
          { $set: { password: securepass } }
        );
        res.json({ reseted: true });
      }
    }
    console.log("workinmg");
  } catch (error) {
    console.log(error);
  }
};

// forgetPassword
const loadforgotpass = async (req, res) => {
  try {
    res.render("forgetPassword");
  } catch (error) {
    console.log(error);
  }
};

// resetPassword

const resetpass = async (email, res) => {
  try {
    email = email;
    console.log("emaill", email);
    const user = await User.findOne({ email: email });
    if (!user) {
      res.status(400).send("User with this email is not existing");
    }
    let token = await Token.findOne({ userId: user._id });
    if (!token) {
      token = await new Token({
        userId: user._id,
        Token: crypto.randomBytes(32).toString("hex"),
      });
      token.save();
    }
    const transpoter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 456,
      secure: true,
      auth: {
        user: "muhammadsahad2022@gmail.com",
        pass: "nysw epuv ixjd aosf",
      },
    });
    const resetpage = `http://localhost:3001/reset-password/${user._id}/${token.Token}`;

    const mailoption = {
      from: "muhammadsahad2022@gmail.com",
      to: email,
      subject: "Verify your emai",
      html: `You resetpassword link is ${resetpage}`,
    };
    await transpoter.sendMail(mailoption);
  } catch (error) {
    console.log(error);
  }
};

const forgetPassword = async (req, res) => {
  try {
    const email = req.body.mail;
    await resetpass(email);
    req.flash("success", "Sent reset password link to your email");
    res.redirect("/login");
  } catch (error) {
    res.status(400).send("reset password request is failed");
    console.log(error);
  }
};

const loadresetPass = async (req, res) => {
  try {
    const userid = req.params.userId;
    const token = req.params.token;
    // console.log("///",userid,"t",token);
    res.render("reset-password", { userId: userid, token: token });
  } catch (error) {
    res.status(400).send("resestpage request is failed");
    console.log(error);
  }
};

// resetpassword
const resetpassword = async (req, res) => {
  try {
    const userid = req.body.userId;
    const token = req.body.token;
    const ConfirmPassword = req.body.confirmpassword;
    const user = await User.findOne({ _id: userid });
    if (!user) {
      res.status(400).send("resetpassword request is failed");
    }
    let { email } = user;
    let tok = await Token.findOne({ Token: token }, { UserId: userid });
    if (!tok) {
      res.status(400).send("Invalid link or expire");
    }
    const securepass = await securepassword(ConfirmPassword);

    await User.updateOne(
      { email: email },
      {
        $set: { password: securepass },
      }
    );
    req.flash("newsuccess", "New password successfully added");
    res.redirect("/login");
  } catch (error) {
    console.log(error);
  }
};

// Load invoice page

const LoadInvoicePage = async (req, res) => {
  try {
    const { orderid, index, productId } = req.query;
    const order = await Order.findOne({ _id: orderid });
    const ORDER = await Order.findOne({ _id: orderid });
    const Product = await Products.findOne({ _id: productId });

    res.render("invoice", {
      product: Product,
      Order: ORDER,
      order: order.products[index],
      deliveryAddress: order.delivery_address,
    });
  } catch (error) {
    res.status(404).send("INVOICE REQUEST HAS FAILED");
  }
};

// Load Wallet
const LoadWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const userData = await User.findOne({ _id: userId });
    const name = userData.name;
    const walletHistory = userData.walletHistory
    const walletAmount = userData.wallet;
    res.render("walletPage", { name: name, walletAmount : walletAmount ,walletHistory :walletHistory});
  } catch (error) {
    res.status(404).send("request failed"); 
  }
};

// Add money to wallet 
// const addMoneywallet = async(req,res)=>{
//   try {
//     const { money }=req.body;
//   } catch (error) {
//     console.log(error);
//   }
// }

//=========== userlogout \\

const userlogout = async (req, res) => {
  try {
    req.session.user = null;
    res.redirect("/");
  } catch (error) {}
};

// exporting here

module.exports = {
  loadLogin,
  loadRegister,
  insertuser,
  loadhome,
  loadOtp,
  resendOtp,
  userVerifyotp,
  verifyLogin,
  loadProfilepage,
  editProfile,
  loadforgotpass,
  changePassword,
  loadaddressManage,
  AddAddress,
  updateaddress,
  deletaddress,
  resetpass,
  forgetPassword,
  loadresetPass,
  resetpassword,
  LoadInvoicePage,
  LoadWallet,
  // addMoneywallet,
  userlogout,
};
