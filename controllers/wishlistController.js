const Product = require("../model/productsModel");
const Cart = require('../model/cartModel')
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

const AddWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId } = req.body;

    // Check if the user has a wishlist
    let wishlist = await Wishlist.findOne({ user: userId });

    // If the wishlist doesn't exist, create a new one
    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        products: [{ productId }]
      });
    } else {
      // Check if the product is already in the wishlist
      const exists = wishlist.products.some(product => product.productId.equals(productId));
      if (!exists) {
        // Add the product to the wishlist
        wishlist.products.push({ productId });
      }
    }

    await wishlist.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
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

// get wishlist 
const getWishlist = async (req, res) => {
  try {
     const userId = req.session.user._id;
     const wishlist = await Wishlist.findOne({ user: userId });
     if (!wishlist) {
       return res.json([]); // Return empty array if no wishlist found
     }
     const productIds = wishlist.products.map(item => item.productId._id);
     res.json(productIds);
  } catch (error) {
     console.error(error);
     res.status(500).send('Server error');
  }
 };

module.exports = {
  LoadWishlist,
  AddWishlist,
  removeWishlist,
  getWishlist
  
};
