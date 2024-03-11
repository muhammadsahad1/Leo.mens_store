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

      // Update other fields
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

      // Update images
      let arrayimages = [];
      for (let i = 0; i < req.files.length; i++) {
          arrayimages[i] = req.files[i].filename;
      }

      // Resize and store images
      for (let i = 0; i < req.files.length; i++) {
          await sharp("public/assets/img/product/original/" + req.files[i].filename)
              .resize(500, 500)
              .toFile("public/assets/img/product/sharp/" + req.files[i].filename);
      }

      // Update image filenames in the database
      if (arrayimages.length > 0) {
          await Products.findByIdAndUpdate(
              { _id: id },
              {
                  $set: {
                      "images": arrayimages,
                  },
              }
          );
      }

      console.log("Product updated successfully");
      res.redirect("/admin/products");
  } catch (error) {
      console.log("Error updating product:", error);
      res.status(500).send("Error updating product");
  }
};

// ========================================={ ui shop }===========================\\

// ===================== Load shop



// Define the loadshoppage function

const loadshoppage = async (req, res) => {
  try {
      let currentPage = parseInt(req.query.page) || 1;
      let page = req.query.page || 1;
      let limit = 6;
      let skip = (page - 1) * limit;
      let next = parseInt(page) + 1;
      let previous = parseInt(page) > 1 ? parseInt(page) - 1 : 1;

      // Accept category ID and sort order as query parameters
      let categoryId = req.query.categoryId;
      let sort = req.query.sort || 'increasing'; // Default to 'increasing' if not provided

      // Build the query object based on category ID
      let query = { isListed: true };
      if (categoryId) {
          query.categoriesId = categoryId;
      }

      // Determine the sort order
      let sortOrder = sort === 'increasing' ? 1 : -1;

      // Count the total number of matching products
      let count = await Products.find(query).count();

      // Calculate the total number of pages
      let totalPage = Math.ceil(count / limit);
      if (next > totalPage) {
          next = totalPage;
      }

      // Ensure that currentPage is within the valid range
      if (currentPage < 1) {
          currentPage = 1;
      } else if (currentPage > totalPage) {
          currentPage = totalPage;
      }

      // Fetch the categories
      const cetagory = await Category.find({ isList: true }).populate("offer");
      if (skip < 0) {
          skip = 0;
      }

      // Fetch the products based on the query parameters and sort order
      const products = await Products.find(query)
          .populate("categoriesId")
          .populate("offer")
          .sort({ price: sortOrder }) // Apply sorting
          .skip(skip)
          .limit(limit);

      // Modify the products to include discounts, if applicable
      const productsWithDiscount = products.map((product) => {
          if (product.offer) {
              const discountAmount = product.offer.discountAmount;
              const discountType = product.offer.discountType;
              let discountedPrice;

              if (discountType === "fixed") {
                  discountedPrice = product.price - discountAmount;
              } else if (discountType === "percentage") {
                  discountedPrice = product.price - product.price * (discountAmount / 100);
              }

              return { ...product.toObject(), discountedPrice };
          }
          return product;
      });

      // Render the productsshop page with necessary data
      res.render("productsshop", {
          currentPage: currentPage, // Pass the currentPage to the frontend
          cetagory,
          product: productsWithDiscount,
          next,
          previous,
          totalPage,
          categoryId: categoryId, // Pass the categoryId to the frontend
          sort: sort // Pass the current sort order to the frontend
      });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal server error' });
  }
};

   



// product Details page

const productdetailspage = async (req, res) => {
  try {
    const id = req.query.id;
    const Userid = req.session.user;
    const findproduct = await Products.findOne({ _id: id }).populate(
      "categoriesId"
    );
    const products = await Products.find({});

    const existscart = await Cart.findOne({ userid: Userid });

    let CatPrice = findproduct.price;

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
          CatPrice: CatPrice,
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
      CatPrice: CatPrice,
      products: products,
      isInCart: false,
    });
  } catch (error) {
    console.log(error);
    // Handle the error and render an error page or redirect as needed
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
  // filter,
};
