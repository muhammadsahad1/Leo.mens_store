const Product = require("../model/productsModel");
const Cart = require('../model/cartModel')
const wishlistModel = require("../model/wishlistModel");
const Wishlist = require("../model/wishlistModel");

// ================ ( wishlist page ) ================ \\

const LoadWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const wishlistProduct = await Wishlist.findOne({ user: userId }).populate('products.productId').populate('user');
    
    // Filter out products with null productId
    const products = wishlistProduct.products.filter(item => item.productId);

    console.log("products >>>>", products);

    // Extracting productIds
    const productIds = products.map(item => item.productId._id);
    console.log("productIds", productIds);

    const existCart = await Cart.find({'products.productId': { $in: productIds }}).populate('products.productsId').populate('userid');

    res.render("wishlist", { wishProduct: products, existCart: existCart ? existCart.products : [] });

  } catch (error) {
    res.status(404).send("Wishlist page request failed");
    console.log(error);
  }
};

// Adding Wishlist
const   AddWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const wishlist = await Wishlist.findOne({ user: userId });
    const { productId } = req.body;

    if (wishlist) {
      const exists = wishlist.products.some(product => product.productId.equals(productId));

      if (!exists) {
        await Wishlist.updateOne(
          { user: userId },
          { $push: { products: { productId } } }
        );
        res.json({ success: true}); 
      } else {
        res.json({ success: true }); 
      }
    } else {
      const newWishlist = new Wishlist({
        user: userId,
        products: [{ productId }]
      });

      await newWishlist.save();
      res.json({ success: true }); // Product added to wishlist and not already in cart
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// remove Product in Wishlist

const removeWishlist = async(req,res)=>{
  try {
    const { productId } = req.body;
    const userId = req.session.user._id;
    await Wishlist.updateOne({ user:userId },{$pull : { products :{ productId : productId}}})
    res.json({ removed : true })
    console.log("removed pro");
    console.log(productId);
  } catch (error) {
    res.status(404).send('removeWishlist request is failed')
    console.log(error);
  }
}

module.exports = {
  LoadWishlist,
  AddWishlist,
  removeWishlist
  
};
