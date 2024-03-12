const Wishlist = require('../model/wishlistModel')
const Cart = require('../model/cartModel')


// fetching count of wishlist and cart of products

const wishlistCartCount = async(req,res,next)=>{
  try {
    const userId = req.session.user._id;
    const cartitems = await Cart.findOne({userid:userId})

    // finding quantity of cart products
    if(cartitems)
    {
      const totalquantity = cartitems.products.reduce((total,items)=>total+items.quantity,0)
      res.locals.cartCount = totalquantity
    }else
    {
      res.locals.cartCount = ''
    }

    const wishlistitems = await Wishlist.findOne({user : userId})
    if(wishlistitems)
    {
      const wishlitCount = wishlistitems.products.length
      res.locals.wishlitCount = wishlitCount
    }else
    {
      res.locals.wishlitCount = ''
    }
    next()
  } catch (error) {
    console.log(error);
    next()
  }
}

module.exports = {

  wishlistCartCount

}