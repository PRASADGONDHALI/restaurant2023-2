const mongoose = require('mongoose');
const {categoriesdb} = require('../db/conn')


const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  productImage: {
    type: String, 
    required: true,
  },
  subcategory: {
    type: String, 
  },
});

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: 2, // Minimum length of 2 characters
    maxlength: 50, // Maximum length of 50 characters
    trim: true, // Remove leading and trailing spaces
  },
  image: {
    type: String,
    required: true,
  },
  isSubcategory: {
    type: Boolean, // Field to determine if it's a subcategory or not
  },
  subCategories: {
    type: [String], // Array of subcategories
  },
  datecreated:Date,
  dateUpdated:Date,
  products: [productSchema]
});

const Category = categoriesdb.model('data', categorySchema);

module.exports = Category;
