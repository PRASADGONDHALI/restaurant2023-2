const express = require("express");
const router = new express.Router();
const axios = require("axios"); 
const userdb = require("../models/userScema");
const Category = require("../models/categorySchema");
const {TableBooking} = require("../models/companySchema");
const {OfferBanner} = require("../models/companySchema");
const {SponsoredAdds} = require("../models/companySchema");
const {vdoadds} = require("../models/companySchema");
const {Order} = require("../models/companySchema");
const {Logo} = require("../models/companySchema");
var bcrypt = require("bcryptjs");
const authenticate = require("../middleware/authenticate");
const adminauth = require("../middleware/adminauth");
const upload = require("../multer/multerConfig");
const uploadproduct = require("../multer/multerConfigProduct");
const uploadvideo = require("../multer/videomulter");
const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-payment",authenticate, async (req, res) => {
  try {
    const { categoryId, productId, amount, quantity,productImage } = req.body;
    const userId = req.userId;
    const orderAmount = quantity * amount*100;
    const paymentOrder = await razorpay.orders.create({
      amount: orderAmount, // Amount in paisa (e.g., for ₹100, amount = 10000)
      currency: "INR",
      
    });

    res.status(201).json({ status: 201, paymentOrder });

  } catch (error) {
    res.status(500).json({ error: "Error creating payment order" });
  }
});

router.post('/add-order', authenticate, async (req, res) => {
  try {
    const {
      categoryId,
      productId,
      amount,
      quantity,
      paymentResponse,
      newAddress,
      productImage,
      productName
    } = req.body;
    
    const userId = req.userId;

    if (
      !newAddress.fullName ||
      !newAddress.flatNo ||
      !newAddress.area ||
      !newAddress.pincode ||
      !newAddress.city ||
      !newAddress.state
    ) {
      return res.status(400).json({ message: 'Invalid new address fields' });
    }

    // Create the order document
    const order = new Order({
      user: userId,
      products: [
        {
          categoryId,
          productId,
          quantity,
          price: amount,
          productImage,
          productName,
        },
      ],
      shippingAddress: { ...newAddress }, // Assuming 'newAddress' is the shipping address
      billingAddress: { ...newAddress },  // Assuming 'newAddress' is the billing address
      status: 'pending', // You can set the initial status here
      paymentResponse: paymentResponse,
    });

    // Save the order to the database
    const savedOrder = await order.save();

    // Update the user's orders array
    const updateUser = await userdb.findByIdAndUpdate(userId, {
      $push: { orders: savedOrder._id },
    });

    if (savedOrder && updateUser) {
      // Order added successfully
      // You can also update the user's cart or other data as needed
      res.status(201).json({ status: 201 });
    } else {
      res.status(500).json({ message: 'Error adding order' });
    }
  } catch (error) {
    console.error('Error adding order:', error);
    res
      .status(500)
      .json({ message: 'An error occurred while adding the order' });
  }
});




router.post("/user/register", async (req, res) => {
  const { fname, email, password, cpassword } = req.body;

  if (!fname || !email || !password || !cpassword) {
    res.status(422).json({ error: "fill all the details" });
  }

  try {
    const preuser = await userdb.findOne({ email: email });

    if (preuser) {
      res.status(422).json({ error: "This Email is Already Exist" });
    } else if (password !== cpassword) {
      res
        .status(422)
        .json({ error: "Password and Confirm Password Not Match" });
    } else {
      const finalUser = new userdb({
        fname,
        email,
        password,
        cpassword,
      });

      const storeData = await finalUser.save();

      // console.log(storeData);
      res.status(201).json({ status: 201, storeData });
    }
  } catch (error) {
    res.status(422).json(error);
    console.log("catch block error");
  }
});

// user Login

