const mongoose = require("mongoose");
require("dotenv").config();

const DB = process.env.DATABASE
const DB_CATEGORIES = process.env.DATABASE_CATEGORIES
const DB_COMPANY = process.env.DATABASE_COMPANY

const userdatabase = mongoose.createConnection(DB, { useNewUrlParser: true, useUnifiedTopology: true });
const categoriesdb = mongoose.createConnection(DB_CATEGORIES, { useNewUrlParser: true, useUnifiedTopology: true });
const companydb = mongoose.createConnection(DB_COMPANY, { useNewUrlParser: true, useUnifiedTopology: true });

userdatabase.once('open', () => {
  console.log('Connected to the database.');
});

userdatabase.on('error', (error) => {
  console.error('Error connecting to the database:', error);
});
categoriesdb.once('open', () => {
  console.log('Connected to the database 2.');
});

categoriesdb.on('error', (error) => {
  console.error('Error connecting to the database 3:', error);
});
companydb.once('open', () => {
  console.log('Connected to the database 3.');
});

companydb.on('error', (error) => {
  console.error('Error connecting to the database 3:', error);
});



module.exports = {
    userdatabase,
    categoriesdb,
    companydb
  };