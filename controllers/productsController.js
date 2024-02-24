const Products = require("../model/productsModel");
const Category = require("../model/categoryModel");
const Wishlist = require("../model/wishlistModel");
const User = require("../model/userModel");
const Offer = require('../model/offerModel')

const Cart = require("../model/cartModel");
const sharp = require("sharp");

// ========================={ Products pages } ======================== \\

const loadproducts = async (req, res) => {
  try {
    const productsData = await Products.find({}).populate("categoriesId");
    res.render("products", { products: productsData });
  } catch (error) {
    console.log(error);
  }
};

// =================================== add products Load

const loadaddproducts = async (req, res) => {
  try {
    const categories = await Category.find({});
    console.log("working");
    console.log(categories);
    res;
    res.render("addProducts", { categories: categories });
  } catch (error) {
    console.log(error);
  }
};

// ================================== add products

const addproducts = async (req, res) => {
  try {
    console.log(req.body.category, "hreidfijdj");
    const { name } = req.body;
    const existproduct = await Products.findOne({ name });
    if (existproduct) {
      console.log("its already exists");
      req.flash("existsmessage", "product is already exists");
      res.redirect("/admin/addproducts");
    } else {
      let arrayimages = [];

      if (Array.isArray(req.files)) {
        for (let i = 0; i < req.files.length; i++) {
          arrayimages[i] = req.files[i].filename;
        }
      }
      for (let i = 0; i < req.files.length; i++) {
        await sharp(
          "public/assets/img/product/original/" + req.files[i].filename
        )
          .resize(500, 500)
          .toFile("public/assets/img/product/sharp/" + req.files[i].filename);
      }

      const sizes = [];
      const sizeLength = req.body.sizes.length;
      for (let i = 0; i < sizeLength; i++) {
        sizes.push(req.body.sizes[i]);
      }
      console.log("ssaahhaad");

      const products = new Products({
        previousPrice: req.body.previousPrice,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        sizes: sizes,
        categoriesId: req.body.category,
        stockQuantity: req.body.quantity,
        isListed: true,
        images: arrayimages,
      });

      await products.save();

      res.redirect("/admin/Products");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(`Internal server error ${error}`);
  }
};

// =========================== list & Unlist Products

const listUnlistproducts = async (req, res) => {
  try {
    const product_id = req.body.id;
    console.log(req.body);

    const productData = await Products.find({ _id: product_id });
    console.log(productData);
    if (productData.length > 0 && productData[0].isListed === true) {
      await Products.findByIdAndUpdate(
        { _id: product_id },
        {
          $set: { isListed: false },
        }
      );
    } else {
      console.log("work");
      await Products.findByIdAndUpdate(
        { _id: product_id },
        {
          $set: { isListed: true },
        }
      );
    }
    res.json({ listed: true });
  } catch (error) {
    console.log(error);
  }
};

// =============================== edit Products

const loadEditProductPage = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id);
    const products = await Products.findOne({ _id: id });
    console.log("ss" + products);
    const category = await Category.find({});
    console.log("haai");

    if (products) {
      res.render("editproducts", {
        products: products,
        categories: category,
        id: id,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// ====================================== edits Products

const editProducts = async (req, res) => {
  try {
    const id = req.body.id;
    const existsImg = await Products.find({ _id: id });
    await Products.updateMany(
      { _id: id },
      {
        $set: {
          previousPrice: req.body.previousPrice,
          name: req.body.name,
          description: req.body.description,
          price: req.body.price,
          sizes: req.body.sizes,
          categoriesId: req.body.category,
          stockQuantity: req.body.quantity,
        },
      }
    );

    // for image
    let arrayimages = [];
    for (let i = 0; i < req.files.length; i++) {
      arrayimages[i] = req.files[i].filename;
    }

    for (let i = 0; i < req.files.length; i++) {
      await sharp("public/assets/img/product/original/" + req.files[i].filename)
        .resize(500, 500)
        .toFile("public/assets/img/product/sharp/" + req.files[i].filename);
    }
    if (arrayimages) {
      const image1 = arrayimages[0] || existsImg[0].images[0];
      const image2 = arrayimages[1] || existsImg[0].images[1];
      const image3 = arrayimages[2] || existsImg[0].images[2];

      await Products.findByIdAndUpdate(
        { _id: id },
        {
          $set: {
            "images[0]": image1,
            "images[1]": image2,
            "images[2]": image3,
          },
        }
      );
    }

    console.log("working");
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error);
  }
};

// ========================================={ ui shop }===========================\\

// ===================== Load shop
const loadshoppage = async (req, res) => {
  try {
    const id = req.session.user._id;
    const user = await User.findById(id);
    const products = await Products.find({ isListed: true });
    const productIds = products.map((product) => product._id);
    const categories = await Category.find({ isList: true });
    const categoriesId = categories.map((category) => category._id);
    const offerProduct = await Offer.findOne({ products: productIds, categories: categoriesId });
    
    let discountamount = 0; // Initialize discountamount here

    if (offerProduct) {
      const productPrice = products.reduce((acc, product) => acc + product.price, 0); // Assuming there's a price property for each product
      discountamount = (offerProduct.discount / productPrice) * 100;

      // Apply the discount amount to each product's price
      products.forEach(product => {
        product.price -= (product.price * discountamount) / 100;
      });
    }

    const existWishlist = await Wishlist.findOne({
      user: id,
      "products.productId": { $in: productIds },
    });


    
    let productss = [];
    if (existWishlist) {
      productss = existWishlist.products;
    }

    
    res.render("productsshop", {
      user: user,
      product: products,
      categories: categories,
      id: id,
      existWishlistPro: existWishlist ? true : false,
      existWishlist,
      products: productss,
      offerProduct,
      discountamount
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error loading shop page");
  }
};

// ========================= productDetails page

const productdetailspage = async (req, res) => {
  try {
    const id = req.query.id;
    const Userid = req.session.user;
    const findproduct = await Products.findOne({ _id: id });
    const products = await Products.find({});

    // Check if the product is already in the user's cart
    const existscart = await Cart.findOne({ userid: Userid });

    if (existscart) {
      const existsProduct = existscart.products.find(
        (pro) => pro.productsId.toString() === id
      );

      if (existsProduct) {
        // Product is already in the cart
        res.render("productdetails", {
          product: findproduct,
          user: Userid,
          products: products,
          isInCart: true,
        });
        return;
      }
    }

    // Product is not in the cart
    res.render("productdetails", {
      product: findproduct,
      user: Userid,
      products: products,
      isInCart: false,
    });
  } catch (error) {
    console.log(error);
    // Handle the error and render an error page or redirect as needed
  }
};

// search product

const searchProduct = async (req, res) => {
  try {
    console.log(req.body);
    const searchName = req.body.search;
    console.log(searchName);
    const foundProduct = await Products.find({
      name: { $regex: searchName, $options: "i" },
    });
    console.log("matched==", foundProduct);
    res.json({ pass: true, product: foundProduct });
  } catch (error) {
    res.status(400).send("Search request failed");
  }
};

// ================================ Select Category

const selectCategory = async (req, res) => {
  try {
    console.log(req.body);
    const selectCategory = req.body.selectCategory;
    const findCategoryId = await Category.find({
      name: { $in: selectCategory },
    }).distinct("_id");
    const findproducts = await Products.find({ categoriesId: findCategoryId });
    if (findproducts) {
      res.json({ pass: true, product: findproducts });
    }
  } catch (error) {
    res.status(404).send("selectCategory request is failed");
  }
};

// sort Price
const sortPrice = async (req, res) => {
  try {
    const { sortOption } = req.body;
    let sorting = {};
    if (sortOption === "decreasing") {
      sorting = { price: -1 };
    } else if (sortOption === "increasing") {
      sorting = { price: 1 };
    }
    console.log(sortOption);
    const sortProduct = await Products.find().sort(sorting);
    console.log("sortPro", sortProduct);
    if (sortProduct) {
      res.json({ product: sortProduct });
    }
  } catch (error) {
    res.status(404).send("Your sortPrice request is falied");
  }
};
module.exports = {
  loadproducts,
  listUnlistproducts,
  loadaddproducts,
  addproducts,
  editProducts,
  loadEditProductPage,
  // ui
  loadshoppage,
  productdetailspage,
  searchProduct,
  selectCategory,
  sortPrice,
};