router.post("/login", async (req, res) => {
  // console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "fill all the details" });
  }

  try {
    const userValid = await userdb.findOne({ email: email });

    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);

      if (!isMatch) {
        res.status(422).json({ error: "invalid details" });
      } else {
        // token generate
        const token = await userValid.generateAuthtoken();

        // cookiegenerate
        res.cookie("usercookie", token, {
          expires: new Date(Date.now() + 9000000),
          httpOnly: true,
        });

        const result = {
          userValid,
          token,
        };
        res.status(201).json({ status: 201, result });
      }
    }
  } catch (error) {
    res.status(401).json(error);
    console.log("catch block");
  }
});

// user valid
router.get("/validuser", authenticate, async (req, res) => {
  try {
    const ValidUserOne = await userdb.findOne({ _id: req.userId });
    res.status(201).json({ status: 201, ValidUserOne });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

// admin login
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "fill all the details" });
  }

  try {
    const userValid = await userdb.findOne({ email: email });
    if (userValid) {
      const isMatch = await bcrypt.compare(password, userValid.password);
      if (!isMatch) {
        res.status(422).json({ error: "invalid details" });
      } else {
        if (userValid.role === "admin") {
          // token generate
          const admintoken = await userValid.generateAuthAdmintoken();
          // // cookiegenerate
          res.cookie("admincookie", admintoken, {
            expires: new Date(Date.now() + 9000000),
            httpOnly: true,
          });
          const result = {
            userValid,
            admintoken,
          };
          res.status(201).json({ status: 201, result });
        }
      }
    }
  } catch (error) {
    res.status(401).json(error);
    console.log("catch block");
  }
});

// admin valid
router.get("/validadmin", adminauth, async (req, res) => {
  try {
    const ValidAdminOne = await userdb.findOne({ _id: req.userId });
    res.status(201).json({ status: 201, ValidAdminOne });
  } catch (error) {
    res.status(401).json({ status: 401, error });
  }
});

