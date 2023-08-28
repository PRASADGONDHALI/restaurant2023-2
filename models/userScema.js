const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {userdatabase} = require('../db/conn')
const {TableBooking} =require('./companySchema');
const {Order} =require('./companySchema');

const keysecret = process.env.SECRET_KEY

const cartItemSchema = new mongoose.Schema({
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Category"
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product"
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    }
  });


  
const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("not valid email")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    cpassword: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'], // Define possible roles
        default: 'user' // Default role is 'user'
      },
   
    tokens: [
        {
            token: {
                type: String,
                required: true,
            }
        }
    ],
    cart: [cartItemSchema],
      tablebooked: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TableBooking', // Reference the TableBooking model
      }],
      orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order', // Reference the TableBooking model
      }],
});


userSchema.pre("save", async function (next) {

    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
        this.cpassword = await bcrypt.hash(this.cpassword, 12);
    }
    next()
});


// token generate
userSchema.methods.generateAuthtoken = async function () {
    try {
        let token23 = jwt.sign({ _id: this._id }, keysecret, {
            expiresIn: "1d"
        });

        this.tokens = this.tokens.concat({ token: token23 });
        await this.save();
        return token23;
    } catch (error) {
        res.status(422).json(error)
    }
}
// admin generate token
userSchema.methods.generateAuthAdmintoken = async function () {
    try {
        let token23 = jwt.sign({ _id: this._id, role: this.role }, keysecret, {
            expiresIn: "1d"
        });

        this.tokens = this.tokens.concat({ token: token23 });
        await this.save();
        return token23;
    } catch (error) {
        res.status(422).json(error)
    }
}

// createing model
const userdb = userdatabase.model("users", userSchema);

module.exports = userdb;