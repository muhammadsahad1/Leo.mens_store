const Offers = require("../model/offerModel");
const Product = require("../model/productsModel");
const categroy = require("../model/categoryModel");



// Load Offer Mangament

const loadOffers = async (req, res) => {
  try {
    const { id } = req.query;
    const categories = await categroy.find({});
    const products = await Product.find({});
    const offerList = await Offers.find({});

    res.render("offerPage", {
      offer: offerList,
      products: products,
      categories: categories,
      categoryId: id,
      productId: id,
    });
  } catch (error) {
    res.status(404).send("Load offers page request is failed");
    console.log(error);
  }
};

// ========================== Add Offers ========================== \\

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
    res
      .status(200)
      .json({ success: true, message: "offer deleted successfully" });
  } catch (error) {
    res.status(404).send(" offer request failed");
  }
};

// ===================== > apply offer for product

const applyOffer = async (req, res) => {
  try {
    const { offerId, productId } = req.body;
    console.log("proyId", productId);

    await Product.updateOne({ _id: productId }, { $set: { offer: offerId } });
    res.json({ success: true });
  } catch (error) {
    res.status(404).send("applyOffer request is failed");
  }
};

// ===================== > apply offer to category

const applyOfferCat = async (req, res) => {
  try {
    const { offerId, categoryId } = req.body;

    await categroy.updateOne({ _id: categoryId }, { $set: { offer: offerId } });
    res.json({ success: true });
    console.log("category saved");
  } catch (error) {
    res.status(404).send("applyOffer request is failed");
  }
};

//  ( UI )

// update Offer 
const updateOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      discountType,
      discountAmount,
      startDate,
      endDate,
      offerId,
    } = req.body;
    
    const find = {
      _id: offerId,
    };

    const update = {
      title: title,
      description: description,
      discountType: discountType,
      endDate: endDate, // Corrected
      discountAmount: discountAmount,
      startDate: startDate,
    };

    const updatedOffer = await Offers.updateOne(find, update);

    if (updatedOffer.nModified === 1) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: "Offer not found or not modified" });
    }
  } catch (error) {
    console.error("Error updating offer:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


module.exports = {
  loadOffers,
  addingOffer,
  deletOffer,
  applyOffer,
  applyOfferCat,
  updateOffer
};
