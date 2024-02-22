const Category = require("../model/categoryModel");

// ========================={ category } ======================== \\

const loadcategory = async (req, res) => {
  try {
    const category = await Category.find({});
    res.render("category", { categories: category });
  } catch (error) {
    console.log(error);
  }
};
// ============================= loadAddCategory

const loadaddcategory = async (req, res) => {
  try {
    res.render("addcategory");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

// ============================= inserting Category
const insertCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const lowercaseName = name.toLowerCase();
    const existingname = await Category.findOne({
      name: { $regex: new RegExp("^" + lowercaseName + "$", "i") },
    });

    if (existingname) {
      console.log("its already exists");
      req.flash("existsmessage", "category already exists");
      res.redirect("/admin/addcategory");
    } else {
      const categories = new Category({
        name: name,
        description: description,
        isList: true,
      });
      await categories.save();
      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
  }
};

// =========================== list&Unlist Catagory

const listUnlistcategory = async (req, res) => {
  try {
    const category_id = req.body.id;

    const category = await Category.find({ _id: category_id });
    if (category.length > 0 && category[0].isList === true) {
      await Category.findByIdAndUpdate(
        { _id: category_id },
        { $set: { isList: false } }
      );
    } else {
      await Category.findByIdAndUpdate(
        { _id: category_id },
        { $set: { isList: true } }
      );
    }
    res.json({ isList: true });
  } catch (error) {
    console.log(error);
  }
};

// ============================= Edit category page

const loadeditcategorypage = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.find({ _id: id });
    res.render("editcategory", { categories: category });
  } catch (error) {
    console.log(error);
  }
};

// ================================ Editing category

const editcategory = async (req, res) => {
  try {
    const id = req.body.id;
const name =req.body.editname
    const discription = req.body.editdisc;
  
    const lowercaseName = name.toLowerCase();
    const existingname = await Category.findOne({
      name: { $regex: new RegExp("^" + lowercaseName + "$", "i") },
    });
    
    const selectCategory = await Category.findById({ _id: id });
    if (existingname) {
      req.flash("existsmess", "Category is already exists");
      console.log("already exists");
      res.redirect("/admin/category");
    
    } else {
      await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { name: req.body.editname, discription: discription } }
      );

      res.redirect("/admin/category");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  loadcategory,
  loadaddcategory,
  listUnlistcategory,
  loadeditcategorypage,
  editcategory,
  insertCategory,
};