router.post(
  "/api/categories",
  uploadproduct.single("categoryImage"),
  async (req, res) => {
    const file = req.file.filename;
    const { categoryName, isSubcategory, subCategories } = req.body;
    if (!categoryName || !file) {
      res.status(401).json("All Input are required");
    }
    try {
      const previousdata = await Category.findOne({ name: categoryName });
      if (previousdata) {
        res.status(401).json({ status: 401, message: "Category already used" });
      } else {
        const datecreated = new Date().toISOString();
        const finalData = new Category({
          name: categoryName,
          image: file,
          isSubcategory: isSubcategory === "true",
          subCategories: JSON.parse(subCategories),
          datecreated,
        });
        await finalData.save();
        res.status(200).json(finalData);
      }
    } catch (error) {
      res.status(401).json(error);
    }
  }
);
// product add
router.post(
  "/api/add-product",
  upload.single("productImage"),
  async (req, res) => {
    try{
    const file = req.file.filename;
    const { category, productName, subcategory, price } = req.body;
    if (!category || !productName || !price) {
      return res.status(400).json({ error: "Required fields are missing" });
    }
    const productData = {
      productName,
      price,
      productImage: file,
      subcategory, // You can add the subcategory here
    };

    // Find the category by its ID
    const categoryToUpdate = await Category.findById(category);

    if (!categoryToUpdate) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Add the product data to the products array of the category
    categoryToUpdate.products.push(productData);
    await categoryToUpdate.save();

    res.status(201).json({ message: "Product added successfully" });}
    catch(error){
      console.error("Error adding product:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);


// Get all categories
router.get("/api/allcategories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/category/:categoryId/products", async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const products = category.products;
    return res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// all products

router.get("/api/products/:productId", async (req, res) => {
  const productId = req.params.productId;
  try {
    const product = await Category.findById({_id:productId});
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/category/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const product = await Category.findById({_id:categoryId}); // Assuming findById is a valid method on your model
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// fetch product details
router.get("/category/:categoryId/:productId", async (req, res) => {
  const { categoryId, productId } = req.params;

  try {
    const category = await Category.findOne({ _id: categoryId });
    
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const product = category.products.find((product) => product._id.toString() === productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add to cart route
router.post("/add-to-cart", authenticate, async (req, res) => {
  const { categoryId, productId, quantity } = req.body;
  const userId = req.userId;

  // Validate input
  if (!categoryId || !productId || !quantity || isNaN(quantity) || quantity <= 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const user = await userdb.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the category and product exist
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const product = category.products.find((prod) => prod._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find an existing cart item with the same product
    const existingCartItem = user.cart.find(
      (item) =>
        item.categoryId.toString() === categoryId &&
        item.productId.toString() === productId
    );

    if (existingCartItem) {
      // If the same product is in the cart, increase the quantity
      existingCartItem.quantity += quantity;
    } else {
      // If the product is not in the cart, add a new cart item
      const cartItem = {
        categoryId,
        productId,
        quantity
      };
      user.cart.push(cartItem);
    }

    await user.save();

    res.status(201).json({ message: "Product added to cart successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Update cart item quantity
router.patch('/update-cart-quantity', authenticate, async (req, res) => {
  const { itemId, newQuantity } = req.body;
  const userId = req.userId;

  if (!itemId || !newQuantity || isNaN(newQuantity) || newQuantity <= 0) {
    return res.status(400).json({ error: "Invalid input" });
  }

  try {
    const user = await userdb.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItem = user.cart.find(item => item._id.toString() === itemId);

    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    cartItem.quantity = newQuantity;

    await user.save();

    res.status(200).json({ message: "Cart item quantity updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// remove from cart
router.delete("/remove-from-cart/:itemId", authenticate, async (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.userId;

  try {
    const user = await userdb.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the index of the cart item with the specified item ID
    const itemIndex = user.cart.findIndex((item) => item._id.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Remove the cart item from the user's cart array
    user.cart.splice(itemIndex, 1);

    await user.save();

    res.status(200).json({ message: "Cart item removed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/place-order", authenticate, async (req, res) => {
  try {
    const { categoryId, productId, quantity, userId } = req.body;
    // Find the user by ID
    const user = await userdb.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Find the selected product details
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    const product = category.products.find(
      (prod) => prod._id.toString() === productId
    );
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Add the ordered item to user's orders array
    const orderItem = {
      categoryId,
      productId,
      quantity,
      totalPrice,
    };
    user.orders.push(orderItem);
    await user.save();

    // Remove the ordered item from user's cart
    user.cart = user.cart.filter(
      (item) =>
        item.categoryId.toString() !== categoryId &&
        item.productId.toString() !== productId
    );
    await user.save();

    res.status(201).json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Delete category
router.delete("/api/categories/:categoryId", async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const category = await Category.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/api/editcategories/:categoryId", upload.single("newImage"), async (req, res) => {
  const categoryId = req.params.categoryId;
  const newImageFile = req.file;
  const newCategoryName = req.body.newCategoryName; // Extract the new category name

  try {
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Update the category's image field
    if(newImageFile){
    category.image = newImageFile.filename;
    }
    // Update the category's name
    if(newCategoryName)
    category.name = newCategoryName;

    // Save the updated category
    await category.save();

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// admin manage category
router.get('/admin/managecategory/:categoryId', async (req, res) => {
  const categoryId = req.params.categoryId;
  try {
    const product = await Category.findById({_id:categoryId}); // Assuming findById is a valid method on your model
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
// Update a product
router.put('/editproduct/:categoryId/:productId',upload.single("newImageFile"), async (req, res) => {
  try {
    const { categoryId, productId } = req.params;
    const { newName, newPrice } = req.body;
    const newImageFile = req.file;
   
    // Find the category by category ID
    const category = await Category.findOne({ _id: categoryId });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find the product within the found category by product ID and update its name and/or price
    const product = category.products.id(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found within the category' });
    }

    // Update the product's name and/or price
    if (newName) {
      product.productName = newName;
    }

    if (newPrice) {
      product.price = newPrice;
    }
    if(newImageFile){
      product.productImage = newImageFile.filename;
    }
    await category.save(); // Save the category with updated product information

    res.status(200).json({ message: 'Product updated successfully', updatedProduct: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// delete product
router.delete('/api/removeproduct/:categoryId/:productId', async (req, res) => {
  try {
    const { categoryId,productId } = req.params;
    // Find the product by ID
    const category = await Category.findOne({ _id: categoryId });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Find the product within the found category by product ID and update its name and/or price
    const product = category.products.id(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found within the category' });
    }
    // Delete the product
    category.products.pull(productId);
    await category.save();

    return res.status(200).json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Error removing product:', error);
    return res.status(500).json({ message: 'Error removing product' });
  }
});


router.post('/api/reservations', async (req, res) => {
  try {
    const { name, email, date, hour, minute, period, mobile, guests, _id } = req.body;
    // Additional validation if needed
    if (!name || !email || !date || !hour || !minute || !period || !mobile || !guests || !_id) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }
    // Create a new reservation
    const newReservation = new TableBooking({
      user: _id, // Assign the user ID to the reservation
      name,
      email,
      date,
      hour,
      minute,
      period,
      mobile,
      guests,
    });

    // Save the reservation to the database
    await newReservation.save();

    // Update the user's tablebooked array with the new reservation's ID
    const updateUser = await userdb.findByIdAndUpdate(_id, {
      $push: { tablebooked: newReservation._id },
    });

    return res.status(201).json({ success: true, message: 'Reservation successfully saved!' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'An error occurred while saving the reservation.' });
  }
});

router.get('/user/booked/table', authenticate, async (req, res) => {
  try {
    const user = req.userId; // Authenticated user object from middleware
    const reservations = await TableBooking.find({ user: user._id });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
});
// Fetch all orders for a specific user
router.get("/user/orders", authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({ user: userId })
      .populate("products.productId", "productName price imageName")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "An error occurred while fetching orders" });
  }
});

router.delete('/user/cancel/booked/table/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Find and delete the reservation by orderId
    const deletedReservation = await TableBooking.findOneAndDelete({ _id: orderId });

    if (!deletedReservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    // Update the user's tablebooked array
    const userId = deletedReservation.user; // Assuming this is the user's ID associated with the reservation
    await userdb.findByIdAndUpdate(userId, {
      $pull: { tablebooked: orderId },
    });

    res.status(200).json({ message: 'Reservation cancelled successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while cancelling the reservation.' });
  }
});

// admin reserved table
router.get('/admin/adminbooktable', adminauth, async (req, res) => {
  try {
    const reservations = await TableBooking.find();
    res.status(200).json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'An error occurred while fetching reservations.' });
  }
});
// modify table booking order
router.put('/admin/confirm-table', adminauth, async (req, res) => {
  const { reservationId } = req.body;

  try {
    const reservation = await TableBooking.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    reservation.status = 'confirmed';
    await reservation.save();

    // Update user's tablebooked array
    const user = await userdb.findByIdAndUpdate(reservation.user, {
      $push: { tablebooked: reservationId }
    });

    res.status(200).json({ message: 'Table reservation confirmed.' });
  } catch (error) {
    console.error('Error confirming table reservation:', error);
    res.status(500).json({ message: 'An error occurred while confirming table reservation.' });
  }
});

router.delete('/admin/cancel-table', adminauth, async (req, res) => {
  const { reservationId } = req.body;

  try {
    const reservation = await TableBooking.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const userId = reservation.user;

    await TableBooking.deleteOne({ _id: reservationId });

    // Remove reservation ID from user's tablebooked array
    await userdb.findByIdAndUpdate(userId, {
      $pull: { tablebooked: reservationId }
    });

    res.status(200).json({ message: 'Table reservation canceled.' });
  } catch (error) {
    console.error('Error canceling table reservation:', error);
    res.status(500).json({ message: 'An error occurred while canceling table reservation.' });
  }
});

// POST request to add an offer banner with image upload
router.post("/admin/add-offer-banner", upload.single("imageFile"), async (req, res) => {
  try {
    const { title } = req.body;
    const imageUrl = req.file.filename; // Use the saved file name as the image URL

    const offerBanner = new OfferBanner({
      title,
      imageUrl,
    });

    await offerBanner.save();
    res.status(201).json({ message: "Offer Banner Added" });
  } catch (error) {
    console.error("Error adding offer banner:", error);
    res.status(500).json({ message: "Failed to add offer banner" });
  }
});


// Fetch all offer banners
router.get('/admin/get-offer-banners', adminauth, async (req, res) => {
  try {
    const banners = await OfferBanner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch offer banners' });
  }
});
// Fetch all offer banners for user
router.get('/get-offer-banners', async (req, res) => {
  try {
    const banners = await OfferBanner.find();
    res.status(200).json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch offer banners' });
  }
});

// Delete an offer banner by ID
router.delete('/admin/delete-offer-banner/:id', adminauth, async (req, res) => {
  try {
    const bannerId = req.params.id;
    const deletedBanner = await OfferBanner.findByIdAndDelete(bannerId);

    if (!deletedBanner) {
      return res.status(404).json({ message: 'Offer banner not found' });
    }

    res.status(200).json({ message: 'Offer banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete offer banner' });
  }
});

// POST request to add a sponsored add with image upload
router.post("/admin/add-sponsored-add", upload.single("imageFile"), async (req, res) => {
  try {
    const { title } = req.body;
    const imageUrl = req.file.filename; // Use the saved file name as the image URL

    const sponsoredAdd = new SponsoredAdds({
      title,
      imageUrl,
    });

    await sponsoredAdd.save();
    res.status(201).json({ message: "Sponsored Add Added" });
  } catch (error) {
    console.error("Error adding sponsored add:", error);
    res.status(500).json({ message: "Failed to add sponsored add" });
  }
});

// Fetch all sponsored adds
router.get('/admin/get-sponsored-adds', adminauth, async (req, res) => {
  try {
    const adds = await SponsoredAdds.find();
    res.status(200).json(adds);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sponsored adds' });
  }
});
// Fetch all sponsored adds for user
router.get('/get-sponsored-adds', async (req, res) => {
  try {
    const adds = await SponsoredAdds.find();
    res.status(200).json(adds);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sponsored adds' });
  }
});

// Delete a sponsored add by ID
router.delete('/admin/delete-sponsored-add/:id', adminauth, async (req, res) => {
  try {
    const addId = req.params.id;
    const deletedAdd = await SponsoredAdds.findByIdAndDelete(addId);

    if (!deletedAdd) {
      return res.status(404).json({ message: 'Sponsored add not found' });
    }

    res.status(200).json({ message: 'Sponsored add deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete sponsored add' });
  }
});

// Route to add a new video
router.post("/admin/add-video", async (req, res) => {
  try {
    const { title, videoLink } = req.body;
    const newVideo = new vdoadds({
      title,
      link:videoLink,
    });
    const savedVideo = await newVideo.save();
    res.status(201).json(savedVideo);
  } catch (error) {
    console.error("Error adding video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Route to get all videos
router.get("/admin/get-videos", async (req, res) => {
  try {
    const videos = await vdoadds.find();
    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to delete a video by ID
router.delete("/admin/delete-video/:videoId", async (req, res) => {
  try {
    const { videoId } = req.params;
    const deletedVideo = await vdoadds.findByIdAndDelete(videoId);

    if (deletedVideo) {
      res.status(200).json({ message: "Video deleted successfully" });
    } else {
      res.status(404).json({ message: "Video not found" });
    }
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Define the video upload route
router.post('/videos', adminauth,uploadvideo.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }
    // Create a new video document in the database
    const newVideo = new vdoadds({
      title: req.body.title,
      videoUrl: req.file.filename, // Store the filename in the database
    });

    // Save the video document
    await newVideo.save();

    res.status(201).json({ message: 'Video uploaded and saved successfully' });
  } catch (error) {
    console.error('Error uploading and saving video:', error);
    res.status(500).json({ message: 'An error occurred while uploading and saving video' });
  }
});

// Update a video's title
router.put('/edit-video/:id', async (req, res) => {
  try {
    const videoId = req.params.id;
    const { title } = req.body;

    // Find the video by ID
    const video = await vdoadds.findById(videoId);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Update the video's title
    video.title = title;
    await video.save();

    res.status(200).json({ message: 'Video edited successfully' });
  } catch (error) {
    console.error('Error editing video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a video
router.delete('/delete-video/:id', async (req, res) => {
  try {
    const videoId = req.params.id;

    // Find the video by ID and delete it
    await vdoadds.findByIdAndDelete(videoId);

    res.status(200).json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Fetch admin orders
router.get("/admin/orders/edit", adminauth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Route to cancel an order and initiate a refund
router.delete("/user/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const canceledOrder = await Order.findOneAndUpdate(
      { _id: orderId, status: { $ne: "Delivered" } }, // Check if order is not delivered
      { status: "Cancelled" },
      { new: true }
    );

    if (!canceledOrder) {
      return res.status(400).json({ message: "Unable to cancel the order." });
    }

    // Initiate refund using Razorpay API
    const paymentId = canceledOrder.paymentResponse.razorpay_payment_id;
    const refundResponse = await razorpay.payments.refund(paymentId, {
      amount: canceledOrder.products[0].price * canceledOrder.products[0].quantity * 100,
    });

    if (refundResponse.status === "processed") {
      // Store refund details in the order document
      canceledOrder.refund = {
        refundId: refundResponse.id,
        refundAmount: refundResponse.amount / 100,
        refundDate: new Date(),
      };

      await canceledOrder.save();
      return res.status(200).json({ message: "Order cancelled and refunded successfully." });
    } else {
      return res.status(500).json({ message: "Error processing refund." });
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "An error occurred while cancelling the order." });
  }
});


// Route to cancel an order and initiate a refund
router.delete("/admin/orders/:orderId", async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status === "Cancelled" || order.status === "Delivered") {
      return res.status(400).json({ message: "Cannot cancel or refund this order." });
    }

    // Initiate refund using axios
    const refundResponse = await axios.post(
      `https://api.razorpay.com/v1/payments/${order.paymentResponse.razorpay_payment_id}/refund`,
      { amount: order.products[0].price * order.products[0].quantity * 100 }, // Refund amount in paisa
      {
        auth: {
          username: process.env.RAZORPAY_KEY,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
      }
    );

    if (refundResponse.status === 200) {
      // Update order status to "Cancelled"
      order.status = "Cancelled";
      const cancelledOrder = await order.save();
      res.status(200).json({ message: "Order cancelled and refund initiated." });
    } else {
      res.status(500).json({ message: "Failed to initiate refund." });
    }
  } catch (error) {
    console.error("Error cancelling order and initiating refund:", error);
    res.status(500).json({ message: "An error occurred while cancelling the order and initiating refund." });
  }
});

// Route to handle the form submission and store the logo in the database
router.post('/admin/upload', upload.single('logoimage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Create a new Logo document
    const newLogo = new Logo({
      image: req.file.filename, // Save the filename of the uploaded image
    });

    // Save the logo to the database
    await newLogo.save();

    res.status(201).json({ status:201});
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get the logo image URL
router.get("/get-logo", async (req, res) => {
  try {
    const logo = await Logo.find(); // Assuming you have only one logo document
    if (logo.length > 0) {
      const lastLogo = logo[logo.length - 1]; // Get the last logo document
      const logoImageURL = lastLogo.image; // Extract the image URL from the last logo document
      res.status(200).json({ logoImage: logoImageURL });
    } else {
      res.status(404).json({ error: "No logo found" });
    }
  } catch (error) {
    console.error("Error fetching logo:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});



module.exports = router;
