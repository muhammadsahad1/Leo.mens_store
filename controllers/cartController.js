const Order = require('../model/orderModel')
const Products = require('../model/productsModel')
const Cart = require('../model/cartModel');
const User = require('../model/userModel');
const Offer = require('../model/offerModel')
const Category = require('../model/categoryModel')

// ================================== { User Cart } ========================== \\
const loadcart = async (req, res) => {
  try {
     if (!req.session.user || !req.session.user._id) {
       req.flash('noSession', "Please login to get our service");
       res.redirect('/login');
     } else {
       const userId = req.session.user._id;
       const UserCart = await Cart.findOne({ userid: userId }).populate({
         path: 'products.productsId',
         populate: {
           path: 'offer', // This populates the offer details for each product
         },
       });

       let initialAmount = 0;
       if (UserCart) {
         UserCart.products.forEach((item) => {
           let itemPrice = item.productsId.price; // Default to product price if no offer is available

           // Check if the product has an offer
           if (item.productsId.offer) {
             const productOffer = item.productsId.offer;
             // Check if the offer type is percentage
             if (productOffer.discountType === 'percentage') {
               // Calculate discounted price
               itemPrice -= item.productsId.price * (productOffer.discountAmount / 100);
             }
           }
         });
       }
       
       res.render('CartPage', { UserCart, Subtotal: initialAmount ,user : userId });
     }
  } catch (error) {
     console.log(error);
  }
};

// ========================= Add Cart 

const AddCart = async (req, res) => {
  try {
      const { productId, quantity, size } = req.body;
      const userId = req.session.user._id ? req.session.user._id : null;
      if (!userId) {
          return res.json({ success: false });
      }

      const productData = await Products.findOne({ _id: productId }).populate("offer").populate('categoriesId');

      
      let offerprice = productData.price ;
      let price = productData.price;
      if (productData.offer) {
          const productOffer = await Offer.findOne({ _id: productData.offer });
          const productDiscountType = productOffer.discountType;
          if (productDiscountType === 'percentage') {
              const discountAmount = productOffer.discountAmount;
              offerprice = productData.price - (productData.price * (discountAmount / 100));
          }
      }

      const category = await Category.findOne({ _id: productData.categoriesId });
      if (category.offer) {
          const categoryOffer = await Offer.findOne({ _id: category.offer });
          const discountType = categoryOffer.discountType;
          if (discountType === 'percentage') {
              const discountAmount = categoryOffer.discountAmount;
              offerprice = productData.price - (productData.price * (discountAmount / 100));
          }
      }

      // Calculate total price based on quantity and price
      const totalPrice = quantity * offerprice ? offerprice : price;
      // Add product to cart or update quantity if already exists
      const cart = await Cart.findOne({ userid: userId });
      if (cart) {
          const existsProduct = cart.products.find((pro) => pro.productsId.toString() === productId);
          if (existsProduct) {
              await cart.updateOne({
                  userId: userId,
                  "products.productsId": productId
              },
                  {
                      $inc: {
                          "products.$.quantity": quantity,
                          "products.$.totalPrice": totalPrice
                      }
                  });
          } else {
              await Cart.updateOne({ userid: userId },
                  {
                      $push: {
                          products: {
                              productsId: productId,
                              price: offerprice ? offerprice : productData.price,
                              quantity: quantity,
                              totalPrice: totalPrice,
                              sizes: size
                          }
                      }
                  });
          }
      } else {
          const NewCart = new Cart({
              userid: userId,
              products: [
                  {
                      productsId: productId,
                      price:  offerprice ? offerprice : productData.price,
                      quantity: quantity,
                      totalPrice: totalPrice,
                      sizes: size
                  }
              ]
          });
          await NewCart.save();
      }

      return res.json({ success: true });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: "Error adding product to cart" });
  }
};



// =================== Remove cart 

const cartRemover = async (req, res) => {
  try {
    const { ProductsId } = req.body;
    console.log("productid ", ProductsId);
    const userid = req.session.user._id;
    console.log("user i d ", userid);
    if (userid) {
      await Cart.findOneAndUpdate({ userid: userid, 'products.productsId': ProductsId },
        {
          $pull: { 'products': { 'productsId': ProductsId } }
        })
      res.json({ removed: true })
      console.log("removed product from cart");
    } else {
      console.log("no cart for this user");
    }
  } catch (error) {

    console.log(error);
  }
}

// ============================== load checkout 

const loadCheckout = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const usercart = await Cart.findOne({ userid: userId }).populate('products.productsId')
    const user = await User.findOne({ _id: userId })
    const userAddress = user.addresses;
    const order = await Order.findOne({userId : userId})
    res.render('checkoutpage', { Usercart: usercart, Uaddress: userAddress, order:order})
  } catch (error) {
    console.log(error);
  }
}

// updateQuantity
const updateQuantity = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId, count } = req.body;

    const product = await Products.findOne({ _id: productId })
    const cart = await Cart.findOne({ userid: userId })

    if (count == -1) {
      const currentStock = cart.products.find((p) => p.productsId == productId).quantity
      if (currentStock <= 1) {
        return res.json({ min: true })
      }
    }
    if (count == 1) {
      console.log(cart, "cart");
      console.log(productId, "productid");
      const currentStock = cart.products.find((p) => p.productsId.toString() == productId).quantity
      console.log(currentStock, "curenyt");
      if (currentStock >= product.stockQuantity) {
        return res.json({ max: true })
      }
    }
    const productPrice = cart.products.find((pro) => pro.productsId.toString() == productId)

    const updateCart = await Cart.findOneAndUpdate({ userid: userId, 'products.productsId': productId }, {
      $inc: {
        'products.$.quantity': count,
        'products.$.totalPrice': count * productPrice.price
      }
    })
    console.log("updateee",updateCart);

    res.json({ success: true })
  } catch (error) {
    res.status(400).send('updateStock request is failed')
    console.log(error);
  }
}


module.exports = {
  loadcart,
  AddCart,
  cartRemover,
  updateQuantity,
  loadCheckout

}