const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid'); // For generating unique order IDs

// Initialize Razorpay instance with your API key and secret
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const userdb = require("../models/userScema");
const Category = require("../models/categorySchema");
const {Order} = require("../models/companySchema");
const authenticate = require("../middleware/authenticate");
const adminauth = require("../middleware/adminauth");

router.post("/user/place-order", authenticate, async (req, res) => {
  try {
    const { categoryId, productId, quantity } = req.body;
    const userId = req.userId;

    // Validate input
    if (!categoryId || !productId || !quantity || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: "Invalid input" });
    }

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
    const product = category.products.find((prod) => prod._id.toString() === productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Calculate total price
    const totalPrice = product.price * quantity;

    // Create the order document
    const orderItem = {
      categoryId,
      productId,
      quantity,
      price: product.price, // You may need to adjust this based on your data structure
    };

    // Save the order
    const order = new Order({
      user: userId,
      products: [orderItem],
      status: 'pending', // Set initial status
    });
    await order.save();

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

router.post('/createOrder', async (req, res) => {
  try {
    const amount = 10000; // Amount in paisa (e.g., 10000 = ₹100)
    const currency = 'INR';
    const options = {
      amount,
      currency,
      receipt: uuidv4(), // Unique identifier for the order
    };

    const order = await razorpay.orders.create(options);

    res.json({ orderId: order.id, amount });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Unable to create order' });
  }
});

module.exports = router;
