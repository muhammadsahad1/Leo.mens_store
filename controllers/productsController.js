const Products = require("../model/productsModel");
const Category = require("../model/categoryModel");
const Wishlist = require("../model/wishlistModel");
const User = require("../model/userModel");
const Offer = require("../model/offerModel");
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

    const allProducts = await Products.find({ isListed: true })
      .populate("offer")
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    const pro = allProducts.filter((pro) => pro.price);
    const offerProducts = allProducts.filter((product) => product.offer);
    const regularProducts = allProducts.filter((product) => !product.offer);
    const offerIds = offerProducts.map((product) => product.offer._id);

    const offers = await Offer.find({ _id: { $in: offerIds } });

    // Extract discountAmount from fetched offers for products
    const discountAmountMap = {};
    offers.forEach((offer) => {
      discountAmountMap[offer._id.toString()] = offer.discountAmount;
    });

    // Fetch category offers
    const categories = await Category.find({ isList: true })
      .populate("offer")
      .exec();

    const categoryDiscountAmountMap = {};
    categories.forEach((category) => {
      if (category.offer) {
        categoryDiscountAmountMap[category._id.toString()] =
          category.offer.discountAmount;
      }
    });

    const id = req.session.user?._id;

    const commonData = {
      offerProducts: offerProducts,
      regularProducts: regularProducts,
      categories: categories,
      discountAmountMap: discountAmountMap,
      categoryDiscountAmountMap: categoryDiscountAmountMap,
      page: page,
      next: next,
      previous: previous,
      totalpages: totalpages,
    };

    if (id) {
      const existWishlist = await Wishlist.findOne({
        user: id,
        "products.productId": {
          $in: allProducts.map((product) => product._id),
        },
      });

      const user = await User.findById(id);

      res.render("productsshop", {
        user: user,
        id: id,
        existWishlistPro: existWishlist ? true : false,
        existWishlist,
        products: existWishlist ? existWishlist.products : [],
        ...commonData,
      });
    } else {
      res.render("productsshop", {
        id: id,
        ...commonData,
      });
    }
  } catch (error) {
    console.log(error);
    res.render('404Page')
    res.status(500).send("Error loading shop page");
  }
};

// ========================= productDetails page

const productdetailspage = async (req, res) => {
  try {
    const id = req.query.id;
    const Userid = req.session.user;
    const findproduct = await Products.findOne({ _id: id }).populate(
      "categoriesId"
    );
    const products = await Products.find({});

    const existscart = await Cart.findOne({ userid: Userid });

    let CatPrice = findproduct.price
      
    if (findproduct.categoriesId.offer) {
      const offer = await Offer.findOne({
        _id: findproduct.categoriesId.offer._id,
      });
      if (offer) {
        const discountType = offer.discountType;
        if (discountType === "percentage") {
          CatPrice -= findproduct.price * (offer.discountAmount / 100);
        }
      }
    }

    let price = findproduct.price;
    
    if (findproduct.offer) {
      console.log("ketiiii");
      const offer = await Offer.findOne({ _id: findproduct.offer });

      if (offer) {
        if (offer.discountType === "percentage") {
          price -= findproduct.price * (offer.discountAmount / 100);
        }
      }
    }

    if (existscart) {
      const existsProduct = existscart.products.find(
        (pro) => pro.productsId.toString() === id
      );
      
      if (existsProduct) {
        // Product is already in the cart
        res.render("productdetails", {
          product: findproduct,
          user: Userid,
          offerPrice: price,
          CatPrice : CatPrice,
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
      offerPrice: price,
      CatPrice : CatPrice,
      products: products,
      isInCart: false,
    });
  } catch (error) {
    console.log(error);
    // Handle the error and render an error page or redirect as needed
  }
};

// ============= > search product

const searchProduct = async (req, res) => {
  try {
    const searchName = req.body.search;
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
