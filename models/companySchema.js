const mongoose = require('mongoose');
const {companydb} = require('../db/conn')
const userdb = require('./userScema');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userdb', // Reference to the User model
    required: true,
  },
  products: [
    {
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      productName: {
        type: String,
        required: true,
      },
      productImage: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  shippingAddress: {
    fullName: {
      type: String,
      required: true,
    },
    flatNo: String,
    area: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  billingAddress: {
    fullName: {
      type: String,
      required: true,
    },
    flatNo: String,
    area: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'shipped', 'delivered','Cancelled'],
    default: 'pending',
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  paymentResponse: {
    razorpay_payment_id: String,
    razorpay_order_id: String,
    razorpay_signature: String,
  },
});

const tableBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'userdb', // Reference the User model
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  hour: {
    type: String,
    required: true,
  },
  minute: {
    type: String,
    required: true,
  },
  period: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  guests: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true, // Add createdAt and updatedAt timestamps
});


const offerBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const SponsoredAddsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Define the Video schema
const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});


const logoSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
  },
});



const TableBooking = companydb.model('datas', tableBookingSchema);
const OfferBanner = companydb.model('offerbanner', offerBannerSchema);
const SponsoredAdds = companydb.model('sponsoredadds', SponsoredAddsSchema);
const vdoadds = companydb.model('videoSchema', videoSchema);
const Order = companydb.model('Order', orderSchema);
const Logo = companydb.model('logo', logoSchema);


module.exports = {TableBooking,OfferBanner,SponsoredAdds,vdoadds,Order,Logo};


