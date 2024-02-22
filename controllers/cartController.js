
const Products = require('../model/productsModel')
const Cart = require('../model/cartModel');
const User = require('../model/userModel')

// ================================== { User Cart } ========================== \\

const loadcart = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user._id) {
      req.flash('noSession', "Please login to get our service")
      res.redirect('/login')
    } else {
      const userId = req.session.user._id;
      const UserCart = await Cart.findOne({ userid: userId }).populate({ path: 'products.productsId' })
      let intialAmout = 0;
      if (UserCart) {
        UserCart.products.forEach((item) => {
          let itemprice = item.price;
          intialAmout += itemprice * item.quantity;
        })
      }
      res.render('CartPage', { UserCart, Subtotal: intialAmout })

    }
  } catch (error) {
    console.log(error);
  }
}

// ========================= Add Cart 

const AddCart = async (req, res) => {
  try {

    const { productId, quantity, size } = req.body;
    console.log("size", size);
    const userId = req.session.user._id ? req.session.user._id : null;
    console.log(userId);
    if (!userId) {
      res.json({ success: false })
    }
    console.log(userId);
    console.log("product : ", productId);
    console.log("quantity: ", quantity);

    const productData = await Products.findOne({ _id: productId })
    const cart = await Cart.findOne({ userid: userId })
    if (cart) {
      const existsProduct = cart.products.find((pro) => pro.productsId.toString() === productId)
      if (existsProduct) {
        console.log(existsProduct, 'exits')
        await cart.updateOne({
          userId: userId,
          "products.productsId": productId
        },
          {
            $inc: {
              "products.$.quantity": quantity,
              "products.$.totalPrice": quantity * existsProduct.price
            }
          })
        res.json({ success: true })
      } else {
        console.log('update')
        await Cart.updateOne({ userid: userId },
          {
            $push: {
              products: {
                productsId: productId,
                price: productData.price,
                quantity: quantity,
                totalPrice: quantity * productData.price,
                sizes: size
              }
            }
          })
      }// else user don't have any cart (ADD Cart)
    } else {
      const NewCart = new Cart({
        userid: userId,
        products: [
          {
            productsId: productId,
            price: productData.price,
            quantity: quantity,
            totalPrice: quantity * productData.price,
            sizes: size

          }
        ]
      })
      console.log("----------------", productId);
      await NewCart.save()
      console.log("new cart added");
    }

    res.json({ success: true })

  } catch (error) {
    console.log(error);
  }
}

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
    console.log("userid", userId);
    const usercart = await Cart.findOne({ userid: userId }).populate('products.productsId')
    const user = await User.findOne({ _id: userId })
    console.log("usercart proooo", usercart);
    const userAddress = user.addresses;
    res.render('checkoutpage', { Usercart: usercart, Uaddress: userAddress, })
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