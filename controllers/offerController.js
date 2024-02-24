const Offers = require("../model/offerModel");
const Product = require('../model/productsModel');
const categroy = require('../model/categoryModel')

// Load Offer Mangament

const loadOffers = async (req, res) => {
  try {
    const categories = await categroy.find({});
    const products = await Product.find({});
    const offerList = await Offers.find({});
    res.render("offerPage", { offer: offerList,products:products, categories,categories});
  } catch (error) {
    res.status(404).send("Load offers page request is failed");
    console.log(error);
  }
};

// ========================== > Add Offers
const addingOffer = async (req, res) => {
  try {
    console.log("body >>>> ", req.body);
    const {
      title,
      description,
      discountType,
      discountAmount,
      startDate,
      endDate,
      productId,
      categoryId,
      usageLimit,
      usageCount,
    } = req.body;
    const newOffer = new Offers({
      title: title,
      description: description,
      discountType: discountType,
      discountAmount: discountAmount,
      startDate: startDate,
      endDate: endDate,
      products: productId,
      categories: categoryId,
      usageLimit: usageLimit,
      usageCount: usageCount,
    });

    // Save the new offer
    const offer = await newOffer.save();
    // Send success response
    res.json({ saved: true });

    // Log the newly created offer
    console.log("New Offer Created", offer);
  } catch (error) {
    // Handle error and send appropriate response
    console.error("Error creating offer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ======================= > Delete Offer

const deletOffer = async (req, res) => {
  try {
    const { offerId } = req.body;
    await Offers.deleteOne({ _id: offerId });
    res.status(200).json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    res.status(404).send("delet offer request failed");
  }
};

module.exports = {
  loadOffers,
  addingOffer,
  deletOffer,
};
